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
export class StructuredOutputError extends Error {
    raw;
    constructor(message, raw) {
        super(message);
        this.raw = raw;
        this.name = 'StructuredOutputError';
    }
}
/**
 * Find the first complete JSON object or array in `text`.
 *
 * Scans for the first `{` or `[` and walks with a string/escape-aware depth
 * counter, so braces inside string literals do not end the value early.
 */
export function extractJsonValue(text) {
    const start = findFirstJsonStart(text);
    if (start === -1) {
        throw new StructuredOutputError('No JSON object or array found in the response.', text);
    }
    const open = text[start];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (escaped)
                escaped = false;
            else if (ch === '\\')
                escaped = true;
            else if (ch === '"')
                inString = false;
            continue;
        }
        if (ch === '"')
            inString = true;
        else if (ch === open)
            depth++;
        else if (ch === close) {
            depth--;
            if (depth === 0) {
                const candidate = text.slice(start, i + 1);
                try {
                    return JSON.parse(candidate);
                }
                catch (cause) {
                    throw new StructuredOutputError(`Found a balanced JSON span but it does not parse: ${cause.message}`, text);
                }
            }
        }
    }
    throw new StructuredOutputError('JSON value in the response is unterminated.', text);
}
/** Index of the first `{` or `[` outside of a fenced code block's language tag, or -1. */
function findFirstJsonStart(text) {
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '{' || ch === '[')
            return i;
    }
    return -1;
}
/** Parse `text` as JSON and narrow it with `check`. */
export function parseStructured(text, check) {
    const value = extractJsonValue(text);
    try {
        return check(value);
    }
    catch (cause) {
        if (cause instanceof StructuredOutputError)
            throw cause;
        throw new StructuredOutputError(`JSON parsed but did not match the expected shape: ${cause.message}`, text);
    }
}
/** Fail with `message` unless `value` is a non-empty string. */
export function requireString(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new StructuredOutputError(`Field "${field}" must be a non-empty string.`, JSON.stringify(value));
    }
    return value;
}
/** Read a string array, tolerating a single string and dropping non-strings. */
export function optionalStringArray(value) {
    if (value == null)
        return [];
    if (typeof value === 'string')
        return value.trim() === '' ? [] : [value];
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === 'string' && item.trim() !== '');
}
/** Clamp `value` into `[0, 1]`, mapping anything unreadable to `fallback`. */
export function clampConfidence(value, fallback = 0.5) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n))
        return fallback;
    // Models sometimes answer on a 0..100 scale; normalise before clamping.
    const scaled = n > 1 ? n / 100 : n;
    return Math.min(1, Math.max(0, scaled));
}
/**
 * A last-resort extractor for when JSON parsing fails outright.
 *
 * Returns the raw text with the most obvious fenced-block noise removed. The
 * caller decides whether degraded input is acceptable — for proposal prose it
 * is; for a decision record it is not.
 */
export function salvageText(text) {
    return text
        .replace(/^\s*```[a-zA-Z]*\s*/m, '')
        .replace(/\s*```\s*$/m, '')
        .trim();
}
//# sourceMappingURL=json.js.map