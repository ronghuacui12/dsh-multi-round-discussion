/**
 * dsh-multi-model-discussion — role-separated multi-model discussion.
 *
 * One plugin row mounts the whole orchestration, because the pieces share one
 * config section and one lifecycle. The composition is:
 *
 *   ModelRegistry   (service)  - every model call, with cost accounting
 *   RunStore        (internal) - live runs, read by the HTTP bridge
 *   Orchestrator    (driver)   - owns the state machine
 *     ├─ DiscussionEngine      - parallel proposals, anonymous review
 *     ├─ LeadModel             - clarify / decide / plan / answer
 *     ├─ Executor              - sandboxed tool loop
 *     └─ Verifier              - acceptance checking
 *   Observability   (observer) - cost summaries
 *   HTTP routes     (optional) - what the `conversation.view` tab reads
 *   discuss tool    (optional) - how a conversation starts a run
 *
 * @module dsh-multi-model-discussion
 */
import Schema from '@deepseek-ai/schemastery';
import type { Context } from '@deepseek-ai/cordis';
import type { ModelPrice, ModelProfile } from './types/model-profile.js';
import type { PresetName } from './types/run.js';
/** Plugin name shown in Cordis diagnostics. */
export declare const name = "multi-model-discussion";
/**
 * Required services. `tools` is required rather than optional because the
 * executor's whole contract is built on it; a composition without a tool
 * registry could propose and decide but never execute.
 */
export declare const inject: string[];
/** The services other plugins may consume. */
export declare const provide: ("multiModelRegistry" | "multiModelRunStore")[];
/** Reported by the HTTP handshake route. */
export declare const VERSION = "0.1.0";
/** Budget ceilings, shared by the guard and the cost panel. */
export interface BudgetConfigShape {
    maxTotalTokens: number;
    maxTotalCostUsd: number;
    maxDurationMs: number;
    maxDiscussionRounds: number;
    maxProposers: number;
}
/** Executor guard rails. */
export interface ExecutorConfigShape {
    /** Tools the executor may call, by exact name. Empty means no tools. */
    allowedTools: string[];
    /** Require confirmation before a non-read-only tool runs. */
    requireConfirmationForWrites: boolean;
    /** Maximum executor turns. */
    maxSteps: number;
}
/** Explicit roster choices, overriding role lookup. */
export interface OverridesShape {
    lead?: string;
    proposers?: string[];
    reviewers?: string[];
    executor?: string;
    verifier?: string;
}
/** HTTP surface options. */
export interface ApiConfigShape {
    /** Shared bearer token; omit to rely on same-origin checks alone. */
    token?: string;
}
/** The plugin's configuration, as validated by Cordis before `apply` runs. */
export interface Config {
    /** Master switch. `false` loads the plugin but makes it inert. */
    enabled: boolean;
    /** Default discussion depth. */
    preset: PresetName;
    /** Every model instance available to runs. */
    profiles: ModelProfile[];
    budget: BudgetConfigShape;
    executor: ExecutorConfigShape;
    overrides?: OverridesShape;
    api?: ApiConfigShape;
    /** Price overrides keyed by model-id prefix, for accurate cost reporting. */
    pricing?: Record<string, ModelPrice>;
}
/**
 * The schema, with defaults (doc §12).
 *
 * The shipped default profiles all point at the `deepseek-official` route that
 * `dsh-llm-deepseek` registers out of the box. That makes the plugin useful
 * immediately, and the three rows also demonstrate the core idea: same
 * provider, same or different models, three different roles and prompts.
 */
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
export { ModelRegistry, MODEL_REGISTRY_SERVICE } from './services/model-registry.js';
export { RunStore, RUN_STORE_SERVICE, computeCostSummary, type RunContext, type UserInputGate, } from './services/run-store.js';
export { Orchestrator, type OrchestratorConfig, type StartRunOptions } from './plugins/orchestrator.js';
export { DiscussionEngine, EmptyRoundError } from './plugins/discussion-engine.js';
export { LeadModel, type ClarificationVerdict } from './plugins/lead-model.js';
export { Executor } from './plugins/executor.js';
export { Verifier, skippedVerification } from './plugins/verifier.js';
export { Observability, type RunSummary } from './plugins/observability.js';
export { SharedBlackboard } from './core/blackboard.js';
export { BudgetGuard, DEFAULT_BUDGET } from './core/budget-guard.js';
export { StateMachine, IllegalTransitionError, PHASE_LABELS, statusOf } from './core/state-machine.js';
export { ToolSandbox, DEFAULT_SANDBOX, isReadOnlyTool } from './core/sandbox.js';
export { buildRoster, RosterError, describeRoster, type RosterOverrides } from './core/roster.js';
export { PRESETS, PRESET_LABELS, PRESET_DESCRIPTIONS, resolvePreset } from './core/preset.js';
export { API_PREFIX, registerApiRoutes } from './host/api-routes.js';
export { DISCUSS_TOOL_NAME, createDiscussTool } from './tools/discuss.js';
export * from './types/index.js';
//# sourceMappingURL=index.d.ts.map