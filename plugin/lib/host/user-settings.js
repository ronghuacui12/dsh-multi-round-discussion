/**
 * User-facing settings layer for the multi-model discussion plugin.
 *
 * The plugin ships a default roster in its config schema, but the roster a user
 * actually wants (which model plays which role, how the executor is allowed to
 * act) belongs to the user, not to a bundle. This module is the single place
 * that reads and writes that preference set.
 *
 * Storage is a plain JSON document at `~/.dsh/mmd/roster.json` -- the same file
 * the "研讨模式" preset row already reads for `profiles`, so a roster edited in
 * the GUI is also the roster the next preset mount picks up. The document is
 * written atomically (temp file + rename) because the preset reads it at mount
 * time and a half-written file would fail that read.
 *
 * @module dsh-multi-model-discussion/host/user-settings
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Roles a profile may hold, in the order the settings UI groups them. */
export const ROLE_ORDER = ['decisionMaker', 'proposer', 'reviewer', 'executor', 'verifier'];
/** Roles without which no run can start. */
export const REQUIRED_ROLES = ['decisionMaker', 'proposer', 'executor'];
/** Execution policies. `confirm` parks the run before it touches anything. */
export const EXECUTION_MODES = ['confirm', 'auto'];
/**
 * How the executor's tool calls are sandboxed.
 *
 * - `full`    -- run unconfined: the call carries no session, so DSH resolves the
 *                deployment default the operator configured (danger-full-access
 *                gives the executor the same reach as a 完全权限 session).
 * - `session` -- carry the session that started the discussion, so the executor
 *                inherits that session's sandbox mode and workspace root.
 */
export const PERMISSION_MODES = ['full', 'session'];

/** Directory holding every user-editable artifact of this plugin. */
export function mmdHome() {
    return process.env.DSH_MMD_HOME || path.join(os.homedir(), '.dsh', 'mmd');
}

/** Path of the roster document. */
export function rosterPath() {
    return path.join(mmdHome(), 'roster.json');
}

/** Path of the avatar directory. */
export function avatarDir() {
    return path.join(mmdHome(), 'avatars');
}

