/** Raised when the configured profiles cannot fill the requested roster. */
export class RosterError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RosterError';
    }
}
/** Take up to `count` profiles, in registry order. */
function take(profiles, count) {
    return profiles.slice(0, count);
}
/**
 * Build the roster for one run.
 *
 * @param registry - the profile registry.
 * @param preset - shape of the roster.
 * @param overrides - explicit profile ids from the configuration panel.
 */
export function buildRoster(registry, preset, overrides = {}) {
    const lead = resolveOne(registry, overrides.lead, 'decisionMaker', '主导模型（decisionMaker）');
    // `length > 0`, not a bare truthiness check: schema validation materialises
    // an omitted array field as `[]`, which is truthy and would silently
    // override role lookup with an empty roster.
    const proposerPool = overrides.proposers && overrides.proposers.length > 0
        ? overrides.proposers.map((id) => mustGet(registry, id, '提案模型（proposer）'))
        : registry.getProfilesByRole('proposer');
    if (proposerPool.length === 0) {
        throw new RosterError('没有可用的提案模型。请至少注册一个 role 为 "proposer" 的 ModelProfile（或在 preset 中显式指定 proposers）。');
    }
    const proposers = take(proposerPool, preset.proposers);
    const reviewers = preset.review
        ? overrides.reviewers && overrides.reviewers.length > 0
            ? overrides.reviewers.map((id) => mustGet(registry, id, '评审模型（reviewer）'))
            : registry.getProfilesByRole('reviewer')
        : [];
    const executor = resolveOne(registry, overrides.executor, 'executor', '执行模型（executor）');
    const verifier = preset.verify
        ? overrides.verifier != null && overrides.verifier !== ''
            ? mustGet(registry, overrides.verifier, '验证模型（verifier）')
            : registry.getProfilesByRole('verifier')[0]
        : undefined;
    // The lead model doubles as the plan builder (doc §2.1: 主导模型 = 决策者 + 计划生成者).
    return {
        preset: preset.name,
        lead,
        proposers,
        reviewers,
        executor,
        ...(verifier ? { verifier } : {}),
    };
}
/** Resolve one profile by explicit id, else by role, else fail loudly. */
function resolveOne(registry, explicitId, role, label) {
    // An empty string is how an unset optional string field can arrive; treat it
    // as "not specified" rather than as an id.
    if (explicitId != null && explicitId !== '')
        return mustGet(registry, explicitId, label);
    const candidates = registry.getProfilesByRole(role);
    const first = candidates[0];
    if (!first) {
        throw new RosterError(`没有可用的${label}。请注册一个 role 为 "${role}" 的 ModelProfile，或在配置中显式指定。`);
    }
    return first;
}
/** Look up a profile by id, or fail with an actionable message. */
function mustGet(registry, id, label) {
    const profile = registry.getProfile(id);
    if (!profile) {
        throw new RosterError(`${label} 引用了不存在的 ModelProfile "${id}"。`);
    }
    if (profile.enabled === false) {
        throw new RosterError(`${label} 引用了已被禁用的 ModelProfile "${id}"。`);
    }
    return profile;
}
/** Summarise a roster for the log line and the UI. */
export function describeRoster(roster) {
    const parts = [
        `preset=${roster.preset}`,
        `lead=${roster.lead.label ?? roster.lead.id}`,
        `proposers=[${roster.proposers.map((p) => p.label ?? p.id).join(', ')}]`,
    ];
    if (roster.reviewers.length > 0) {
        parts.push(`reviewers=[${roster.reviewers.map((p) => p.label ?? p.id).join(', ')}]`);
    }
    parts.push(`executor=${roster.executor.label ?? roster.executor.id}`);
    if (roster.verifier)
        parts.push(`verifier=${roster.verifier.label ?? roster.verifier.id}`);
    return parts.join(' ');
}
//# sourceMappingURL=roster.js.map