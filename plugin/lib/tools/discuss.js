/**
 * The `multi_model_discuss` tool (doc §3).
 *
 * This is how a run is normally started from inside a conversation: the agent
 * (or the user, via the model) hands a request to the orchestration and gets
 * the lead model's synthesised answer back as a tool result.
 *
 * Why a tool rather than a slash command or a hook: the decision to escalate
 * to a multi-model discussion is a judgement call about the *question*, which
 * is exactly what a model is good at and a trigger rule is bad at.
 *
 * `wait: false` returns immediately with a run id, for questions whose
 * progress the user would rather watch in the discussion view.
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { PRESET_DESCRIPTIONS, PRESET_LABELS, PRESET_NAMES } from "../core/preset.js";
/** Tool name. Namespaced to avoid colliding with other discussion plugins. */
export const DISCUSS_TOOL_NAME = 'multi_model_discuss';
/** How long a `wait: true` call may block before handing back a run id. */
const WAIT_TIMEOUT_MS = 10 * 60 * 1000;
/**
 * Build the tool definition.
 *
 * The description matters more than usual here: it is the only thing telling
 * the calling model when escalation is worth its cost, so it states the
 * trade-off explicitly instead of just describing the mechanism.
 */
export function createDiscussTool(options) {
    const { store, orchestrator, config } = options;
    return defineTool({
        name: DISCUSS_TOOL_NAME,
        description: [
            '把当前需求交给一组模型进行独立研讨，再由主导模型拍板、生成计划并执行，最后汇总答复。',
            '',
            '适用场景：',
            '- 需求复杂或存在多种可选路线，希望听到多种独立判断；',
            '- 结论影响较大，需要交叉评审或验证；',
            '- 希望把"方案讨论 → 执行"合成一次调用。',
            '',
            '不适用场景：',
            '- 简单直接的问题（会显著增加耗时与成本）；',
            '- 需要与你反复确认细节的任务（应直接对话）。',
            '',
            `研讨深度由 preset 控制：${PRESET_NAMES.filter((name) => name !== 'custom')
                .map((name) => `${name}（${PRESET_DESCRIPTIONS[name]}）`)
                .join('；')}。`,
            '',
            '默认会等待研讨完成并直接返回最终答复。若希望立即返回、稍后查看进度，请设置 wait=false。',
        ].join('\n'),
        parameters: {
            request: {
                type: 'string',
                required: true,
                description: '要研讨的需求，写清楚目标与约束。',
            },
            preset: {
                type: 'string',
                description: `研讨深度：${PRESET_NAMES.join(' | ')}，默认使用当前配置的 preset。`,
            },
            wait: {
                type: 'boolean',
                description: '是否等待研讨完成后再返回结果，默认 true。',
            },
        },
        output: {
            schema: { type: 'string' },
            render: (_args, value) => [{ type: 'text', text: value }],
        },
        async execute(args) {
            const input = args;
            if (!config().enabled) {
                return '多模型研讨插件当前被配置禁用（enabled=false），无法发起研讨。';
            }
            const preset = normalisePreset(input.preset);
            let state;
            try {
                state = orchestrator.start({
                    request: input.request,
                    ...(preset ? { preset } : {}),
                });
            }
            catch (cause) {
                // Roster problems are config problems; return them as text so the
                // calling model can report something actionable to the user.
                return `无法启动多模型研讨：${cause instanceof Error ? cause.message : String(cause)}`;
            }
            if (input.wait === false) {
                return [
                    `已启动多模型研讨（run ${state.runId}，模式：${PRESET_LABELS[state.blackboard.rounds.length >= 0 ? preset ?? config().preset : 'balanced']}）。`,
                    '',
                    `参与模型：${state.participants.map((p) => `${p.label}(${p.role})`).join('、')}`,
                    '',
                    '研讨在后台进行，可在会话的「多模型研讨」视图中查看进度。',
                ].join('\n');
            }
            const finished = await waitForRun(store, state.runId, WAIT_TIMEOUT_MS);
            if (!finished) {
                return `多模型研讨仍在进行中（run ${state.runId}），请稍后在「多模型研讨」视图中查看结果。`;
            }
            if (finished.blackboard.finalAnswer) {
                return finished.blackboard.finalAnswer;
            }
            return summariseTerminalState(finished);
        },
    });
}
/** Validate a caller-supplied preset name. */
function normalisePreset(value) {
    if (value === undefined)
        return undefined;
    const trimmed = value.trim();
    return PRESET_NAMES.includes(trimmed) ? trimmed : undefined;
}
/**
 * Wait for a run to settle.
 *
 * Subscribes rather than polls: run-state changes are already published on
 * every mutation, so polling would only add latency. The timeout exists so a
 * request can never hang a conversation indefinitely.
 */
function waitForRun(store, runId, timeoutMs) {
    const immediate = store.get(runId);
    if (immediate?.settled)
        return Promise.resolve(immediate.state);
    return new Promise((resolve) => {
        const finish = (state) => {
            clearTimeout(timer);
            unsubscribe();
            resolve(state);
        };
        const unsubscribe = store.subscribe((state) => {
            if (state.runId !== runId)
                return;
            if (state.phase === 'completed' || state.phase === 'failed' || state.phase === 'stopped') {
                finish(state);
            }
        });
        const timer = setTimeout(() => finish(undefined), timeoutMs);
    });
}
/** Fallback text when a settled run produced no final answer. */
function summariseTerminalState(state) {
    const { blackboard } = state;
    const lines = [];
    if (state.phase === 'failed') {
        const error = [...state.notices].reverse().find((notice) => notice.level === 'error');
        lines.push(`多模型研讨失败：${error?.message ?? '未说明原因'}`);
    }
    else if (state.phase === 'stopped') {
        lines.push('多模型研讨已被停止。');
    }
    else {
        lines.push('多模型研讨已完成，但没有生成最终答复。');
    }
    if (blackboard.proposals.length > 0) {
        lines.push('', `共产生 ${blackboard.proposals.length} 个方案：`);
        for (const proposal of blackboard.proposals) {
            lines.push(`- [${proposal.id}] ${proposal.summary}`);
        }
    }
    if (blackboard.decision) {
        lines.push('', `最终方向：${blackboard.decision.finalDirection}`);
    }
    if (blackboard.execution) {
        lines.push('', `执行结果：${blackboard.execution.status}`);
        for (const output of blackboard.execution.outputs) {
            lines.push(`- ${output.stepId}: ${output.status}${output.error ? ` — ${output.error}` : ''}`);
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=discuss.js.map