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
    // A stack, not a counter over one bracket kind: a truncated `{"a": [1, 2}`
    // must report "unterminated" rather than "balanced but does not parse".
    const stack = [];
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
        else if (ch === '{' || ch === '[')
            stack.push(ch);
        else if (ch === '}' || ch === ']') {
            const expected = stack[stack.length - 1];
            if ((ch === '}' && expected !== '{') || (ch === ']' && expected !== '[')) {
                throw new StructuredOutputError(`JSON is malformed: got "${ch}" while "${expected}" was open.`, text);
            }
            stack.pop();
            if (stack.length === 0) {
                const candidate = text.slice(start, i + 1);
                try {
                    return JSON.parse(candidate);
                }
                catch (cause) {
                    // The span is balanced but not valid JSON: try the mechanical
                    // repairs before giving up, because the alternative is losing
                    // the whole contribution.
                    const repaired = repairJsonText(candidate);
                    if (repaired !== candidate) {
                        try {
                            return JSON.parse(repaired);
                        }
                        catch {
                            // Fall through: report the original failure, which points at
                            // the first real defect rather than at whatever the repair
                            // shifted.
                        }
                    }
                    const position = /position (\d+)/.exec(cause.message)?.[1];
                    throw new StructuredOutputError(`Found a balanced JSON span but it does not parse: ${cause.message}` +
                        contextAround(candidate, position === undefined ? undefined : Number(position)), text);
                }
            }
        }
    }
    // Truncated at the token ceiling: recover the complete prefix rather than
    // dropping the whole contribution.
    const truncated = text.slice(start);
    const closed = closeTruncatedJson(truncated);
    if (closed !== truncated) {
        try {
            return JSON.parse(closeTruncatedJson(repairJsonText(truncated)));
        }
        catch {
            try {
                return JSON.parse(closed);
            }
            catch {
                // Fall through to the honest failure.
            }
        }
    }
    throw new StructuredOutputError('JSON value in the response is unterminated.', text);
}

/**
 * Best-effort repair of a balanced-but-invalid JSON span.
 *
 * Only ever called after \`JSON.parse\` has already rejected the text, so a
 * successful repair cannot mask a valid input. The three defects below cover
 * what long Chinese model output actually produces:
 *
 *   1. **Unescaped ASCII quotes inside a string.** \`"summary": "使用 "缓存" 策略"\`
 *      makes the parser end the string early and then report
 *      \`Expected ',' or '}' after property value\` -- the error this exists to fix.
 *   2. **Missing comma between properties** (\`{"a": 1 "b": 2}\`).
 *   3. **Raw control characters in a string** -- a literal newline or tab where
 *      JSON requires \`\\n\` / \`\\t\`.
 * Plus the two cheap ones: trailing commas and \`True/False/None\`.
 *
 * @param input - the candidate JSON text.
 * @returns the repaired text (which may equal the input).
 */
export function repairJsonText(input) {
    const out = [];
    let i = 0;
    let inString = false;
    let escaped = false;
    // Last non-space character emitted outside a string: decides whether a comma
    // is missing before the next token.
    let lastSignificant = '';
    const emit = (ch) => {
        out.push(ch);
        if (!/\s/.test(ch))
            lastSignificant = ch;
    };
    while (i < input.length) {
        const ch = input[i];
        if (inString) {
            if (escaped) {
                out.push(ch);
                escaped = false;
                i++;
                continue;
            }
            if (ch === '\\') {
                // A backslash must begin a legal JSON escape. Model output routinely
                // carries raw Windows paths ("D:\\pachong" arrives as D:\pachong) where
                // the escape is invalid, and JSON.parse rejects the whole document.
                const nextCh = input[i + 1];
                const simple = nextCh !== undefined && '"\\/bfnrt'.includes(nextCh);
                const unicode = nextCh === 'u' && /^[0-9a-fA-F]{4}$/.test(input.slice(i + 2, i + 6));
                if (!simple && !unicode) {
                    out.push('\\\\');
                    i++;
                    continue;
                }
                out.push(ch);
                escaped = true;
                i++;
                continue;
            }
            if (ch === '"') {
                // A real closing quote is followed by , } ] : or end of text.
                // Anything else means the model quoted a term inside the value.
                let j = i + 1;
                while (j < input.length && /\s/.test(input[j]))
                    j++;
                const next = input[j];
                // `next === '"'` means a new string starts right here, so this one
                // must be closing: an inner quote is followed by content, not by a quote.
                if (next === undefined || next === ',' || next === '}' || next === ']' || next === ':' || next === '"') {
                    out.push('"');
                    inString = false;
                    lastSignificant = '"';
                    i++;
                    continue;
                }
                out.push('\\"');
                i++;
                continue;
            }
            if (ch === '\n') {
                out.push('\\n');
                i++;
                continue;
            }
            if (ch === '\r') {
                out.push('\\r');
                i++;
                continue;
            }
            if (ch === '\t') {
                out.push('\\t');
                i++;
                continue;
            }
            out.push(ch);
            i++;
            continue;
        }
        // ---- outside a string
        if (ch === '/' && input[i + 1] === '/') {
            while (i < input.length && input[i] !== '\n')
                i++;
            continue;
        }
        if (ch === '/' && input[i + 1] === '*') {
            const end = input.indexOf('*/', i + 2);
            i = end === -1 ? input.length : end + 2;
            continue;
        }
        if (ch === ',') {
            let j = i + 1;
            while (j < input.length && /\s/.test(input[j]))
                j++;
            if (input[j] === '}' || input[j] === ']') {
                i++;
                continue;
            }
            emit(',');
            i++;
            continue;
        }
        if (ch === '"') {
            if (lastSignificant !== '' && lastSignificant !== ',' && lastSignificant !== '{' && lastSignificant !== '[' && lastSignificant !== ':') {
                emit(',');
            }
            out.push('"');
            inString = true;
            escaped = false;
            i++;
            continue;
        }
        if (input.startsWith('True', i)) {
            out.push('true');
            lastSignificant = 'e';
            i += 4;
            continue;
        }
        if (input.startsWith('False', i)) {
            out.push('false');
            lastSignificant = 'e';
            i += 5;
            continue;
        }
        if (input.startsWith('None', i)) {
            out.push('null');
            lastSignificant = 'l';
            i += 4;
            continue;
        }
        emit(ch);
        i++;
    }
    return out.join('');
}

