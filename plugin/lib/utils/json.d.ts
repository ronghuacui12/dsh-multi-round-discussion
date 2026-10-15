/**
 * Structured-output parsing.
 *
 * Models are asked for JSON and mostly oblige, but they wrap it in prose or a
 * fenced block often enough that a bare `JSON.parse` is not viable. This
 * extracts the first complete JSON value from a text response and validates it
 * against a caller-supplied shape checker. A parse failure is always reported
 * as a typed error so the caller can decide whether to retry, fall back, or
 * hand the problem back to the decision maker.
 */
/** Raised when a model response cannot be read as the expected structure. */
export declare class StructuredOutputError extends Error {
    readonly raw: string;
    constructor(message: string, raw: string);
}
/**
 * Find the first complete JSON object or array in `text`.
 *
 * Scans for the first `{` or `[` and walks with a string/escape-aware depth
 * counter, so braces inside string literals do not end the value early.
 */
export declare function extractJsonValue(text: string): unknown;
/** A shape checker: narrows `unknown` to `T` or throws {@link StructuredOutputError}. */
export type ShapeChecker<T> = (value: unknown) => T;
/** Parse `text` as JSON and narrow it with `check`. */
export declare function parseStructured<T>(text: string, check: ShapeChecker<T>): T;
/** Fail with `message` unless `value` is a non-empty string. */
export declare function requireString(value: unknown, field: string): string;
/** Read a string array, tolerating a single string and dropping non-strings. */
export declare function optionalStringArray(value: unknown): string[];
/** Clamp `value` into `[0, 1]`, mapping anything unreadable to `fallback`. */
export declare function clampConfidence(value: unknown, fallback?: number): number;
/**
 * A last-resort extractor for when JSON parsing fails outright.
 *
 * Returns the raw text with the most obvious fenced-block noise removed. The
 * caller decides whether degraded input is acceptable — for proposal prose it
 * is; for a decision record it is not.
 */
export declare function salvageText(text: string): string;
//# sourceMappingURL=json.d.ts.map