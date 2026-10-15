/**
 * Event names emitted by the orchestration.
 *
 * Declared as constants so the client bundle and the host never drift on a
 * string literal. Host-side listeners register through `ctx.on`, and the SSE
 * bridge forwards the same names to the browser.
 */
/** A run was created and the state machine entered its first phase. */
export const RUN_STARTED = 'multi-model-discussion/run-started';
/** Any blackboard mutation; carries the new revision. */
export const RUN_UPDATED = 'multi-model-discussion/run-updated';
/** A phase transition; carries `{ from, to }`. */
export const PHASE_CHANGED = 'multi-model-discussion/phase-changed';
/** One participant entered or left a working state. */
export const PARTICIPANT_CHANGED = 'multi-model-discussion/participant-changed';
/** The budget guard tripped and the run was forced into decision. */
export const BUDGET_EXHAUSTED = 'multi-model-discussion/budget-exhausted';
/** The run parked, awaiting a user answer. */
export const USER_INPUT_REQUIRED = 'multi-model-discussion/user-input-required';
/** The run reached a terminal phase. */
export const RUN_FINISHED = 'multi-model-discussion/run-finished';
/** A control command was accepted from the UI. */
export const CONTROL_APPLIED = 'multi-model-discussion/control-applied';
/** The executor was denied a tool by the sandbox guard. */
export const TOOL_DENIED = 'multi-model-discussion/tool-denied';
//# sourceMappingURL=events.js.map