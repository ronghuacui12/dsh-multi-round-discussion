/** Defaults applied when config omits a field. */
export const DEFAULT_BUDGET = {
    maxTotalTokens: 2_000_000,
    maxTotalCostUsd: 5,
    maxDurationMs: 15 * 60 * 1000,
    maxDiscussionRounds: 3,
    maxProposers: 5,
};
/** Map a configured ceiling to `Infinity` when it is disabled. */
function ceiling(value) {
    return Number.isFinite(value) && value > 0 ? value : Number.POSITIVE_INFINITY;
}
export class BudgetGuard {
    config;
    startedAt;
    records = [];
    constructor(config = {}, now = Date.now()) {
        this.config = { ...DEFAULT_BUDGET, ...config };
        this.startedAt = now;
    }
    /** Record one finished model call. */
    record(usage) {
        this.records.push(usage);
    }
    /** Every recorded call, in completion order. */
    calls() {
        return this.records;
    }
    /** Total tokens (input + output, cache included) burned so far. */
    totalTokens() {
        let total = 0;
        for (const call of this.records) {
            total +=
                call.inputTokens + call.outputTokens + call.cacheReadTokens + call.cacheWriteTokens;
        }
        return total;
    }
    /** Estimated spend so far. Under-reports when a model has no price row. */
    totalCostUsd() {
        let total = 0;
        for (const call of this.records)
            total += call.costUsd;
        return total;
    }
    /** Elapsed wall-clock time in milliseconds. */
    elapsedMs(now = Date.now()) {
        return now - this.startedAt;
    }
    /** Current consumption against every ceiling. */
    status(now = Date.now()) {
        const maxTotalTokens = ceiling(this.config.maxTotalTokens);
        const maxTotalCostUsd = ceiling(this.config.maxTotalCostUsd);
        const maxDurationMs = ceiling(this.config.maxDurationMs);
        const usedTokens = this.totalTokens();
        const usedCost = this.totalCostUsd();
        const usedMs = this.elapsedMs(now);
        const remainingTokens = maxTotalTokens - usedTokens;
        const remainingCostUsd = maxTotalCostUsd - usedCost;
        const remainingMs = maxDurationMs - usedMs;
        const reasons = [];
        if (remainingTokens <= 0)
            reasons.push(`token budget exhausted (${usedTokens}/${this.config.maxTotalTokens})`);
        if (remainingCostUsd <= 0)
            reasons.push(`cost budget exhausted ($${usedCost.toFixed(4)}/$${this.config.maxTotalCostUsd})`);
        if (remainingMs <= 0)
            reasons.push(`time budget exhausted (${Math.round(usedMs / 1000)}s/${Math.round(this.config.maxDurationMs / 1000)}s)`);
        return {
            maxTotalTokens,
            maxTotalCostUsd,
            maxDurationMs,
            remainingTokens,
            remainingCostUsd,
            remainingMs,
            exhausted: reasons.length > 0,
            exhaustedReason: reasons.length > 0 ? reasons.join('; ') : undefined,
        };
    }
    /**
     * Whether another discussion round may start.
     *
     * Checked *before* a round launches, so a round never begins only to be
     * abandoned halfway — a half-finished round would pollute the proposal set
     * the decision maker reads.
     */
    canStartRound(nextRound, now = Date.now()) {
        if (nextRound > this.config.maxDiscussionRounds)
            return false;
        return !this.status(now).exhausted;
    }
    /** Clamp a requested proposer count to the configured ceiling. */
    clampProposers(requested) {
        return Math.max(1, Math.min(requested, ceiling(this.config.maxProposers)));
    }
    /** Configured round ceiling, for reporting. */
    get maxRounds() {
        return this.config.maxDiscussionRounds;
    }
    /** Configured ceilings, for reporting. */
    get limits() {
        return this.config;
    }
    /** Wall-clock start, for the cost panel. */
    get startTime() {
        return this.startedAt;
    }
}
//# sourceMappingURL=budget-guard.js.map