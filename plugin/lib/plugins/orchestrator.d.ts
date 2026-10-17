import type { Context } from '@deepseek-ai/cordis';
import type { Logger } from '@deepseek-ai/cordis';
import { ModelRegistry } from '../services/model-registry.js';
import { RunStore } from '../services/run-store.js';
import { type RosterOverrides } from '../core/roster.js';
import type { PresetName, RunControl, RunState } from '../types/run.js';
/** Fully resolved plugin configuration. */
export interface OrchestratorConfig {
    preset: PresetName;
    enabled: boolean;
    budget: {
        maxTotalTokens: number;
        maxTotalCostUsd: number;
        maxDurationMs: number;
        maxDiscussionRounds: number;
        maxProposers: number;
    };
    executor: {
        allowedTools: string[];
        requireConfirmationForWrites: boolean;
        maxSteps: number;
    };
    overrides?: RosterOverrides;
}
export interface StartRunOptions {
    request: string;
    preset?: PresetName;
    overrides?: RosterOverrides;
}
export interface OrchestratorOptions {
    ctx: Context;
    registry: ModelRegistry;
    store: RunStore;
    config: OrchestratorConfig;
    logger?: Logger;
}
export declare class Orchestrator {
    private readonly ctx;
    private readonly registry;
    private readonly store;
    private readonly config;
    private readonly logger;
    /** Long-lived per-run objects, keyed by run id. */
    private readonly engines;
    constructor(options: OrchestratorOptions);
    /**
     * Start a run. Returns immediately with the initial state; the run continues
     * in the background and reports progress through the store.
     *
     * Roster errors are thrown synchronously — a misconfigured roster should fail
     * the caller's request, not surface as a failed run the user has to go read.
     */
    start(options: StartRunOptions): RunState;
    /** Deliver a user control to the run currently parked on it, or queue it. */
    control(runId: string, control: RunControl): boolean;
    /** Cancel a run from the outside (plugin unload, host shutdown). */
    cancel(runId: string): boolean;
    /** Abort every in-flight run. Called from the plugin's disposer. */
    dispose(): void;
    private stopRun;
    /** Consume the first queued control of a given kind, if any. */
    private takeQueued;
    /** Whether the run has been aborted. */
    private aborted;
    /** Transition the state machine and mirror it into the transported state. */
    private goto;
    private notice;
    /**
     * The main protocol. Linear on purpose — see the file header.
     */
    private run;
    /**
     * Propose -> [review] -> decide, looping only while there is budget and the
     * decision maker has not found anything workable.
     */
    private runDiscussion;
    /** Build a decision record from a user's force-adopt instruction. */
    private applyForcedAdoption;
    private fallbackDecision;
    /** Re-decide after a failed verification, with the verdict in view. */
    private redecide;
    /** Generate the plan, handling the optional approval park. */
    private runPlanning;
    /** Run the plan. */
    private runExecution;
    /** Verify, when a verifier is seated. */
    private runVerification;
    /** Settle the run on a terminal phase. */
    private finish;
}
//# sourceMappingURL=orchestrator.d.ts.map