import type { SharedBlackboard } from '../core/blackboard.js';
import type { BudgetGuard } from '../core/budget-guard.js';
import type { StateMachine } from '../core/state-machine.js';
import type { ModelRole } from '../types/model-profile.js';
import type { CostSummary, ParticipantStatus, Phase, Roster, RunControl, RunNotice, RunState } from '../types/run.js';
/**
 * Exposed as a Cordis service so sibling plugins can observe runs without
 * importing this module. The HTTP bridge and the client view both read it.
 */
declare module '@deepseek-ai/cordis' {
    interface Context {
        multiModelRunStore: RunStore;
    }
}
/** Service key for {@link RunStore}. */
export declare const RUN_STORE_SERVICE: "multiModelRunStore";
/**
 * A park point the orchestrator waits on and the UI resolves.
 *
 * `wait()` is racy-by-design with the run's abort signal: a cancelled run must
 * not stay suspended waiting for an answer that will never come.
 */
export declare class UserInputGate {
    private resolver;
    private pending;
    /** Park until a control arrives, or until `signal` aborts. */
    wait(signal: AbortSignal): Promise<RunControl | undefined>;
    /** Deliver a control. If nobody is waiting yet, it is held for the next wait. */
    resolve(control: RunControl): void;
    /** Whether a control has already been queued. */
    get hasPending(): boolean;
}
/** Everything one in-flight run owns. */
export interface RunContext {
    runId: string;
    state: RunState;
    blackboard: SharedBlackboard;
    budget: BudgetGuard;
    machine: StateMachine;
    roster: Roster;
    abort: AbortController;
    gate: UserInputGate;
    /** Controls issued before the run reached a phase that could apply them. */
    queued: RunControl[];
    /** Set once the run reaches a terminal phase. */
    settled: boolean;
}
/** Build an empty participant status for one profile. */
export declare function initialParticipant(profile: {
    id: string;
    role: ModelRole;
    label?: string;
}): ParticipantStatus;
/** Roll the call ledger up into the cost summary the UI renders. */
export declare function computeCostSummary(budget: BudgetGuard, now?: number): CostSummary;
/** Consumers of run-state changes. */
export type RunStoreListener = (state: RunState) => void;
export declare class RunStore {
    private readonly runs;
    private readonly listeners;
    /** Allocate a run id. */
    static newRunId(): string;
    /** Register a run. */
    add(context: RunContext): void;
    /** Look up a run. */
    get(runId: string): RunContext | undefined;
    /** Every run context, insertion order. */
    all(): RunContext[];
    /** Every run, newest first. */
    list(): RunState[];
    /** The most recently started run. */
    latest(): RunContext | undefined;
    /** Drop a run. */
    remove(runId: string): boolean;
    /** Keep only the newest `keep` settled runs; returns how many were dropped. */
    prune(keep: number): number;
    /** Subscribe to state changes. */
    subscribe(listener: RunStoreListener): () => void;
    /**
     * Apply a patch to one run's state, bump the revision, and notify.
     *
     * Every UI-visible change goes through here, so the revision is a reliable
     * "something changed" signal for the client's polling loop.
     */
    patch(runId: string, patch: Partial<RunState>): RunState | undefined;
    /** Update one participant's status inside a run. */
    patchParticipant(runId: string, profileId: string, patch: Partial<ParticipantStatus>): void;
    /** Append a notice to a run. */
    notice(runId: string, notice: Omit<RunNotice, 'id' | 'at'>): void;
    /** Refresh the cost summary from the budget guard. */
    refreshCost(runId: string): void;
    /** Set the phase and derived status. */
    setPhase(runId: string, phase: Phase, status: RunState['status']): void;
    private notify;
}
//# sourceMappingURL=run-store.d.ts.map