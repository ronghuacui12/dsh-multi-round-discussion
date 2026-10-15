/**
 * observability (doc §7, §11).
 *
 * A passive observer: it never drives the run, it only reports. Two jobs:
 *
 *   - emit a structured cost/timing summary when a run settles, so the numbers
 *     are in the log even if nobody opened the UI;
 *   - keep a bounded in-memory history so the settings panel can show what the
 *     last few runs actually cost.
 *
 * The history is deliberately in-memory and bounded. Anything durable belongs
 * to a persistence plugin, not here.
 */
import type { Logger } from '@deepseek-ai/cordis';
import type { RunStore } from '../services/run-store.js';
import type { RunState } from '../types/run.js';
/** One settled run, summarised. */
export interface RunSummary {
    runId: string;
    phase: RunState['phase'];
    startedAt: number;
    finishedAt: number;
    durationMs: number;
    request: string;
    totalTokens: number;
    totalCostUsd: number;
    proposals: number;
    reviews: number;
    /** Whether the run executed anything. */
    executed: boolean;
    /** Execution outcome, when there was one. */
    executionStatus?: 'success' | 'failed' | 'partial';
    /** Verification outcome, when verification ran. */
    verified?: boolean;
}
export declare class Observability {
    private readonly store;
    private readonly logger;
    private readonly history;
    private readonly settled;
    constructor(store: RunStore, logger: Logger);
    /** Start observing. Returns the disposer. */
    attach(): () => void;
    /** Recent run summaries, newest first. */
    recent(): RunSummary[];
    /** Aggregate spend across the retained history. */
    totals(): {
        runs: number;
        tokens: number;
        costUsd: number;
    };
    private record;
}
//# sourceMappingURL=observability.d.ts.map