/**
 * model-registry: the single gateway to every model call (doc §10).
 *
 * Design rules this file enforces:
 *   - **One API key, many instances.** A `ModelProfile` is just a row, so the
 *     same provider+model may appear repeatedly with different temperature,
 *     system prompt, and role. Nothing here assumes a 1:1 vendor↔participant
 *     mapping.
 *   - **All model traffic goes through here.** Callers never touch
 *     `ctx.llm.stream` directly, so token accounting, timing, and cost have
 *     exactly one implementation and cannot be forgotten at a call site.
 *   - **No retries.** `dsh-llm` documents that retrying belongs to a dedicated
 *     retry executor at durable step boundaries. Silently retrying here would
 *     double-charge the budget, so a failure is reported as a failure.
 */
import type { Context } from '@deepseek-ai/cordis';
import { type CallId, type ContentBlock, type FinishReason, type Message, type TokenUsage, type ToolSchema } from '@deepseek-ai/dsh-llm';
import type { ModelCallUsage, ModelPrice, ModelProfile, ModelRole } from '../types/model-profile.js';
/** Declared as a service so other plugins can `inject: ['multiModelRegistry']`. */
declare module '@deepseek-ai/cordis' {
    interface Context {
        multiModelRegistry: ModelRegistry;
    }
}
/** What a caller asks for. Either `prompt` or `messages`, never both. */
export interface CallRequest {
    /** Convenience path: a single user message. */
    prompt?: string;
    /** Full conversation for multi-turn calls (the executor's tool loop). */
    messages?: Message[];
    /** Override the profile's system prompt for this call. */
    system?: string;
    /** Tool schemas to advertise. Filtered by the caller's sandbox already. */
    tools?: ToolSchema[];
    /** Cancellation. Forwarded to the provider. */
    signal?: AbortSignal;
    /**
     * Per-call usage sink, in addition to the registry-wide observers.
     *
     * This is how a budget guard stays correct with concurrent runs: the registry
     * is shared, but a run's spend must only count against that run. The caller
     * closes over its own run id, so attribution is exact rather than inferred.
     */
    onUsage?: (usage: ModelCallUsage) => void;
}
/** One tool call the model asked for. */
export interface RequestedToolCall {
    id: CallId;
    name: string;
    /** Raw JSON string, exactly as produced by the model. */
    arguments: string;
}
/** The full outcome of one model call. */
export interface ModelResponse {
    profileId: string;
    provider: string;
    model: string;
    role: ModelRole;
    /** Visible text, blocks concatenated. */
    text: string;
    /** Reasoning/thinking text, when the model emits any. */
    reasoning: string;
    /** Every assembled content block, in order. */
    blocks: ContentBlock[];
    /** Tool calls the model requested, in order. */
    toolCalls: RequestedToolCall[];
    /** The assembled assistant message, ready to append to a tool loop. */
    message: Message;
    usage: TokenUsage;
    durationMs: number;
    /** Estimated cost; 0 when no price row matched. */
    costUsd: number;
    /** False when `costUsd` is 0 because pricing is unknown. */
    priced: boolean;
    finish: FinishReason;
    /** True for stop / tool-calls / max-tokens; false for error / aborted. */
    ok: boolean;
    /** Failure summary when `!ok`. */
    error?: string;
    /** Stable failure code when `!ok`. */
    errorCode?: string;
}
/** Configuration for the registry service. */
export interface ModelRegistryConfig {
    /** Profiles available to every run. */
    profiles: ModelProfile[];
    /** Price overrides keyed by model-id prefix; see utils/cost.ts. */
    pricing?: Record<string, ModelPrice>;
}
export declare class ModelRegistry {
    private readonly ctx;
    private readonly profiles;
    private readonly pricing;
    private readonly usageObservers;
    constructor(ctx: Context, config: ModelRegistryConfig);
    /** Add or replace a profile at runtime. */
    registerProfile(profile: ModelProfile): () => void;
    /** Look up one profile. */
    getProfile(id: string): ModelProfile | undefined;
    /** Every profile, in insertion order. */
    listProfiles(): ModelProfile[];
    /**
     * Profiles bound to `role`, enabled ones only.
     *
     * This is the primitive behind "one API key, many instances": the same
     * provider+model can back a proposer and the decision maker as two rows.
     */
    getProfilesByRole(role: ModelRole): ModelProfile[];
    /** Every enabled profile, whatever its role — used to build custom rosters. */
    listEnabled(): ModelProfile[];
    /** Remove a profile. Returns whether it existed. */
    removeProfile(id: string): boolean;
    /**
     * Check that a profile's provider route can serve its model.
     *
     * Deliberately does not send a request: `resolveModelInfo` consults the
     * registered adapter, so this costs no tokens and no latency. A profile
     * whose provider route is not mounted fails here rather than mid-run.
     */
    checkHealth(profileId: string): Promise<boolean>;
    /** Providers currently mounted, for diagnostics and the settings panel. */
    listProviders(): Array<{
        id: string;
        name: string;
    }>;
    /** Subscribe to completed calls (cost accounting, the UI feed). */
    onUsage(observer: (usage: ModelCallUsage) => void): () => void;
    private publishUsage;
    /**
     * Run one model call through the profile.
     *
     * Never throws for provider-side failures: an error or abort arrives as a
     * terminal `finish` reason and is reported through {@link ModelResponse.ok}.
     * That keeps the orchestration's control flow in one place instead of
     * sprinkling try/catch through every phase.
     */
    call(profileId: string, request: CallRequest): Promise<ModelResponse>;
    /** Build the message list for a request, from either form. */
    private buildMessages;
}
/**
 * Note on packaging: `ModelRegistry` is assembled by `src/index.ts`, which
 * owns the plugin's `Config`. It is not a standalone plugin module, because
 * its configuration (the profile list) is part of one shared config section —
 * splitting it into a second row would mean two places to edit one roster.
 * It *is* a Cordis service (`ctx.multiModelRegistry`), so sibling plugins can
 * still depend on it by key rather than by import.
 */
export declare const MODEL_REGISTRY_SERVICE: "multiModelRegistry";
//# sourceMappingURL=model-registry.d.ts.map