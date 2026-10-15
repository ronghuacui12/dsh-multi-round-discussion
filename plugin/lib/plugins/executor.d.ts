/**
 * executor (doc §2.5, §11.2).
 *
 * A deliberately constrained tool-calling loop. It does NOT use the harness
 * agent loop, for one reason: the whole point of this phase is that the
 * executor cannot re-plan, and the strongest way to guarantee that is to give
 * it a loop that has nowhere to put a new plan.
 *
 * Three fences, in order of strength:
 *
 *   1. **Schema filtering.** `sandbox.visibleTools` removes non-permitted
 *      tools before the model is asked anything, so a denied tool is never
 *      advertised and cannot be called by accident.
 *   2. **Dispatch-time check.** Every call is re-checked with `sandbox.decide`
 *      before `ctx.tools.execute`, so a hallucinated or renamed tool is caught
 *      even though it was never offered.
 *   3. **Step ceiling.** The loop is bounded by `maxSteps`; on exhaustion the
 *      run is reported as partial rather than continuing to burn budget.
 *
 * A failure of any kind is reported, never repaired. Deciding what to do about
 * a failed execution is the lead model's job (the `executing -> deciding`
 * edge), not this loop's.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Logger } from '@deepseek-ai/cordis';
import type { ModelRegistry } from '../services/model-registry.js';
import type { SharedBlackboard } from '../core/blackboard.js';
import type { ToolSandbox } from '../core/sandbox.js';
import type { ExecutionPlan, ExecutionResult } from '../types/plan.js';
import type { ModelCallUsage, ModelProfile } from '../types/model-profile.js';
import type { ParticipantStatus, RunNotice } from '../types/run.js';
/** Raised when the plan references a state the executor cannot act on. */
export declare class ExecutionSetupError extends Error {
    constructor(message: string);
}
export interface ExecutorOptions {
    ctx: Context;
    registry: ModelRegistry;
    sandbox: ToolSandbox;
    blackboard: SharedBlackboard;
    logger?: Logger;
    onParticipant?: (profileId: string, patch: Partial<ParticipantStatus>) => void;
    onNotice?: (notice: Omit<RunNotice, 'id' | 'at'>) => void;
    /** Per-call usage sink, scoped to the owning run's budget guard. */
    onUsage?: (usage: ModelCallUsage) => void;
}
export declare class Executor {
    private readonly ctx;
    private readonly registry;
    private readonly sandbox;
    private readonly blackboard;
    private readonly logger;
    private readonly onParticipant;
    private readonly onNotice;
    private readonly onUsage;
    constructor(options: ExecutorOptions);
    /**
     * Execute one plan with one profile.
     *
     * @param plan - the structured plan; treated as immutable input.
     * @param profile - the executor profile.
     * @param signal - run cancellation.
     * @returns the execution result, also written to the blackboard.
     */
    execute(plan: ExecutionPlan, profile: ModelProfile, signal: AbortSignal): Promise<ExecutionResult>;
    /**
     * Check and run one tool call.
     *
     * Returns either model-facing content to feed back, or a `note` meaning the
     * call never ran. A denial is fed back as a *successful* tool result carrying
     * the refusal text: that keeps the conversation well-formed while still
     * telling the model, in the place it will actually read, that the step is
     * blocked.
     */
    private dispatchTool;
    /**
     * Ask the executor to report each plan step's outcome as structured data.
     *
     * Best-effort: if the report cannot be parsed, the caller falls back to the
     * raw transcript-derived outputs, so a formatting failure never costs the
     * run its results.
     */
    private collectReport;
}
//# sourceMappingURL=executor.d.ts.map