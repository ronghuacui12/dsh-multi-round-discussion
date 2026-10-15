/**
 * ModelProfile: the "one API key can mint many model instances" abstraction.
 *
 * The four layers the design document asks to keep apart are modelled as four
 * distinct things, and never collapsed into one field:
 *
 *   Provider route  -> `ModelProfile.provider`  (a key registered with ctx.llm)
 *   Model endpoint  -> `ModelProfile.model`     (the wire model id)
 *   Model instance  -> one ModelProfile         (its own temperature / prompt)
 *   Role binding    -> `ModelProfile.role`      (what this instance is FOR)
 *
 * Because an instance is just a profile row, the same `provider` + `model` may
 * appear any number of times with different `temperature` / `systemPrompt` /
 * `role`. That is the whole mechanism behind "one API key, many models".
 */
/** The job a model instance performs in one orchestration run. */
export type ModelRole = 
/** Contributes an independent proposal. Never sees sibling proposals. */
'proposer'
/** Cross-reviews proposals anonymously. */
 | 'reviewer'
/** The lead model: decides, and owns the final answer. */
 | 'decisionMaker'
/** Turns a decision into a structured plan. Usually the lead model. */
 | 'planBuilder'
/** Executes a plan. Strictly cannot re-plan. */
 | 'executor'
/** Checks an execution result against the plan's acceptance criteria. */
 | 'verifier';
/** All roles, in the order a run exercises them. */
export declare const MODEL_ROLES: readonly ModelRole[];
/**
 * How a credential is located. The secret itself is never stored in a profile
 * and never leaves the host: `apiKeyRef` names *where* to find it, and the
 * harness credential/environment seam resolves it per request.
 */
export interface ModelProfile {
    /** Stable identity, unique within this plugin's registry. */
    id: string;
    /**
     * Registered provider route, i.e. the key accepted by
     * `GenerateOptions.provider` ('deepseek-official', 'openai', ...).
     * Not a vendor name: several routes may target one vendor.
     */
    provider: string;
    /** Wire model id passed through to the provider. */
    model: string;
    /**
     * Credential reference resolved by the harness (an environment variable name
     * such as `DEEPSEEK_API_KEY`). Never an inline secret.
     */
    apiKeyRef?: string;
    /** Optional endpoint override for OpenAI-compatible / self-hosted routes. */
    baseURL?: string;
    /** Sampling temperature for this instance. */
    temperature?: number;
    /** Per-request output cap for this instance. */
    maxTokens?: number;
    /** Role-specific system prompt for this instance. */
    systemPrompt?: string;
    /** The job this instance performs. */
    role: ModelRole;
    /** Disabled profiles stay registered but are never selected. */
    enabled?: boolean;
    /** Display name for the UI; falls back to `id`. */
    label?: string;
}
/** A profile resolved enough to be dispatched: `id` plus its wire identity. */
export interface ResolvedModelProfile extends ModelProfile {
    /** Which role slot asked for it — kept for reporting, not for routing. */
    requestedRole: ModelRole;
}
/** What one model call cost, in the shape the budget guard and UI both read. */
export interface ModelCallUsage {
    /** Profile that produced this call. */
    profileId: string;
    provider: string;
    model: string;
    role: ModelRole;
    /** Uncached input tokens (see TokenUsage: counts are disjoint). */
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    reasoningTokens: number;
    /** Wall-clock duration of the call in milliseconds. */
    durationMs: number;
    /** Estimated cost in USD; 0 when the model has no configured price. */
    costUsd: number;
    /** Terminal state of the call. */
    status: 'success' | 'failed' | 'aborted';
    /** Stable failure code when `status !== 'success'`. */
    errorCode?: string;
    /** Human-readable failure summary when `status !== 'success'`. */
    errorMessage?: string;
}
/** Per-model price table used to turn token counts into an estimated cost. */
export interface ModelPrice {
    /** USD per 1M uncached input tokens. */
    inputPerMillionUsd: number;
    /** USD per 1M output tokens. */
    outputPerMillionUsd: number;
    /** USD per 1M cached-read input tokens. Defaults to a fraction of input. */
    cacheReadPerMillionUsd?: number;
}
//# sourceMappingURL=model-profile.d.ts.map