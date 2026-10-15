/**
 * verifier (doc §2.1).
 *
 * Checks an execution result against the plan's own acceptance criteria. This
 * is the only phase that reads both the plan and the result and is not itself
 * invested in either, which is why it is a separate role rather than something
 * the lead model folds into its final answer.
 *
 * Verification is optional. When it is skipped the run still produces a
 * `Verification` record marked `skipped`, so downstream consumers never have
 * to branch on "was there a verifier" — they branch on the value.
 */
import type { ModelRegistry } from '../services/model-registry.js';
import type { ExecutionPlan, ExecutionResult, Verification } from '../types/plan.js';
import type { ModelCallUsage, ModelProfile } from '../types/model-profile.js';
/** The record produced when no verifier profile was seated. */
export declare function skippedVerification(planId: string): Verification;
/** The record produced when the verifier itself failed to answer. */
export declare function unverified(planId: string, reason: string): Verification;
export declare class Verifier {
    private readonly registry;
    private readonly onUsage;
    constructor(registry: ModelRegistry, onUsage?: (usage: ModelCallUsage) => void);
    /**
     * Check one execution result.
     *
     * @param plan - the plan that was executed.
     * @param execution - what happened.
     * @param profile - the verifier profile, or `undefined` to skip.
     * @param signal - run cancellation.
     */
    verify(plan: ExecutionPlan, execution: ExecutionResult, profile: ModelProfile | undefined, signal: AbortSignal): Promise<Verification>;
}
//# sourceMappingURL=verifier.d.ts.map