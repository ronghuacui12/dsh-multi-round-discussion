/**
 * Live run registry.
 *
 * Holds everything about the runs currently in flight: the blackboard, the
 * budget guard, the state machine, the roster, and the cancellation handle.
 * The orchestrator drives it; the HTTP bridge and the UI read it.
 *
 * The one subtle piece is {@link UserInputGate}. Parking a run is modelled as
 * an awaited promise rather than as saved-and-restored control flow, which
 * keeps `Orchestrator.run()` linear and readable: "wait for the user" looks
 * exactly like any other await, and there is no resume-point state to get out
 * of sync with the state machine.
 */
import { randomUUID } from 'node:crypto';
/** Service key for {@link RunStore}. */
export const RUN_STORE_SERVICE = 'multiModelRunStore';
/**
 * A park point the orchestrator waits on and the UI resolves.
 *
 * `wait()` is racy-by-design with the run's abort signal: a cancelled run must
 * not stay suspended waiting for an answer that will never come.
 */
export class UserInputGate {
    resolver;
    pending;
    /** Park until a control arrives, or until `signal` aborts. */
    async wait(signal) {
        if (this.pending) {
            const control = this.pending;
            this.pending = undefined;
            return control;
        }
        if (signal.aborted)
            return undefined;
        return new Promise((resolve) => {
            const onAbort = () => {
                this.resolver = undefined;
                resolve(undefined);
            };
            signal.addEventListener('abort', onAbort, { once: true });
            this.resolver = (control) => {
                signal.removeEventListener('abort', onAbort);
                resolve(control);
            };
        });
    }
    /** Deliver a control. If nobody is waiting yet, it is held for the next wait. */
    resolve(control) {
        if (this.resolver) {
            const resolver = this.resolver;
            this.resolver = undefined;
            resolver(control);
        }
        else {
            this.pending = control;
        }
    }
    /** Whether a control has already been queued. */
    get hasPending() {
        return this.pending !== undefined;
    }
}
/** Build an empty participant status for one profile. */
export function initialParticipant(profile) {
    return {
        profileId: profile.id,
        label: profile.label ?? profile.id,
        role: profile.role,
        state: 'idle',
        phase: 'idle',
    };
}
/** Roll the call ledger up into the cost summary the UI renders. */
export function computeCostSummary(budget, now = Date.now()) {
    const calls = budget.calls();
    const byProfile = new Map();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    let totalDurationMs = 0;
    for (const call of calls) {
        const tokens = call.inputTokens + call.outputTokens;
        totalInputTokens += call.inputTokens;
        totalOutputTokens += call.outputTokens;
        totalCostUsd += call.costUsd;
        // Wall-clock per call, summed: this is model time, not run time. The run
        // clock is in `budget.status()`.
        totalDurationMs += call.durationMs;
        const existing = byProfile.get(call.profileId);
        if (existing) {
            existing.calls += 1;
            existing.inputTokens += call.inputTokens;
            existing.outputTokens += call.outputTokens;
            existing.costUsd += call.costUsd;
            existing.durationMs += call.durationMs;
            continue;
        }
        byProfile.set(call.profileId, {
            profileId: call.profileId,
            label: call.profileId,
            role: call.role,
            provider: call.provider,
            model: call.model,
            calls: 1,
            inputTokens: call.inputTokens,
            outputTokens: call.outputTokens,
            costUsd: call.costUsd,
            durationMs: call.durationMs,
        });
    }
    const rows = [...byProfile.values()].sort((a, b) => b.costUsd - a.costUsd);
    return {
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalCostUsd,
        totalDurationMs,
        byProfile: rows,
        budget: budget.status(now),
    };
}
export class RunStore {
    runs = new Map();
    listeners = new Set();
    /** Allocate a run id. */
    static newRunId() {
        return `mmd-${randomUUID().slice(0, 8)}`;
    }
    /** Register a run. */
    add(context) {
        this.runs.set(context.runId, context);
    }
    /** Look up a run. */
    get(runId) {
        return this.runs.get(runId);
    }
    /** Every run context, insertion order. */
    all() {
        return [...this.runs.values()];
    }
    /** Every run, newest first. */
    list() {
        return [...this.runs.values()]
            .map((context) => context.state)
            .sort((a, b) => b.startedAt - a.startedAt);
    }
    /** The most recently started run. */
    latest() {
        const all = [...this.runs.values()].sort((a, b) => b.state.startedAt - a.state.startedAt);
        return all[0];
    }
    /** Drop a run. */
    remove(runId) {
        return this.runs.delete(runId);
    }
    /** Keep only the newest `keep` settled runs; returns how many were dropped. */
    prune(keep) {
        const settled = [...this.runs.values()]
            .filter((context) => context.settled)
            .sort((a, b) => b.state.startedAt - a.state.startedAt);
        let dropped = 0;
        for (const context of settled.slice(keep)) {
            this.runs.delete(context.runId);
            dropped++;
        }
        return dropped;
    }
    /** Subscribe to state changes. */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * Apply a patch to one run's state, bump the revision, and notify.
     *
     * Every UI-visible change goes through here, so the revision is a reliable
     * "something changed" signal for the client's polling loop.
     */
    patch(runId, patch) {
        const context = this.runs.get(runId);
        if (!context)
            return undefined;
        context.state = {
            ...context.state,
            ...patch,
            revision: context.state.revision + 1,
            updatedAt: Date.now(),
        };
        this.notify(context.state);
        return context.state;
    }
    /** Update one participant's status inside a run. */
    patchParticipant(runId, profileId, patch) {
        const context = this.runs.get(runId);
        if (!context)
            return;
        const participants = context.state.participants.map((participant) => participant.profileId === profileId ? { ...participant, ...patch } : participant);
        this.patch(runId, { participants });
    }
    /** Append a notice to a run. */
    notice(runId, notice) {
        const context = this.runs.get(runId);
        if (!context)
            return;
        const entry = {
            id: randomUUID().slice(0, 8),
            at: Date.now(),
            ...notice,
        };
        // Bounded: a pathological run must not grow the state payload without limit.
        const notices = [...context.state.notices, entry].slice(-50);
        this.patch(runId, { notices });
    }
    /** Refresh the cost summary from the budget guard. */
    refreshCost(runId) {
        const context = this.runs.get(runId);
        if (!context)
            return;
        this.patch(runId, { cost: computeCostSummary(context.budget) });
    }
    /** Set the phase and derived status. */
    setPhase(runId, phase, status) {
        this.patch(runId, { phase, status });
    }
    notify(state) {
        for (const listener of this.listeners) {
            try {
                listener(state);
            }
            catch {
                // Transport failures must not break the run.
            }
        }
    }
}
//# sourceMappingURL=run-store.js.map