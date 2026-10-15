/**
 * Starting-point prices, in USD per 1M tokens. These are placeholders to make
 * the cost panel meaningful on first run — replace them with your real rates.
 */
export const EXAMPLE_PRICES = {
    'deepseek-v4-flash': { inputPerMillionUsd: 0.28, outputPerMillionUsd: 0.42 },
    'deepseek-v4-pro': { inputPerMillionUsd: 0.6, outputPerMillionUsd: 1.8 },
    'gpt-4o-mini': { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.6 },
    'gpt-4o': { inputPerMillionUsd: 2.5, outputPerMillionUsd: 10 },
    'claude-sonnet': { inputPerMillionUsd: 3, outputPerMillionUsd: 15 },
    'claude-haiku': { inputPerMillionUsd: 0.8, outputPerMillionUsd: 4 },
};
/** Resolve the price row for a model id, preferring the longest matching prefix. */
export function resolvePrice(model, overrides) {
    const tables = [];
    if (overrides)
        tables.push({ table: overrides, source: 'override' });
    tables.push({ table: EXAMPLE_PRICES, source: 'builtin' });
    for (const { table, source } of tables) {
        // Exact hit first, then a `key` prefix of the model id. Longest key wins so
        // `gpt-4o-mini` is never shadowed by `gpt-4o`.
        const exact = table[model];
        if (exact)
            return { price: exact, source };
        let best;
        for (const [key, price] of Object.entries(table)) {
            if (!model.startsWith(key))
                continue;
            if (!best || key.length > best.key.length)
                best = { key, price };
        }
        if (best)
            return { price: best.price, source };
    }
    return undefined;
}
/**
 * Turn a provider `usage` chunk into an estimated cost.
 *
 * Token counts are disjoint (see `TokenUsage`): billed input is
 * `inputTokens + cacheReadTokens + cacheWriteTokens`.
 */
export function estimateCostUsd(usage, model, overrides) {
    const resolved = resolvePrice(model, overrides ?? undefined);
    if (!resolved)
        return { costUsd: 0, priced: false, placeholder: false };
    const { price, source } = resolved;
    const cacheReadRate = price.cacheReadPerMillionUsd ?? price.inputPerMillionUsd * 0.1;
    const dollars = (usage.inputTokens / 1e6) * price.inputPerMillionUsd +
        ((usage.cacheReadTokens ?? 0) / 1e6) * cacheReadRate +
        ((usage.cacheWriteTokens ?? 0) / 1e6) * price.inputPerMillionUsd +
        (usage.outputTokens / 1e6) * price.outputPerMillionUsd;
    return {
        costUsd: dollars,
        priced: true,
        placeholder: source === 'builtin',
    };
}
/** Format a USD amount for display, keeping tiny amounts legible. */
export function formatUsd(value) {
    if (value === 0)
        return '$0';
    if (value < 0.01)
        return `$${value.toFixed(4)}`;
    return `$${value.toFixed(2)}`;
}
//# sourceMappingURL=cost.js.map