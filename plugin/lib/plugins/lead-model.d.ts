import type { ModelRegistry } from '../services/model-registry.js';
import type { BlackboardSlice } from '../types/blackboard.js';
import type { Decision, Proposal } from '../types/discussion.js';
import type { ExecutionPlan } from '../types/plan.js';
import type { ModelCallUsage, ModelProfile } from '../types/model-profile.js';
import { salvageText } from '../utils/json.js';
/** Outcome of the clarification check. */
export interface ClarificationVerdict {
    clear: boolean;
    questions: string[];
    understanding: string;
}
/** Raised when the lead model fails to produce a usable decision. */
export declare class DecisionError extends Error {
    readonly raw: string;
    constructor(message: string, raw: string);
}
/** Raised when the lead model fails to produce a usable plan. */
export declare class PlanError extends Error {
    readonly raw: string;
    constructor(message: string, raw: string);
}
/** A decision plus the reconciliation that was applied to it. */
export interface DecisionOutcome {
    decision: Decision;
    /** Proposal ids the model omitted, auto-rejected so the partition is total. */
    autoRejected: string[];
}
export declare class LeadModel {
    private readonly registry;
    private readonly onUsage;
    /**
     * @param registry - the shared model gateway.
     * @param onUsage - per-call usage sink bound to this run's budget guard.
     *   Passed per call rather than subscribed globally so concurrent runs do
     *   not charge each other's budgets.
     */
    constructor(registry: ModelRegistry, onUsage?: (usage: ModelCallUsage) => void);
    /**
     * Ask whether the request can proceed, or needs the user to fill a gap.
     *
     * Fails open: if the lead model cannot be parsed into a verdict, the run
     * proceeds rather than parking the user on a question we could not even
     * formulate. A malformed verdict is not evidence that the request is unclear.
     */
    clarify(profile: ModelProfile, originalRequest: string, clarification: string | undefined, signal: AbortSignal): Promise<ClarificationVerdict>;
    /**
     * Take the binding decision.
     *
     * Enforces one invariant the model cannot be trusted to keep: every proposal
     * is either adopted or rejected. Anything it omits is auto-rejected and
     * reported, so the decision record is always a partition of the real set —
     * otherwise "why wasn't P3 considered?" would have no answer in the audit
     * trail.
     */
    decide(profile: ModelProfile, slice: BlackboardSlice, round: number, signal: AbortSignal): Promise<DecisionOutcome>;
    /**
     * Turn the decision into a structured plan.
     *
     * `mutatesState` is recomputed here from the steps rather than trusted: a
     * plan containing a non-read-only tool mutates state regardless of what the
     * model wrote, and that flag is what gates confirmation in the executor.
     */
    buildPlan(profile: ModelProfile, originalRequest: string, decision: Decision, adopted: readonly Proposal[], signal: AbortSignal): Promise<ExecutionPlan>;
    /**
     * Compose the user-facing answer.
     *
     * Plain prose, not JSON: this is the one lead-model output a human reads
     * directly. A failure here degrades to a structured summary rather than
     * losing the run's results.
     */
    finalAnswer(profile: ModelProfile, slice: BlackboardSlice, signal: AbortSignal): Promise<string>;
}
/** Salvage helper re-exported for callers that need the same degrade path. */
export { salvageText };
//# sourceMappingURL=lead-model.d.ts.map