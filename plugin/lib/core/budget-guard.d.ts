/**
 * Budget guard (doc §2.6, §11.1).
 *
 * A cross-cutting check on every token-burning step. Its contract is
 * deliberately blunt: when any dimension is exhausted the run does not fail —
 * it stops *discussing* and forces the decision phase, keeping whatever
 * proposals already exist. Losing a nicer answer is acceptable; losing the
 * run to a runaway debate is not.
 */
import type { ModelCallUsage } from '../types/model-profile.js';
import type { BudgetStatus } from '../types/run.js';
/** Hard ceilings for one run. */
export interface BudgetConfig {
    /** Total tokens across all participants. `0` or negative means unlimited. */
    maxTotalTokens: number;
    /** Total estimated cost in USD. `0` or negative means unlimited. */
    maxTotalCostUsd: number;
    /** Wall-clock ceiling in milliseconds. `0` or negative means unlimited. */
    maxDurationMs: number;
    /** Hard ceiling on discussion rounds, whatever the preset asked for. */
    maxDiscussionRounds: number;
    /** Hard ceiling on proposers per round, whatever the roster contains. */
    maxProposers: number;
}
/** Defaults applied when config omits a field. */
export declare const DEFAULT_BUDGET: BudgetConfig;
export declare class BudgetGuard {
    private readonly config;
    private readonly startedAt;
    private readonly records;
    constructor(config?: Partial<BudgetConfig>, now?: number);
    /** Record one finished model call. */
    record(usage: ModelCallUsage): void;
    /** Every recorded call, in completion order. */
    calls(): readonly ModelCallUsage[];
    /** Total tokens (input + output, cache included) burned so far. */
    totalTokens(): number;
    /** Estimated spend so far. Under-reports when a model has no price row. */
    totalCostUsd(): number;
    /** Elapsed wall-clock time in milliseconds. */
    elapsedMs(now?: number): number;
    /** Current consumption against every ceiling. */
    status(now?: number): BudgetStatus;
    /**
     * Whether another discussion round may start.
     *
     * Checked *before* a round launches, so a round never begins only to be
     * abandoned halfway — a half-finished round would pollute the proposal set
     * the decision maker reads.
     */
    canStartRound(nextRound: number, now?: number): boolean;
    /** Clamp a requested proposer count to the configured ceiling. */
    clampProposers(requested: number): number;
    /** Configured round ceiling, for reporting. */
    get maxRounds(): number;
    /** Configured ceilings, for reporting. */
    get limits(): Readonly<BudgetConfig>;
    /** Wall-clock start, for the cost panel. */
    get startTime(): number;
}
//# sourceMappingURL=budget-guard.d.ts.map