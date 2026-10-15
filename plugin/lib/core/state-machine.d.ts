/**
 * The orchestration state machine (doc §2.2, §5).
 *
 * Two properties this file exists to guarantee:
 *
 *   1. Every loop-back edge terminates at `deciding`. There is no edge from
 *      `proposing` back to `proposing`, so "the debate cannot run forever" is
 *      a property of the graph rather than a promise in a prompt.
 *   2. Illegal transitions throw. A phase bug shows up at the moment it
 *      happens, naming both phases, instead of corrupting the run silently.
 */
import type { Phase, RunStatus } from '../types/run.js';
/** Phases from which no transition is possible. */
export declare const TERMINAL_PHASES: readonly Phase[];
/** Map a phase to the coarse status the UI colours by. */
export declare function statusOf(phase: Phase): RunStatus;
/** Human-readable phase labels, used by the UI and the notices feed. */
export declare const PHASE_LABELS: Record<Phase, string>;
/** Raised on an attempt to take an illegal edge. */
export declare class IllegalTransitionError extends Error {
    readonly from: Phase;
    readonly to: Phase;
    readonly allowed: readonly Phase[];
    constructor(from: Phase, to: Phase, allowed: readonly Phase[]);
}
/** One recorded transition. */
export interface TransitionRecord {
    from: Phase;
    to: Phase;
    at: number;
    /** Why the run moved, for the audit trail. */
    reason?: string;
}
export interface StateMachineOptions {
    /** Called after each accepted transition. */
    onTransition?: (record: TransitionRecord) => void;
}
export declare class StateMachine {
    private currentPhase;
    private readonly options;
    private readonly records;
    constructor(initial?: Phase, options?: StateMachineOptions);
    get phase(): Phase;
    get status(): RunStatus;
    get isTerminal(): boolean;
    /** Phases reachable from here. */
    get allowedNext(): readonly Phase[];
    /** Whether `to` is a legal next phase. */
    can(to: Phase): boolean;
    /** All transitions taken so far. */
    history(): readonly TransitionRecord[];
    /**
     * Move to `to`, or throw {@link IllegalTransitionError}.
     *
     * @param to - the next phase.
     * @param reason - short audit note; stored in the transition record.
     */
    goto(to: Phase, reason?: string): void;
    /**
     * Move to `to` only if legal; otherwise stay put and report false.
     *
     * Used by the budget guard, which wants to force a hand-over to the decision
     * phase but must not throw when the run is already there.
     */
    tryGoto(to: Phase, reason?: string): boolean;
    /**
     * Unconditionally settle on a terminal phase.
     *
     * Termination is reachable from every phase in principle — a provider can
     * fail during `proposing`, a user can abort during `executing` — but the
     * transition table only encodes the *normal* edges. Rather than listing every
     * phase → terminal pair (and its combinatorial maintenance), abnormal ends
     * funnel through here. Non-terminal targets are rejected: this is for
     * settling, not for skipping phases.
     *
     * @param to - a terminal phase.
     * @param reason - audit note recorded in the transition history.
     */
    settle(to: Phase, reason?: string): void;
}
//# sourceMappingURL=state-machine.d.ts.map