/** A short window of \`text\` around \`position\`, for a diagnosable error message. */
/** A short window of `text` around `position`, for a diagnosable error message. */
export function contextAround(text, position, radius = 70) {
    if (position === undefined)
        return text.trim() === '' ? '' : '\n  开头：' + text.slice(0, radius).replace(/\s+/g, ' ') + '...';
    const from = Math.max(0, position - radius);
    const to = Math.min(text.length, position + radius);
    return '\n  ...' + text.slice(from, to).replace(/\s+/g, ' ') + '...';
}


/**
 * Close a JSON value that the model stopped emitting early.
 *
 * Long structured replies are frequently cut at the provider's token ceiling,
 * which used to be fatal ("JSON value ... is unterminated"). Closing the open
 * string and the open brackets recovers the complete prefix, which for reviews
 * and proposals is far more useful than nothing. Only ever applied after both
 * the strict parse and the repair pass have failed.
 *
 * @param text - the truncated candidate, starting at its opening bracket.
 * @returns the text with every open string/bracket closed.
 */
export function closeTruncatedJson(text) {
    const stack = [];
    let inString = false;
    let escaped = false;
    for (let i = 0; i < text.length; i++) {
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
        else if (ch === '{' || ch === '[')
            stack.push(ch);
        else if (ch === '}' || ch === ']') {
            if (stack.length > 0)
                stack.pop();
        }
    }
    if (!inString && stack.length === 0)
        return text;
    let repaired = text.replace(/\s+$/, '');
    if (inString) {
        if (escaped)
            repaired += '\\';
        repaired += '"';
    }
    // Cut almost always lands inside a member. Drop a dangling key (with or
    // without its colon) so the closers below produce a valid document.
    for (let guard = 0; guard < 6; guard++) {
        const trimmed = repaired.replace(/\s+$/, '');
        if (trimmed.endsWith(':')) {
            const keyStart = stringStartBefore(trimmed, trimmed.length - 1);
            if (keyStart === -1)
                break;
            repaired = trimTrailingComma(trimmed.slice(0, keyStart));
            continue;
        }
        if (!trimmed.endsWith('"'))
            break;
        const keyStart = stringStartBefore(trimmed, trimmed.length - 1);
        if (keyStart === -1)
            break;
        const before = trimmed.slice(0, keyStart).replace(/\s+$/, '');
        if (before.endsWith(',') || before.endsWith('{')) {
            repaired = trimTrailingComma(trimmed.slice(0, keyStart));
            continue;
        }
        break;
    }
    repaired = trimTrailingComma(repaired);
    for (let i = stack.length - 1; i >= 0; i--)
        repaired += stack[i] === '{' ? '}' : ']';
    return repaired;
}

/** Index of the quote opening the string that ends at \`end\` (exclusive), or -1. */
function stringStartBefore(text, end) {
    for (let i = end - 1; i >= 0; i--) {
        if (text[i] !== '"')
            continue;
        let backslashes = 0;
        for (let k = i - 1; k >= 0 && text[k] === '\\'; k--)
            backslashes++;
        if (backslashes % 2 === 0)
            return i;
    }
    return -1;
}

/** Drop a trailing comma and surrounding whitespace. */
function trimTrailingComma(text) {
    return text.replace(/,\s*$/, '').replace(/\s+$/, '');
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