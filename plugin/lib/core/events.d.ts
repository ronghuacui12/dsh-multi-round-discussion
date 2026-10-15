/**
 * Event names emitted by the orchestration.
 *
 * Declared as constants so the client bundle and the host never drift on a
 * string literal. Host-side listeners register through `ctx.on`, and the SSE
 * bridge forwards the same names to the browser.
 */
/** A run was created and the state machine entered its first phase. */
export declare const RUN_STARTED: "multi-model-discussion/run-started";
/** Any blackboard mutation; carries the new revision. */
export declare const RUN_UPDATED: "multi-model-discussion/run-updated";
/** A phase transition; carries `{ from, to }`. */
export declare const PHASE_CHANGED: "multi-model-discussion/phase-changed";
/** One participant entered or left a working state. */
export declare const PARTICIPANT_CHANGED: "multi-model-discussion/participant-changed";
/** The budget guard tripped and the run was forced into decision. */
export declare const BUDGET_EXHAUSTED: "multi-model-discussion/budget-exhausted";
/** The run parked, awaiting a user answer. */
export declare const USER_INPUT_REQUIRED: "multi-model-discussion/user-input-required";
/** The run reached a terminal phase. */
export declare const RUN_FINISHED: "multi-model-discussion/run-finished";
/** A control command was accepted from the UI. */
export declare const CONTROL_APPLIED: "multi-model-discussion/control-applied";
/** The executor was denied a tool by the sandbox guard. */
export declare const TOOL_DENIED: "multi-model-discussion/tool-denied";
/** Payload of {@link PHASE_CHANGED}. */
export interface PhaseChangedPayload {
    runId: string;
    from: string;
    to: string;
}
/** Payload of {@link BUDGET_EXHAUSTED}. */
export interface BudgetExhaustedPayload {
    runId: string;
    reason: string;
}
/** Payload of {@link TOOL_DENIED}. */
export interface ToolDeniedPayload {
    runId: string;
    tool: string;
    reason: string;
}
//# sourceMappingURL=events.d.ts.map