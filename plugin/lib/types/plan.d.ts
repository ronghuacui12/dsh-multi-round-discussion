/**
 * Execution artefacts: the structured plan, its result, and the verdict.
 *
 * A plan is *data*, not prose. The executor is handed this structure and may
 * not invent steps, reorder them, or add tools — that restriction is enforced
 * by construction here, not by asking the model nicely in a prompt.
 */
/** One step of a plan. */
export interface PlanStep {
    /** Step identity, unique within the plan; dependencies refer to these. */
    id: string;
    /** What to do, in imperative form. */
    description: string;
    /** Tool the step is expected to use, when it uses one. */
    tool?: string;
    /** Arguments for that tool, when known ahead of time. */
    args?: unknown;
    /** Step ids that must complete first. */
    dependsOn?: string[];
    /**
     * How to tell the step succeeded. Required for every step that runs a tool:
     * the verifier checks against exactly this text.
     */
    acceptance?: string;
    /**
     * How to undo the step. Required for any step that mutates state, so a
     * failed run has a written way back.
     */
    rollback?: string;
}
/** A structured, executable plan. */
export interface ExecutionPlan {
    /** Plan identity. */
    id: string;
    /** Discussion decision this plan implements. */
    decisionRefs: string[];
    /** Ordered steps. Execution order is derived from `dependsOn`, not from array order alone. */
    steps: PlanStep[];
    /** What "done" means for the whole plan. */
    acceptance?: string;
    /** Whether executing this plan mutates anything outside the session. */
    mutatesState: boolean;
    /** Free-form notes from the plan builder. */
    notes?: string;
    /** Profile that produced the plan. */
    planBuilderProfileId?: string;
}
/** Outcome of one step. */
export interface StepOutput {
    stepId: string;
    status: 'success' | 'failed' | 'skipped';
    /** Canonical tool value, when the step ran a tool. */
    output?: unknown;
    /** Model-facing rendering of the output, when available. */
    rendered?: string;
    /** Failure summary when `status === 'failed'`. */
    error?: string;
}
/** Outcome of a whole plan execution. */
export interface ExecutionResult {
    /** Plan this result belongs to. */
    planId: string;
    status: 'success' | 'failed' | 'partial';
    outputs: StepOutput[];
    /** Profile that executed the plan. */
    executorProfileId?: string;
    /** Number of model turns the executor needed. */
    turns: number;
    /** Why execution stopped early, when it did. */
    stoppedReason?: 'max-steps' | 'tool-denied' | 'error' | 'aborted' | 'completed';
    usage?: {
        inputTokens: number;
        outputTokens: number;
        durationMs: number;
        costUsd: number;
    };
}
/** A verifier's verdict on an execution. */
export interface Verification {
    /** Plan that was checked. */
    planId: string;
    /** Profile that verified. Absent when verification was skipped. */
    verifierProfileId?: string;
    /** Whether the result meets the plan's acceptance criteria. */
    passed: boolean;
    /** Concrete problems found. */
    issues: string[];
    /** What to change. */
    suggestions: string[];
    /**
     * What a failure should trigger. `replan` re-enters the state machine at the
     * decision phase (the only permitted loop-back); `repair` retries execution
     * with the same plan.
     */
    recommendedAction: 'accept' | 'repair' | 'replan';
    /** True when verification could not run and the result is forwarded as-is. */
    skipped?: boolean;
}
//# sourceMappingURL=plan.d.ts.map