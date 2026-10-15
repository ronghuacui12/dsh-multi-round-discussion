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
import { ModelRegistry, MODEL_REGISTRY_SERVICE } from "./services/model-registry.js";
import { RunStore, RUN_STORE_SERVICE } from "./services/run-store.js";
import { Orchestrator } from "./plugins/orchestrator.js";
import { Observability } from "./plugins/observability.js";
import { registerApiRoutes } from "./host/api-routes.js";
import { UserSettings, normalizeProfiles, readRoster } from "./host/user-settings.js";
import { createDiscussTool } from "./tools/discuss.js";
import { DEFAULT_BUDGET } from "./core/budget-guard.js";
import { DEFAULT_SANDBOX } from "./core/sandbox.js";
/** Plugin name shown in Cordis diagnostics. */
export const name = 'multi-model-discussion';
/**
 * Required services. `tools` is required rather than optional because the
 * executor's whole contract is built on it; a composition without a tool
 * registry could propose and decide but never execute.
 */
export const inject = ['llm', 'tools'];
/** The services other plugins may consume. */
export const provide = [MODEL_REGISTRY_SERVICE, RUN_STORE_SERVICE];
/** Reported by the HTTP handshake route. */
export const VERSION = '0.1.0';
/** One model instance, as declared in `cordis.yml`. */
const ProfileSchema = Schema.object({
    id: Schema.string().required(),
    provider: Schema.string().required(),
    model: Schema.string().required(),
    apiKeyRef: Schema.string(),
    baseURL: Schema.string(),
    temperature: Schema.number(),
    maxTokens: Schema.natural(),
    systemPrompt: Schema.string(),
    role: Schema.union(['proposer', 'reviewer', 'decisionMaker', 'planBuilder', 'executor', 'verifier']).required(),
    enabled: Schema.boolean().default(true),
    label: Schema.string(),
});
/** Price row, keyed by model-id prefix. */
const PriceSchema = Schema.object({
    inputPerMillionUsd: Schema.number().required(),
    outputPerMillionUsd: Schema.number().required(),
    cacheReadPerMillionUsd: Schema.number(),
});
/**
 * The schema, with defaults (doc §12).
 *
 * The shipped default profiles all point at the `deepseek-official` route that
 * `dsh-llm-deepseek` registers out of the box. That makes the plugin useful
 * immediately, and the three rows also demonstrate the core idea: same
 * provider, same or different models, three different roles and prompts.
 */
