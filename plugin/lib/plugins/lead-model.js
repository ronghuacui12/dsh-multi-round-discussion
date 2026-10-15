/**
 * The lead model (doc §2.1).
 *
 * Four jobs, one owner, because they all need the same thing — the widest view
 * of the run and the authority to close it:
 *
 *   clarify   -> is this request answerable as stated?
 *   decide    -> pick / fuse / reject, and record why
 *   buildPlan -> turn the direction into a structure the executor cannot bend
 *   answer    -> the only place the run talks to the user
 *
 * It is deliberately NOT a participant in proposal generation. A model that
 * both proposes and judges its own proposal is the failure mode the design
 * document exists to avoid.
 */
import { randomUUID } from 'node:crypto';
import { isReadOnlyTool } from "../core/sandbox.js";
import { CLARIFY_SYSTEM, DECISION_SYSTEM, FINAL_ANSWER_SYSTEM, PLAN_SYSTEM, buildClarifyPrompt, buildDecisionPrompt, buildFinalAnswerPrompt, buildPlanPrompt, } from "../core/prompts.js";
import { mergeSystem } from "./discussion-engine.js";
import { StructuredOutputError, optionalStringArray, parseStructured, requireString, salvageText, } from "../utils/json.js";
/** Raised when the lead model fails to produce a usable decision. */
export class DecisionError extends Error {
    raw;
    constructor(message, raw) {
        super(message);
        this.raw = raw;
        this.name = 'DecisionError';
    }
}
/** Raised when the lead model fails to produce a usable plan. */
export class PlanError extends Error {
    raw;
    constructor(message, raw) {
        super(message);
        this.raw = raw;
        this.name = 'PlanError';
    }
}
export class LeadModel {
    registry;
    onUsage;
    /**
     * @param registry - the shared model gateway.
     * @param onUsage - per-call usage sink bound to this run's budget guard.
     *   Passed per call rather than subscribed globally so concurrent runs do
     *   not charge each other's budgets.
     */
    constructor(registry, onUsage = () => { }) {
        this.registry = registry;
        this.onUsage = onUsage;
    }
    /**
     * Ask whether the request can proceed, or needs the user to fill a gap.
     *
     * Fails open: if the lead model cannot be parsed into a verdict, the run
     * proceeds rather than parking the user on a question we could not even
     * formulate. A malformed verdict is not evidence that the request is unclear.
     */
    async clarify(profile, originalRequest, clarification, signal) {
        const response = await this.registry.call(profile.id, {
            prompt: buildClarifyPrompt(originalRequest, clarification),
            system: mergeSystem(profile.systemPrompt, CLARIFY_SYSTEM),
            signal,
            onUsage: this.onUsage,
        });
        if (!response.ok) {
            return { clear: true, questions: [], understanding: originalRequest };
        }
        try {
            return parseStructured(response.text, (raw) => {
                if (typeof raw !== 'object' || raw === null) {
                    throw new StructuredOutputError('Expected a JSON object for the clarification verdict.', response.text);
                }
                const o = raw;
                const questions = optionalStringArray(o.questions).slice(0, 3);
                const clear = o.clear === true || questions.length === 0;
                return {
                    clear,
                    questions: clear ? [] : questions,
                    understanding: typeof o.understanding === 'string' && o.understanding.trim() !== ''
                        ? o.understanding
                        : originalRequest,
                };
            });
        }
        catch {
            return { clear: true, questions: [], understanding: originalRequest };
        }
    }
    /**
     * Take the binding decision.
     *
     * Enforces one invariant the model cannot be trusted to keep: every proposal
     * is either adopted or rejected. Anything it omits is auto-rejected and
     * reported, so the decision record is always a partition of the real set —
     * otherwise "why wasn't P3 considered?" would have no answer in the audit
     * trail.
     */
    async decide(profile, slice, round, signal) {
        const response = await this.registry.call(profile.id, {
            prompt: buildDecisionPrompt(slice),
            system: mergeSystem(profile.systemPrompt, DECISION_SYSTEM),
            signal,
            onUsage: this.onUsage,
        });
        if (!response.ok) {
            throw new DecisionError(`决策模型调用失败：${response.error ?? response.errorCode ?? 'unknown'}`, '');
        }
        const known = new Set((slice.proposals ?? []).map((p) => p.id));
        const decision = parseStructured(response.text, (raw) => {
            if (typeof raw !== 'object' || raw === null) {
                throw new DecisionError('Expected a JSON object for the decision.', response.text);
            }
            const o = raw;
            const chosen = optionalStringArray(o.chosenProposalIds).filter((id) => known.has(id));
            const rejected = optionalStringArray(o.rejectedProposalIds).filter((id) => known.has(id));
            const rejectedSet = new Set(rejected);
            const dedupedChosen = chosen.filter((id) => !rejectedSet.has(id));
            return {
                id: `decision-${randomUUID().slice(0, 8)}`,
                decisionMakerProfileId: profile.id,
                chosenProposalIds: dedupedChosen,
                rejectedProposalIds: rejected,
                rationale: requireString(o.rationale, 'rationale'),
                finalDirection: requireString(o.finalDirection, 'finalDirection'),
                round,
                needsUserInput: o.needsUserInput === true,
            };
        });
        // Close the partition and report what had to be fixed.
        const accounted = new Set([...decision.chosenProposalIds, ...decision.rejectedProposalIds]);
        const autoRejected = [...known].filter((id) => !accounted.has(id));
        if (autoRejected.length > 0) {
            decision.rejectedProposalIds = [...decision.rejectedProposalIds, ...autoRejected];
        }
        return { decision, autoRejected };
    }
    /**
     * Turn the decision into a structured plan.
     *
     * `mutatesState` is recomputed here from the steps rather than trusted: a
     * plan containing a non-read-only tool mutates state regardless of what the
     * model wrote, and that flag is what gates confirmation in the executor.
     */
    async buildPlan(profile, originalRequest, decision, adopted, signal) {
        const response = await this.registry.call(profile.id, {
            prompt: buildPlanPrompt(originalRequest, decision, adopted),
            system: mergeSystem(profile.systemPrompt, PLAN_SYSTEM),
            signal,
            onUsage: this.onUsage,
        });
        if (!response.ok) {
            throw new PlanError(`计划生成调用失败：${response.error ?? response.errorCode ?? 'unknown'}`, '');
        }
        const planId = `plan-${randomUUID().slice(0, 8)}`;
        const plan = parseStructured(response.text, (raw) => {
            if (typeof raw !== 'object' || raw === null) {
                throw new PlanError('Expected a JSON object for the plan.', response.text);
            }
            const o = raw;
            const rawSteps = o.steps;
            if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
                throw new PlanError('Plan must contain a non-empty "steps" array.', response.text);
            }
            const steps = [];
            const seen = new Set();
            for (const entry of rawSteps) {
                if (typeof entry !== 'object' || entry === null)
                    continue;
                const s = entry;
                const id = typeof s.id === 'string' && s.id.trim() !== '' ? s.id.trim() : `s${steps.length + 1}`;
                if (seen.has(id)) {
                    throw new PlanError(`Duplicate step id "${id}" in plan.`, response.text);
                }
                seen.add(id);
                const tool = typeof s.tool === 'string' && s.tool.trim() !== '' ? s.tool.trim() : undefined;
                steps.push({
                    id,
                    description: requireString(s.description, `steps[${id}].description`),
                    ...(tool ? { tool } : {}),
                    ...(s.args !== undefined && s.args !== null ? { args: s.args } : {}),
                    ...(Array.isArray(s.dependsOn)
                        ? { dependsOn: optionalStringArray(s.dependsOn) }
                        : {}),
                    ...(typeof s.acceptance === 'string' && s.acceptance.trim() !== ''
                        ? { acceptance: s.acceptance }
                        : {}),
                    ...(typeof s.rollback === 'string' && s.rollback.trim() !== ''
                        ? { rollback: s.rollback }
                        : {}),
                });
            }
            if (steps.length === 0) {
                throw new PlanError('Plan contained no readable steps.', response.text);
            }
            // Dependencies must resolve, or the executor's topological walk would
            // silently skip steps it cannot order.
            const ids = new Set(steps.map((s) => s.id));
            for (const step of steps) {
                for (const dep of step.dependsOn ?? []) {
                    if (!ids.has(dep)) {
                        throw new PlanError(`Step "${step.id}" depends on unknown step "${dep}".`, response.text);
                    }
                }
            }
            // Derive the flag; do not trust the model's own answer.
            const mutatesState = steps.some((step) => step.tool != null && !isReadOnlyTool(step.tool));
            return {
                id: planId,
                decisionRefs: decision.chosenProposalIds,
                steps,
                ...(typeof o.acceptance === 'string' && o.acceptance.trim() !== ''
                    ? { acceptance: o.acceptance }
                    : {}),
                mutatesState,
                ...(typeof o.notes === 'string' && o.notes.trim() !== '' ? { notes: o.notes } : {}),
                planBuilderProfileId: profile.id,
            };
        });
        return plan;
    }
    /**
     * Compose the user-facing answer.
     *
     * Plain prose, not JSON: this is the one lead-model output a human reads
     * directly. A failure here degrades to a structured summary rather than
     * losing the run's results.
     */
    async finalAnswer(profile, slice, signal) {
        const response = await this.registry.call(profile.id, {
            prompt: buildFinalAnswerPrompt(slice),
            system: mergeSystem(profile.systemPrompt, FINAL_ANSWER_SYSTEM),
            signal,
            onUsage: this.onUsage,
        });
        if (response.ok && response.text.trim() !== '')
            return response.text.trim();
        return fallbackSummary(slice);
    }
}
/**
 * Deterministic summary used when the lead model cannot answer.
 *
 * Always better than an empty reply: the work was actually done, and the
 * user can still see what happened.
 */
function fallbackSummary(slice) {
    const lines = ['（主导模型未能生成答复，以下为系统汇总）', ''];
    if (slice.decision) {
        lines.push(`**最终方向**：${slice.decision.finalDirection}`, '');
    }
    if (slice.plan) {
        lines.push(`**执行计划**（${slice.plan.steps.length} 步）：`);
        for (const step of slice.plan.steps)
            lines.push(`- ${step.description}`);
        lines.push('');
    }
    if (slice.execution) {
        lines.push(`**执行结果**：${slice.execution.status}`);
        for (const output of slice.execution.outputs) {
            lines.push(`- ${output.stepId}: ${output.status}${output.error ? ` — ${output.error}` : ''}`);
        }
        lines.push('');
    }
    if (slice.verification && !slice.verification.passed) {
        lines.push(`**验证未通过**：${slice.verification.issues.join('; ')}`);
    }
    return lines.join('\n').trim();
}
/** Salvage helper re-exported for callers that need the same degrade path. */
export { salvageText };
//# sourceMappingURL=lead-model.js.map