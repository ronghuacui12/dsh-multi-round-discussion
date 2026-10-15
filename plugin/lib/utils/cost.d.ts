/**
 * Cost estimation.
 *
 * Honesty note: token counts come from the provider's own `usage` chunk and
 * are exact. Prices are NOT — they are a lookup table you are expected to keep
 * in step with your actual bill. Rows are matched by longest model-id prefix,
 * so `deepseek-v4-flash` matches `deepseek-v4-flash` and any suffixed variant.
 *
 * {@link EXAMPLE_PRICES} ships as a starting point only. Override it through
 * config (`pricing.overrides`) with the numbers on your invoice; a model with
 * no matching row reports `costUsd: 0` and is flagged `priced: false` rather
 * than being silently guessed at.
 */
import type { ModelPrice } from '../types/model-profile.js';
import type { TokenUsage } from '@deepseek-ai/dsh-llm';
/**
 * Starting-point prices, in USD per 1M tokens. These are placeholders to make
 * the cost panel meaningful on first run — replace them with your real rates.
 */
export declare const EXAMPLE_PRICES: Record<string, ModelPrice>;
/** Resolve the price row for a model id, preferring the longest matching prefix. */
export declare function resolvePrice(model: string, overrides?: Record<string, ModelPrice>): {
    price: ModelPrice;
    source: 'override' | 'builtin';
} | undefined;
/** Result of a cost computation, including whether a price was known at all. */
export interface CostEstimate {
    costUsd: number;
    /** False when no price row matched, so `costUsd` is a floor of 0, not an estimate. */
    priced: boolean;
    /**
     * True when the number came from {@link EXAMPLE_PRICES} rather than your own
     * override table. Surfaced in the UI so nobody mistakes it for billing data.
     */
    placeholder: boolean;
}
/**
 * Turn a provider `usage` chunk into an estimated cost.
 *
 * Token counts are disjoint (see `TokenUsage`): billed input is
 * `inputTokens + cacheReadTokens + cacheWriteTokens`.
 */
export declare function estimateCostUsd(usage: TokenUsage, model: string, overrides?: Record<string, ModelPrice>): CostEstimate;
/** Format a USD amount for display, keeping tiny amounts legible. */
export declare function formatUsd(value: number): string;
//# sourceMappingURL=cost.d.ts.map