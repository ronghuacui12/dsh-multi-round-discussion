/** Built-in presets. */
export const PRESETS = {
    /** One proposer, no review, no verification. Cheapest useful shape. */
    fast: {
        name: 'fast',
        proposers: 1,
        review: false,
        verify: false,
        maxRounds: 1,
    },
    /** Three proposers, no review. The default: still gets real disagreement. */
    balanced: {
        name: 'balanced',
        proposers: 3,
        review: false,
        verify: false,
        maxRounds: 2,
    },
    /** Five proposers, cross-review and verification — the full pipeline. */
    deep: {
        name: 'deep',
        proposers: 5,
        review: true,
        verify: true,
        maxRounds: 3,
    },
};
/** Resolve a preset name to its definition; `custom` returns the balanced shape. */
export function resolvePreset(name) {
    if (name === 'custom')
        return { ...PRESETS.balanced, name: 'custom' };
    return PRESETS[name];
}
/** Every preset name, for the settings UI. */
export const PRESET_NAMES = ['fast', 'balanced', 'deep', 'custom'];
/** Chinese labels for the configuration panel. */
export const PRESET_LABELS = {
    fast: '快速模式',
    balanced: '平衡模式',
    deep: '深度模式',
    custom: '自定义',
};
/** One-line description of what each preset buys you. */
export const PRESET_DESCRIPTIONS = {
    fast: '1 提案 + 1 决策 + 1 执行，最省成本',
    balanced: '3 个模型独立提案 + 主导决策 + 单执行模型',
    deep: '5 提案 + 交叉评审 + 决策 + 执行 + 验证回环',
    custom: '手动指定主导 / 讨论 / 执行 / 验证模型',
};
//# sourceMappingURL=preset.js.map