/** Scope name prefixed onto every log line from this plugin. */
export const LOG_SCOPE = 'multi-model-discussion';
/** Create the plugin-scoped logger. */
export function createLogger(ctx) {
    return ctx.logger(LOG_SCOPE);
}
/**
 * Shorten a run id for log lines. Run ids are UUID-ish; the tail is what
 * distinguishes them in a terminal.
 */
export function shortId(id) {
    return id.length <= 8 ? id : id.slice(-8);
}
//# sourceMappingURL=logger.js.map