/** Read the roster document, returning `{}` when it is absent or unreadable. */
export function readRoster() {
    try {
        const raw = fs.readFileSync(rosterPath(), 'utf8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }
    catch {
        // Absent or malformed: fall back to the shipped defaults rather than
        // failing the plugin load.
        return {};
    }
}

/** Write the roster document atomically, creating the directory if needed. */
export function writeRoster(document) {
    const dir = mmdHome();
    fs.mkdirSync(dir, { recursive: true });
    const target = rosterPath();
    const temp = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    fs.renameSync(temp, target);
}

/** Coerce a value read back from JSON into a trimmed string. */
function text(value) {
    return typeof value === 'string' ? value.trim() : '';
}

/**
 * Validate one incoming profile row.
 *
 * Deliberately strict about identity (id/provider/model/role) and permissive
 * about tuning knobs: a wrong id breaks role lookup, while a wrong temperature
 * is merely a preference.
 */
export function normalizeProfile(raw, index) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        throw new Error(`第 ${index + 1} 行不是一个对象。`);
    const id = text(raw.id);
    const provider = text(raw.provider);
    const model = text(raw.model);
    const role = text(raw.role);
    if (!id)
        throw new Error(`第 ${index + 1} 行缺少 id。`);
    if (!provider)
        throw new Error(`模型 "${id}" 缺少 provider。`);
    if (!model)
        throw new Error(`模型 "${id}" 缺少 model。`);
    if (!ROLE_ORDER.includes(role))
        throw new Error(`模型 "${id}" 的角色 "${role}" 无效，必须是 ${ROLE_ORDER.join(' / ')} 之一。`);
    const profile = { id, provider, model, role };
    if (raw.enabled !== undefined)
        profile.enabled = raw.enabled !== false;
    if (text(raw.label))
        profile.label = text(raw.label);
    if (text(raw.systemPrompt))
        profile.systemPrompt = String(raw.systemPrompt);
    if (typeof raw.temperature === 'number' && Number.isFinite(raw.temperature))
        profile.temperature = Math.min(2, Math.max(0, raw.temperature));
    if (typeof raw.maxTokens === 'number' && Number.isFinite(raw.maxTokens) && raw.maxTokens > 0)
        profile.maxTokens = Math.floor(raw.maxTokens);
    if (text(raw.apiKeyRef))
        profile.apiKeyRef = text(raw.apiKeyRef);
    if (text(raw.baseURL))
        profile.baseURL = text(raw.baseURL);
    return profile;
}

/** Validate a whole profile list, rejecting duplicate ids. */
export function normalizeProfiles(raw) {
    if (!Array.isArray(raw))
        throw new Error('profiles 必须是数组。');
    const profiles = raw.map((entry, index) => normalizeProfile(entry, index));
    const seen = new Set();
    for (const profile of profiles) {
        if (seen.has(profile.id))
            throw new Error(`模型 id "${profile.id}" 重复。`);
        seen.add(profile.id);
    }
    return profiles;
}

/** Validate the execution block. */
export function normalizeExecution(raw, fallback) {
    const base = {
        mode: fallback?.mode ?? 'confirm',
        toolConfirmation: fallback?.toolConfirmation ?? false,
        permissions: fallback?.permissions ?? 'full',
        allowedTools: Array.isArray(fallback?.allowedTools) ? [...fallback.allowedTools] : [],
        maxSteps: typeof fallback?.maxSteps === 'number' ? fallback.maxSteps : 12,
    };
    if (raw === undefined)
        return base;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        throw new Error('execution 必须是一个对象。');
    if (raw.mode !== undefined) {
        if (!EXECUTION_MODES.includes(raw.mode))
            throw new Error(`execution.mode 必须是 ${EXECUTION_MODES.join(' 或 ')}。`);
        base.mode = raw.mode;
    }
    if (raw.toolConfirmation !== undefined) {
        if (typeof raw.toolConfirmation !== 'boolean')
            throw new Error('execution.toolConfirmation 必须是布尔值。');
        base.toolConfirmation = raw.toolConfirmation;
    }
    if (raw.permissions !== undefined) {
        if (!PERMISSION_MODES.includes(raw.permissions))
            throw new Error(`execution.permissions 必须是 ${PERMISSION_MODES.join(' 或 ')}。`);
        base.permissions = raw.permissions;
    }
    if (raw.allowedTools !== undefined) {
        if (!Array.isArray(raw.allowedTools) || raw.allowedTools.some((tool) => typeof tool !== 'string'))
            throw new Error('execution.allowedTools 必须是字符串数组。');
        base.allowedTools = [...new Set(raw.allowedTools.map((tool) => tool.trim()).filter(Boolean))];
    }
    if (raw.maxSteps !== undefined) {
        // 0 means unlimited: the executor stops when the plan is done or the run is
        // aborted, and the budget guard still caps the whole run.
        if (typeof raw.maxSteps !== 'number' || !Number.isFinite(raw.maxSteps) || raw.maxSteps < 0)
            throw new Error('execution.maxSteps 必须是非负数（0 = 不限）。');
        base.maxSteps = Math.floor(raw.maxSteps);
    }
    return base;
}

/**
 * Owns the live settings: it applies a change to the running registry and
 * orchestrator config *and* persists it, so a restart reproduces the state.
 */
export class UserSettings {
    registry;
    orchestratorConfig;
    logger;
    document;
    constructor(options) {
        this.registry = options.registry;
        this.orchestratorConfig = options.orchestratorConfig;
        this.logger = options.logger;
        this.document = options.document ?? readRoster();
    }
    /**
     * Serialize the current state for the settings UI.
     *
     * `providers` is filled by the caller (it needs `ctx.llm`), so this method
     * stays free of runtime dependencies.
     */
    snapshot() {
        return {
            profiles: this.registry.listProfiles(),
            execution: {
                mode: this.orchestratorConfig.executor?.planApproval === false ? 'auto' : 'confirm',
                toolConfirmation: this.orchestratorConfig.executor?.requireConfirmationForWrites === true,
                permissions: this.orchestratorConfig.executor?.permissions ?? 'full',
                allowedTools: [...(this.orchestratorConfig.executor?.allowedTools ?? [])],
                maxSteps: this.orchestratorConfig.executor?.maxSteps ?? 12,
            },
            preset: this.orchestratorConfig.preset,
            peerReview: this.orchestratorConfig.peerReview !== false,
            avatars: { ...(this.document.avatars ?? {}) },
        };
    }
    /**
     * Apply a partial settings patch, live and persistently.
     *
     * Ordering matters: the registry and orchestrator are updated first, so a
     * persistence failure leaves a working runtime and a loud warning rather
     * than a saved preference the process is not honouring.
     */
    apply(patch) {
        const warnings = [];
        if (!patch || typeof patch !== 'object' || Array.isArray(patch))
            throw new Error('设置必须是一个对象。');
        const next = { ...this.document };
        if (patch.profiles !== undefined) {
            const profiles = normalizeProfiles(patch.profiles);
            const missing = REQUIRED_ROLES.filter((role) => !profiles.some((profile) => profile.role === role && profile.enabled !== false));
            if (missing.length > 0)
                warnings.push(`缺少必需角色：${missing.join('、')}，在此之前无法发起研讨。`);
            this.replaceProfiles(profiles);
            next.profiles = profiles;
        }
        if (patch.execution !== undefined) {
            const execution = normalizeExecution(patch.execution, this.snapshot().execution);
            this.orchestratorConfig.executor = {
                ...(this.orchestratorConfig.executor ?? {}),
                permissions: execution.permissions,
                allowedTools: execution.allowedTools,
                maxSteps: execution.maxSteps,
                // `mode` parks the run before executing a state-changing plan.
                planApproval: execution.mode === 'confirm',
                // Per-tool confirmation is a separate switch, and it is the one that
                // silently skips work when there is no channel to ask through.
                requireConfirmationForWrites: execution.toolConfirmation === true,
            };
            next.execution = execution;
        }
        if (patch.peerReview !== undefined) {
            if (typeof patch.peerReview !== 'boolean')
                throw new Error('peerReview 必须是布尔值。');
            this.orchestratorConfig.peerReview = patch.peerReview;
            next.peerReview = patch.peerReview;
        }
        if (patch.preset !== undefined) {
            if (!['fast', 'balanced', 'deep', 'custom'].includes(patch.preset))
                throw new Error('preset 必须是 fast / balanced / deep / custom 之一。');
            this.orchestratorConfig.preset = patch.preset;
            next.preset = patch.preset;
        }
        if (patch.avatars !== undefined) {
            if (!patch.avatars || typeof patch.avatars !== 'object' || Array.isArray(patch.avatars))
                throw new Error('avatars 必须是一个对象。');
            const merged = { ...(this.document.avatars ?? {}) };
            for (const [key, value] of Object.entries(patch.avatars)) {
                if (value === null || value === '')
                    delete merged[key];
                else if (typeof value === 'string')
                    merged[key] = value;
            }
            next.avatars = merged;
        }
        this.document = next;
        try {
            // The registry is the source of truth for the roster: persisting the
            // document's stale copy here would resurrect profiles the registry no
            // longer holds (and lose ones it gained) on the next restart.
            writeRoster({ ...next, profiles: this.registry.listProfiles() });
        }
        catch (cause) {
            warnings.push(`设置已在本次运行中生效，但写入 ${rosterPath()} 失败：${cause instanceof Error ? cause.message : String(cause)}`);
            this.logger?.warn('failed to persist roster: %s', cause instanceof Error ? cause.message : String(cause));
        }
        return { settings: this.snapshot(), warnings };
    }
    /** Swap the registry contents to exactly `profiles`. */
    replaceProfiles(profiles) {
        const wanted = new Set(profiles.map((profile) => profile.id));
        for (const existing of this.registry.listProfiles()) {
            if (!wanted.has(existing.id))
                this.registry.removeProfile(existing.id);
        }
        for (const profile of profiles)
            this.registry.registerProfile(profile);
    }
    /** Record one avatar file name for a role seat. */
    setAvatar(key, fileName) {
        const avatars = { ...(this.document.avatars ?? {}) };
        avatars[key] = fileName;
        this.document = { ...this.document, avatars };
        try {
            writeRoster(this.document);
        }
        catch (cause) {
            this.logger?.warn('failed to persist avatar: %s', cause instanceof Error ? cause.message : String(cause));
        }
        return avatars;
    }
}