export const Config = Schema.object({
    enabled: Schema.boolean().default(true),
    preset: Schema.union(['fast', 'balanced', 'deep', 'custom']).default('balanced'),
    // When true, every proposer is shown the anonymised proposals of the others
    // and asked what it now thinks. This is the "discuss" half of the plugin.
    peerReview: Schema.boolean().default(true),
    profiles: Schema.array(ProfileSchema).default([
        {
            id: 'lead',
            provider: 'deepseek-official',
            model: 'deepseek-v4-pro',
            role: 'decisionMaker',
            label: '主导模型 · DeepSeek V4 Pro',
            enabled: true,
            systemPrompt: '你是一位经验丰富的技术负责人，擅长在多种方案之间做出取舍并给出可执行的路径。',
        },
        {
            id: 'proposer-fast',
            provider: 'deepseek-official',
            model: 'deepseek-v4-flash',
            role: 'proposer',
            label: '提案 A · V4 Flash',
            enabled: true,
            temperature: 0.8,
            systemPrompt: '你偏好直接、务实的落地路径，倾向于用最小的改动解决问题。',
        },
        {
            id: 'proposer-pro',
            provider: 'deepseek-official',
            model: 'deepseek-v4-pro',
            role: 'proposer',
            label: '提案 B · V4 Pro',
            enabled: true,
            temperature: 0.4,
            systemPrompt: '你偏好结构化、可扩展的设计，会主动指出别人容易忽略的长期成本。',
        },
        {
            id: 'executor',
            provider: 'deepseek-official',
            model: 'deepseek-v4-flash',
            role: 'executor',
            label: '执行模型 · V4 Flash',
            enabled: true,
            temperature: 0.1,
            maxTokens: 8192,
        },
    ]),
    budget: Schema.object({
        maxTotalTokens: Schema.natural().default(DEFAULT_BUDGET.maxTotalTokens),
        maxTotalCostUsd: Schema.number().default(DEFAULT_BUDGET.maxTotalCostUsd),
        maxDurationMs: Schema.natural().default(DEFAULT_BUDGET.maxDurationMs),
        maxDiscussionRounds: Schema.natural().default(DEFAULT_BUDGET.maxDiscussionRounds),
        maxProposers: Schema.natural().default(DEFAULT_BUDGET.maxProposers),
    }),
    executor: Schema.object({
        // Default deny: an executor with no tools can still plan and describe, but
        // cannot touch anything. Operators opt in explicitly.
        allowedTools: Schema.array(Schema.string()).default(DEFAULT_SANDBOX.allowedTools),
        requireConfirmationForWrites: Schema.boolean().default(DEFAULT_SANDBOX.requireConfirmationForWrites),
        maxSteps: Schema.natural().default(DEFAULT_SANDBOX.maxSteps),
    }),
    overrides: Schema.object({
        lead: Schema.string(),
        proposers: Schema.array(Schema.string()),
        reviewers: Schema.array(Schema.string()),
        executor: Schema.string(),
        verifier: Schema.string(),
    }),
    api: Schema.object({
        token: Schema.string(),
    }),
    pricing: Schema.dict(PriceSchema),
});
// ----------------------------------------------------------------------- apply
export function apply(ctx, config) {
    const logger = ctx.logger(name);
    if (!config.enabled) {
        logger.info('disabled by configuration; no models will be dispatched');
        return;
    }
    // -------------------------------------------------------------- model layer
    // A roster saved from the settings panel wins over the shipped default: the
    // bundle's list is a starting point, not a policy. A malformed file falls back
    // to the built-in roster with a warning rather than failing the plugin load.
    const saved = readRoster();
    let effectiveProfiles = config.profiles;
    if (Array.isArray(saved.profiles) && saved.profiles.length > 0) {
        try {
            effectiveProfiles = normalizeProfiles(saved.profiles);
        }
        catch (cause) {
            logger.warn('~/.dsh/mmd/roster.json 解析失败，改用内置默认阵容：%s', cause instanceof Error ? cause.message : String(cause));
        }
    }
    let registry;
    try {
        registry = new ModelRegistry(ctx, {
            profiles: effectiveProfiles,
            ...(config.pricing ? { pricing: config.pricing } : {}),
        });
    }
    catch (cause) {
        // Fail during load with an actionable message rather than at the first
        // dispatch, when the user is watching a run and cannot tell why.
        throw new Error(`multi-model-discussion 配置错误：${cause instanceof Error ? cause.message : String(cause)}`);
    }
    ctx.provide(MODEL_REGISTRY_SERVICE, registry);
    const enabledProfiles = registry.listEnabled();
    const byRole = new Map();
    for (const profile of enabledProfiles) {
        byRole.set(profile.role, (byRole.get(profile.role) ?? 0) + 1);
    }
    const missing = [];
    if ((byRole.get('proposer') ?? 0) === 0)
        missing.push('proposer');
    if ((byRole.get('decisionMaker') ?? 0) === 0)
        missing.push('decisionMaker');
    if ((byRole.get('executor') ?? 0) === 0)
        missing.push('executor');
    if (missing.length > 0) {
        // A warning, not a throw: the plugin should still load so the settings
        // panel works and the user can fix the roster there. Starting a run will
        // fail with a precise message instead.
        logger.warn('缺少必需角色的 ModelProfile：%s。在补齐之前无法发起研讨运行。', missing.join('、'));
    }
    // ---------------------------------------------------------------- run layer
    const store = new RunStore();
    // Published as a service so the client bridge, sibling plugins, and tests can
    // read run state without importing this module.
    ctx.provide(RUN_STORE_SERVICE, store);
    const orchestratorConfig = {
        preset: config.preset,
        peerReview: config.peerReview,
        enabled: config.enabled,
        budget: config.budget,
        executor: config.executor,
        ...(config.overrides ? { overrides: config.overrides } : {}),
    };
    const orchestrator = new Orchestrator({
        ctx,
        registry,
        store,
        config: orchestratorConfig,
        logger,
    });
    // Live settings: the settings panel writes through this object, which updates
    // the registry and the orchestrator config in the same step it persists them.
    const settings = new UserSettings({
        registry,
        orchestratorConfig,
        logger,
        document: saved,
    });
    try {
        const restored = {};
        if (saved.execution)
            restored.execution = saved.execution;
        if (saved.preset)
            restored.preset = saved.preset;
        if (Object.keys(restored).length > 0)
            settings.apply(restored);
    }
    catch (cause) {
        logger.warn('已保存的研讨设置未能恢复，使用配置默认值：%s', cause instanceof Error ? cause.message : String(cause));
    }
    // -------------------------------------------------------------- attachment
    const observability = new Observability(store, logger);
    ctx.effect(() => observability.attach(), 'multi-model-discussion/observability');
    // The HTTP layer is optional: on a harness with no webserver the plugin still
    // works. The webserver is provided by a sibling row that may not be registered
    // yet when this plugin activates, and a plugin can only resolve a service it
    // declares, so wait for it with ctx.inject instead of a single ctx.get() at
    // apply time -- the one-shot lookup resolves to nothing and silently skips the
    // routes. If no webserver ever appears the callback simply never runs.
    ctx.inject(['webServer'], (scope) => {
        scope.effect(() => registerApiRoutes({
            ctx: scope,
            store,
            registry,
            orchestrator,
            settings,
            config: () => orchestratorConfig,
            version: VERSION,
            token: config.api?.token,
            logger,
        }), 'multi-model-discussion/api-routes');
    });
    ctx.effect(() => ctx.tools.register(createDiscussTool({
        store,
        orchestrator,
        config: () => orchestratorConfig,
    })), 'multi-model-discussion/discuss-tool');
    // Abort every in-flight run when the plugin unloads, so a hot reload does
    // not leave orphaned model calls running against the old config.
    ctx.effect(() => () => orchestrator.dispose(), 'multi-model-discussion/runs');
    logger.info('ready: %d profiles (%s), preset=%s, executor tools=[%s]', enabledProfiles.length, [...byRole.entries()].map(([role, count]) => `${role}:${count}`).join(' '), config.preset, config.executor.allowedTools.join(', ') || 'none');
}
// ------------------------------------------------------------------ re-exports
export { ModelRegistry, MODEL_REGISTRY_SERVICE } from "./services/model-registry.js";
export { RunStore, RUN_STORE_SERVICE, computeCostSummary, } from "./services/run-store.js";
export { Orchestrator } from "./plugins/orchestrator.js";
export { DiscussionEngine, EmptyRoundError } from "./plugins/discussion-engine.js";
export { LeadModel } from "./plugins/lead-model.js";
export { Executor } from "./plugins/executor.js";
export { Verifier, skippedVerification } from "./plugins/verifier.js";
export { Observability } from "./plugins/observability.js";
export { SharedBlackboard } from "./core/blackboard.js";
export { BudgetGuard, DEFAULT_BUDGET } from "./core/budget-guard.js";
export { StateMachine, IllegalTransitionError, PHASE_LABELS, statusOf } from "./core/state-machine.js";
export { ToolSandbox, DEFAULT_SANDBOX, isReadOnlyTool } from "./core/sandbox.js";
export { buildRoster, RosterError, describeRoster } from "./core/roster.js";
export { PRESETS, PRESET_LABELS, PRESET_DESCRIPTIONS, resolvePreset } from "./core/preset.js";
export { API_PREFIX, registerApiRoutes } from "./host/api-routes.js";
export { DISCUSS_TOOL_NAME, createDiscussTool } from "./tools/discuss.js";
export * from "./types/index.js";
//# sourceMappingURL=index.js.map