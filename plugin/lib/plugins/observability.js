import { formatUsd } from "../utils/cost.js";
/** How many settled runs to keep in memory. */
const HISTORY_LIMIT = 50;
export class Observability {
    store;
    logger;
    history = [];
    settled = new Set();
    constructor(store, logger) {
        this.store = store;
        this.logger = logger;
    }
    /** Start observing. Returns the disposer. */
    attach() {
        return this.store.subscribe((state) => {
            if (state.status !== 'done' && state.status !== 'error')
                return;
            if (this.settled.has(state.runId))
                return;
            this.settled.add(state.runId);
            this.record(state);
        });
    }
    /** Recent run summaries, newest first. */
    recent() {
        return [...this.history];
    }
    /** Aggregate spend across the retained history. */
    totals() {
        return this.history.reduce((acc, summary) => ({
            runs: acc.runs + 1,
            tokens: acc.tokens + summary.totalTokens,
            costUsd: acc.costUsd + summary.totalCostUsd,
        }), { runs: 0, tokens: 0, costUsd: 0 });
    }
    record(state) {
        const blackboard = state.blackboard;
        const finishedAt = state.finishedAt ?? Date.now();
        const summary = {
            runId: state.runId,
            phase: state.phase,
            startedAt: state.startedAt,
            finishedAt,
            durationMs: finishedAt - state.startedAt,
            request: state.request.length > 120 ? `${state.request.slice(0, 120)}…` : state.request,
            totalTokens: state.cost.totalTokens,
            totalCostUsd: state.cost.totalCostUsd,
            proposals: blackboard.proposals.length,
            reviews: blackboard.reviews.length,
            executed: blackboard.execution !== undefined,
            ...(blackboard.execution ? { executionStatus: blackboard.execution.status } : {}),
            ...(blackboard.verification && !blackboard.verification.skipped
                ? { verified: blackboard.verification.passed }
                : {}),
        };
        this.history.unshift(summary);
        if (this.history.length > HISTORY_LIMIT)
            this.history.length = HISTORY_LIMIT;
        // One line per run: enough to see cost shape in a terminal without the UI.
        this.logger.info('run %s %s in %sms | %s tokens | %s | %d proposals, %d reviews%s', state.runId, state.phase, summary.durationMs, summary.totalTokens, formatUsd(summary.totalCostUsd), summary.proposals, summary.reviews, summary.executionStatus ? ` | execution=${summary.executionStatus}` : '');
        // Per-participant breakdown, so an expensive seat is obvious.
        for (const row of state.cost.byProfile) {
            this.logger.debug('  %s (%s/%s, %s): %d calls, %d tokens, %s', row.label, row.provider, row.model, row.role, row.calls, row.inputTokens + row.outputTokens, formatUsd(row.costUsd));
        }
        if (state.cost.budget.exhausted) {
            this.logger.warn('run %s hit a budget ceiling: %s', state.runId, state.cost.budget.exhaustedReason ?? '');
        }
    }
}
//# sourceMappingURL=observability.js.map