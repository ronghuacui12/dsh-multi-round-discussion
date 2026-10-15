import { BlockAssembler, createUserMessage, } from '@deepseek-ai/dsh-llm';
import { estimateCostUsd } from "../utils/cost.js";
/** Token usage with every optional field materialised to a number. */
function normalizeUsage(usage) {
    return {
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        cacheReadTokens: usage?.cacheReadTokens ?? 0,
        cacheWriteTokens: usage?.cacheWriteTokens ?? 0,
        reasoningTokens: usage?.reasoningTokens ?? 0,
    };
}
/** Join every text block into one string. */
function textOf(blocks) {
    return blocks
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');
}
/** Join every reasoning block into one string. */
function reasoningOf(blocks) {
    return blocks
        .filter((block) => block.type === 'reasoning')
        .map((block) => block.text)
        .join('');
}
/** Pull tool calls out of the assembled blocks. */
function toolCallsOf(blocks) {
    return blocks
        .filter((block) => block.type === 'tool-call')
        .map((block) => ({ id: block.id, name: block.name, arguments: block.arguments }));
}
export class ModelRegistry {
    ctx;
    profiles = new Map();
    pricing;
    usageObservers = new Set();
    constructor(ctx, config) {
        this.ctx = ctx;
        this.pricing = config.pricing ?? {};
        // Duplicate ids are a configuration error, not a last-write-wins: two
        // rows sharing an id would make role lookup non-deterministic.
        for (const profile of config.profiles) {
            if (this.profiles.has(profile.id)) {
                throw new Error(`Duplicate ModelProfile id "${profile.id}" in configuration.`);
            }
            this.profiles.set(profile.id, profile);
        }
    }
    // ------------------------------------------------------------- registration
    /** Add or replace a profile at runtime. */
    registerProfile(profile) {
        const previous = this.profiles.get(profile.id);
        this.profiles.set(profile.id, profile);
        return () => {
            if (previous)
                this.profiles.set(profile.id, previous);
            else
                this.profiles.delete(profile.id);
        };
    }
    /** Look up one profile. */
    getProfile(id) {
        return this.profiles.get(id);
    }
    /** Every profile, in insertion order. */
    listProfiles() {
        return [...this.profiles.values()];
    }
    /**
     * Profiles bound to `role`, enabled ones only.
     *
     * This is the primitive behind "one API key, many instances": the same
     * provider+model can back a proposer and the decision maker as two rows.
     */
    getProfilesByRole(role) {
        return this.listProfiles().filter((profile) => profile.role === role && profile.enabled !== false);
    }
    /** Every enabled profile, whatever its role — used to build custom rosters. */
    listEnabled() {
        return this.listProfiles().filter((profile) => profile.enabled !== false);
    }
    /** Remove a profile. Returns whether it existed. */
    removeProfile(id) {
        return this.profiles.delete(id);
    }
    // ------------------------------------------------------------------ health
    /**
     * Check that a profile's provider route can serve its model.
     *
     * Deliberately does not send a request: `resolveModelInfo` consults the
     * registered adapter, so this costs no tokens and no latency. A profile
     * whose provider route is not mounted fails here rather than mid-run.
     */
    async checkHealth(profileId) {
        const profile = this.profiles.get(profileId);
        if (!profile)
            return false;
        try {
            const info = await this.ctx.llm.resolveModelInfo(profile.provider, profile.model);
            return info.provider === profile.provider && info.id === profile.model;
        }
        catch {
            return false;
        }
    }
    /** Providers currently mounted, for diagnostics and the settings panel. */
    listProviders() {
        return this.ctx.llm.listProviders().map((provider) => ({ id: provider.id, name: provider.name }));
    }
    // ---------------------------------------------------------------- observing
    /** Subscribe to completed calls (cost accounting, the UI feed). */
    onUsage(observer) {
        this.usageObservers.add(observer);
        return () => {
            this.usageObservers.delete(observer);
        };
    }
    publishUsage(usage) {
        for (const observer of this.usageObservers) {
            try {
                observer(usage);
            }
            catch {
                // An observer must never turn a successful call into a failed one.
            }
        }
    }
    // -------------------------------------------------------------------- call
    /**
     * Run one model call through the profile.
     *
     * Never throws for provider-side failures: an error or abort arrives as a
     * terminal `finish` reason and is reported through {@link ModelResponse.ok}.
     * That keeps the orchestration's control flow in one place instead of
     * sprinkling try/catch through every phase.
     */
    async call(profileId, request) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Unknown ModelProfile "${profileId}". Register it before dispatching a run.`);
        }
        if (profile.enabled === false) {
            throw new Error(`ModelProfile "${profileId}" is disabled.`);
        }
        const messages = this.buildMessages(request);
        const system = request.system ?? profile.systemPrompt;
        const assembler = new BlockAssembler();
        const startedAt = Date.now();
        let thrown;
        try {
            const stream = this.ctx.llm.stream({
                provider: profile.provider,
                model: profile.model,
                messages,
                ...(system != null ? { system } : {}),
                ...(profile.temperature != null ? { temperature: profile.temperature } : {}),
                ...(profile.maxTokens != null ? { maxTokens: profile.maxTokens } : {}),
                ...(request.tools != null && request.tools.length > 0 ? { tools: request.tools } : {}),
                ...(request.signal != null ? { signal: request.signal } : {}),
            });
            for await (const chunk of stream)
                assembler.push(chunk);
        }
        catch (cause) {
            // `LlmService.stream` normalises adapter failures into a terminal chunk,
            // so anything reaching here is a consumer/middleware fault. Record it as
            // a failed call and let the caller decide.
            thrown = cause;
        }
        const durationMs = Date.now() - startedAt;
        const blocks = thrown ? [] : assembler.blocks();
        const usage = normalizeUsage(assembler.usage);
        const finish = thrown
            ? { kind: 'error', failure: { message: thrown.message, code: 'CONSUMER_ERROR' } }
            : assembler.finish;
        const ok = finish.kind === 'stop' || finish.kind === 'tool-calls' || finish.kind === 'max-tokens';
        const estimate = estimateCostUsd(usage, profile.model, this.pricing);
        const response = {
            profileId: profile.id,
            provider: profile.provider,
            model: profile.model,
            role: profile.role,
            text: textOf(blocks),
            reasoning: reasoningOf(blocks),
            blocks,
            toolCalls: toolCallsOf(blocks),
            message: assembler.message({ kind: 'model', provider: profile.provider, model: profile.model }),
            usage,
            durationMs,
            costUsd: estimate.costUsd,
            priced: estimate.priced,
            finish,
            ok,
            ...(ok ? {} : { error: finishError(finish, thrown) }),
            ...(ok ? {} : { errorCode: finishCode(finish) }),
        };
        const usageRecord = {
            profileId: profile.id,
            provider: profile.provider,
            model: profile.model,
            role: profile.role,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cacheReadTokens: usage.cacheReadTokens,
            cacheWriteTokens: usage.cacheWriteTokens,
            reasoningTokens: usage.reasoningTokens,
            durationMs,
            costUsd: estimate.costUsd,
            status: ok ? 'success' : finish.kind === 'aborted' ? 'aborted' : 'failed',
            ...(response.errorCode != null ? { errorCode: response.errorCode } : {}),
            ...(response.error != null ? { errorMessage: response.error } : {}),
        };
        // The caller-scoped sink first: a per-run budget should be updated even if
        // a global observer throws.
        try {
            request.onUsage?.(usageRecord);
        }
        catch {
            // A caller's accounting failure must not fail an otherwise fine call.
        }
        this.publishUsage(usageRecord);
        return response;
    }
    /** Build the message list for a request, from either form. */
    buildMessages(request) {
        if (request.messages && request.messages.length > 0)
            return request.messages;
        const prompt = request.prompt;
        if (prompt == null || prompt === '') {
            throw new Error('CallRequest needs either `prompt` or a non-empty `messages` array.');
        }
        return [createUserMessage({ content: [{ type: 'text', text: prompt }], source: { kind: 'user' } })];
    }
}
/** Human-readable failure text for a terminal finish reason. */
function finishError(finish, thrown) {
    if (thrown)
        return thrown.message;
    if (finish.kind === 'error')
        return finish.failure.message;
    if (finish.kind === 'aborted')
        return finish.failure.message;
    return 'Model call did not complete.';
}
/** Stable machine code for a terminal finish reason. */
function finishCode(finish) {
    if (finish.kind === 'error')
        return finish.failure.code;
    if (finish.kind === 'aborted')
        return 'ABORTED';
    return 'UNKNOWN';
}
/**
 * Note on packaging: `ModelRegistry` is assembled by `src/index.ts`, which
 * owns the plugin's `Config`. It is not a standalone plugin module, because
 * its configuration (the profile list) is part of one shared config section —
 * splitting it into a second row would mean two places to edit one roster.
 * It *is* a Cordis service (`ctx.multiModelRegistry`), so sibling plugins can
 * still depend on it by key rather than by import.
 */
export const MODEL_REGISTRY_SERVICE = 'multiModelRegistry';
//# sourceMappingURL=model-registry.js.map