import { createToolResultMessage, createUserMessage } from '@deepseek-ai/dsh-llm';
import { EXECUTION_REPORT_SYSTEM, buildExecutionPrompt, buildExecutionReportPrompt, buildExecutorSystem, truncate, } from "../core/prompts.js";
import { mergeSystem } from "./discussion-engine.js";
import { StructuredOutputError, parseStructured } from "../utils/json.js";
/** Raised when the plan references a state the executor cannot act on. */
export class ExecutionSetupError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExecutionSetupError';
    }
}
export class Executor {
    ctx;
    registry;
    sandbox;
    /**
     * The agent session that started this run, when there was one.
     *
     * Tool calls carry it so the sandbox policy and workspace root resolve from
     * that session rather than from the deployment default. A run started from
     * the discussion view's own HTTP route has no agent and keeps the default.
     */
    agent;
    blackboard;
    logger;
    onParticipant;
    onNotice;
    onUsage;
    constructor(options) {
        this.ctx = options.ctx;
        this.registry = options.registry;
        this.sandbox = options.sandbox;
        this.agent = options.agent;
        this.blackboard = options.blackboard;
        this.logger = options.logger;
        this.onParticipant = options.onParticipant ?? (() => { });
        this.onNotice = options.onNotice ?? (() => { });
        this.onUsage = options.onUsage ?? (() => { });
    }
    /**
     * Execute one plan with one profile.
     *
     * @param plan - the structured plan; treated as immutable input.
     * @param profile - the executor profile.
     * @param signal - run cancellation.
     * @returns the execution result, also written to the blackboard.
     */
    /**
     * Tool names this executor could actually dispatch right now.
     *
     * Read by the plan builder so it plans against the real capability set
     * instead of inventing tool names the dispatcher then rejects.
     */
    availableToolNames() {
        try {
            return this.sandbox.visibleTools(this.ctx.tools.schemas(this.agent)).map((tool) => tool.name);
        }
        catch {
            return [];
        }
    }
    async execute(plan, profile, signal) {
        if (plan.steps.length === 0) {
            throw new ExecutionSetupError('Cannot execute a plan with no steps.');
        }
        // Asking for the calling agent's view means the executor sees the same tools
        // that session does (including tools a preset declared) instead of only the
        // process-global ones.
        const visibleTools = this.sandbox.visibleTools(this.ctx.tools.schemas(this.agent));
        const system = mergeSystem(profile.systemPrompt, buildExecutorSystem(visibleTools.map((tool) => tool.name), this.sandbox.maxSteps));
        if (plan.mutatesState && visibleTools.length === 0) {
            // Execute anyway — the model can still describe what a human should do.
            // But say so, because a plan that expects to change state and cannot is
            // a configuration mismatch the operator should see.
            this.onNotice({
                level: 'warn',
                message: '计划涉及状态变更，但本次没有任何可用工具，执行模型只能给出步骤说明。',
            });
        }
        const messages = [
            createUserMessage({
                content: [{ type: 'text', text: buildExecutionPrompt(plan) }],
                source: { kind: 'user' },
            }),
        ];
        const transcript = [];
        const outputs = [];
        let turns = 0;
        let stoppedReason = 'completed';
        let inputTokens = 0;
        let outputTokens = 0;
        let costUsd = 0;
        const startedAt = Date.now();
        this.onParticipant(profile.id, {
            state: 'thinking',
            phase: 'executing',
            startedAt,
            finishedAt: undefined,
            error: undefined,
        });
        while (turns < this.sandbox.maxSteps) {
            if (signal.aborted) {
                stoppedReason = 'aborted';
                break;
            }
            turns++;
            const response = await this.registry.call(profile.id, {
                messages,
                system,
                tools: visibleTools,
                signal,
                onUsage: this.onUsage,
            });
            inputTokens += response.usage.inputTokens;
            outputTokens += response.usage.outputTokens;
            if (!response.ok) {
                stoppedReason = response.finish.kind === 'aborted' ? 'aborted' : 'error';
                transcript.push({ turn: turns, kind: 'text', text: `模型调用失败：${response.error ?? ''}` });
                break;
            }
            if (response.text.trim() !== '') {
                transcript.push({ turn: turns, kind: 'text', text: truncate(response.text, 1000) });
            }
            // Always append the assistant turn: a tool-call block must be followed by
            // its result, or the next request is malformed.
            messages.push(response.message);
            if (response.finish.kind !== 'tool-calls' || response.toolCalls.length === 0) {
                // The model is done. Its closing prose is not the structured result —
                // that comes from the report pass below.
                break;
            }
            for (const call of response.toolCalls) {
                const { content, isError, note } = await this.dispatchTool(call, signal);
                if (note) {
                    transcript.push({ turn: turns, kind: 'denied', text: note });
                }
                else {
                    outputs.push(summarizeToolCall(call.name, content, isError, turns));
                    transcript.push({
                        turn: turns,
                        kind: 'tool',
                        text: `${call.name}(${truncate(call.arguments, 300)}) -> ${isError ? 'ERROR' : 'OK'}`,
                    });
                }
                messages.push(createToolResultMessage({
                    callId: call.id,
                    content,
                    isError,
                }));
            }
        }
        if (turns >= this.sandbox.maxSteps && stoppedReason === 'completed') {
            stoppedReason = 'max-steps';
            this.onNotice({
                level: 'warn',
                message: `执行达到最大轮数上限（${this.sandbox.maxSteps} 轮），未完成的部分不会继续执行。`,
            });
        }
        // Structured closing report: the transcript above records what the tools
        // did, this records what the *plan's steps* ended up as, which is what the
        // verifier actually checks against.
        const reported = await this.collectReport(plan, profile, system, messages, transcript, signal);
        inputTokens += reported.inputTokens;
        outputTokens += reported.outputTokens;
        const finalOutputs = reported.outputs.length > 0 ? reported.outputs : outputs;
        const result = {
            planId: plan.id,
            status: reported.status ?? deriveStatus(finalOutputs, stoppedReason),
            outputs: finalOutputs,
            executorProfileId: profile.id,
            turns,
            stoppedReason,
            usage: {
                inputTokens,
                outputTokens,
                durationMs: Date.now() - startedAt,
                costUsd,
            },
        };
        this.onParticipant(profile.id, { state: 'done', phase: 'executing', finishedAt: Date.now() });
        this.blackboard.setExecution(result);
        return result;
    }
    /**
     * Check and run one tool call.
     *
     * Returns either model-facing content to feed back, or a `note` meaning the
     * call never ran. A denial is fed back as a *successful* tool result carrying
     * the refusal text: that keeps the conversation well-formed while still
     * telling the model, in the place it will actually read, that the step is
     * blocked.
     */
    async dispatchTool(call, signal) {
        const decision = this.sandbox.decide(call.name);
        if (decision.kind === 'deny') {
            this.onNotice({ level: 'warn', message: `执行器被拒绝调用工具 ${call.name}：${decision.reason}` });
            this.logger?.warn('tool %s denied: %s', call.name, decision.reason);
            return {
                content: [{ type: 'text', text: `[被沙箱拒绝] ${decision.reason}` }],
                isError: false,
                note: `拒绝 ${call.name}：不在白名单内`,
            };
        }
        if (decision.kind === 'confirm') {
            // No interactive approval channel is wired for this phase, so an
            // unconfirmed write is refused rather than silently allowed. That is the
            // safe default; an operator who wants unattended writes turns the
            // requirement off explicitly in config.
            this.onNotice({ level: 'warn', message: `执行器跳过了需要确认的工具 ${call.name}：${decision.reason}` });
            this.logger?.warn('tool %s skipped pending confirmation', call.name);
            return {
                content: [
                    {
                        type: 'text',
                        text: `[需要人工确认，已跳过] ${decision.reason}\n` +
                            `在当前配置下没有可用的确认通道，因此该步骤未执行。请在汇报中将其标记为 skipped。`,
                    },
                ],
                isError: false,
                note: `跳过 ${call.name}：需要人工确认`,
            };
        }
        let args;
        try {
            args = call.arguments.trim() === '' ? {} : JSON.parse(call.arguments);
        }
        catch {
            return {
                content: [{ type: 'text', text: `[参数解析失败] 工具参数不是合法 JSON：${truncate(call.arguments, 200)}` }],
                isError: true,
            };
        }
        try {
            const result = await this.ctx.tools.execute({
                callId: call.id,
                name: call.name,
                arguments: args,
                signal,
                ...(this.agent ? { agent: this.agent } : {}),
            });
            return { content: result.content, isError: result.isError };
        }
        catch (cause) {
            const message = cause instanceof Error ? cause.message : String(cause);
            this.logger?.warn('tool %s threw: %s', call.name, message);
            return {
                content: [{ type: 'text', text: `[工具执行异常] ${message}` }],
                isError: true,
            };
        }
    }
    /**
     * Ask the executor to report each plan step's outcome as structured data.
     *
     * Best-effort: if the report cannot be parsed, the caller falls back to the
     * raw transcript-derived outputs, so a formatting failure never costs the
     * run its results.
     */
    async collectReport(plan, profile, system, messages, transcript, signal) {
        const rendered = transcript.map((entry) => `[turn ${entry.turn}][${entry.kind}] ${entry.text}`).join('\n');
        try {
            const response = await this.registry.call(profile.id, {
                messages: [
                    ...messages,
                    createUserMessage({
                        content: [{ type: 'text', text: buildExecutionReportPrompt(plan, rendered) }],
                        source: { kind: 'user' },
                    }),
                ],
                system: mergeSystem(system, EXECUTION_REPORT_SYSTEM),
                signal,
                onUsage: this.onUsage,
            });
            if (!response.ok) {
                return { outputs: [], inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens };
            }
            const knownSteps = new Map(plan.steps.map((step) => [step.id, step]));
            const parsed = parseStructured(response.text, (raw) => {
                if (typeof raw !== 'object' || raw === null) {
                    throw new StructuredOutputError('Expected a JSON object for the execution report.', response.text);
                }
                const o = raw;
                const list = o.steps;
                if (!Array.isArray(list)) {
                    throw new StructuredOutputError('Execution report needs a "steps" array.', response.text);
                }
                const outputs = [];
                for (const entry of list) {
                    if (typeof entry !== 'object' || entry === null)
                        continue;
                    const s = entry;
                    const id = typeof s.id === 'string' ? s.id.trim() : '';
                    const step = knownSteps.get(id);
                    // Ignore reports about steps the plan does not contain.
                    if (!step)
                        continue;
                    const status = s.status === 'success' || s.status === 'failed' || s.status === 'skipped' ? s.status : 'skipped';
                    const summary = typeof s.summary === 'string' ? s.summary : '';
                    const error = typeof s.error === 'string' && s.error.trim() !== '' ? s.error : undefined;
                    outputs.push({
                        stepId: id,
                        status,
                        ...(summary !== '' ? { rendered: summary } : {}),
                        ...(error ? { error } : {}),
                    });
                }
                if (outputs.length === 0) {
                    throw new StructuredOutputError('Execution report named no known step.', response.text);
                }
                // `o` is Record<string, unknown>, so the comparison does not narrow;
                // assert the literal explicitly and fall back to deriving it later.
                const overall = o.overall === 'success' || o.overall === 'partial' || o.overall === 'failed'
                    ? o.overall
                    : undefined;
                return { outputs, overall };
            });
            // Fill in any step the report omitted, so the verifier sees a complete set.
            const reported = new Set(parsed.outputs.map((output) => output.stepId));
            const outputs = [...parsed.outputs];
            for (const step of plan.steps) {
                if (!reported.has(step.id)) {
                    outputs.push({
                        stepId: step.id,
                        status: 'skipped',
                        error: '执行器未汇报该步骤的结果。',
                    });
                }
            }
            return {
                outputs,
                status: parsed.overall,
                inputTokens: response.usage.inputTokens,
                outputTokens: response.usage.outputTokens,
            };
        }
        catch (cause) {
            this.logger?.warn('execution report failed: %s', cause.message);
            return { outputs: [], inputTokens: 0, outputTokens: 0 };
        }
    }
}
/** Turn a raw tool result into a step output line for the fallback path. */
function summarizeToolCall(toolName, content, isError, turn) {
    const text = content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');
    return {
        stepId: `tool-turn-${turn}-${toolName}`,
        status: isError ? 'failed' : 'success',
        rendered: truncate(text, 1000),
        ...(isError ? { error: truncate(text, 300) } : {}),
    };
}
/** Derive an overall status when the report did not supply one. */
function deriveStatus(outputs, stoppedReason) {
    if (outputs.length === 0)
        return stoppedReason === 'aborted' ? 'failed' : 'partial';
    const failed = outputs.filter((output) => output.status === 'failed').length;
    const succeeded = outputs.filter((output) => output.status === 'success').length;
    if (failed === 0 && succeeded > 0)
        return 'success';
    if (succeeded === 0)
        return 'failed';
    return 'partial';
}
//# sourceMappingURL=executor.js.map