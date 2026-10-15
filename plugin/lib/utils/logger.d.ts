/**
 * Logger facade.
 *
 * Wraps the Cordis logger so every line this plugin emits carries the same
 * scope name, and so call sites do not need to remember it. Cordis loggers use
 * printf-style formatting (`log.info('run %s -> %s', id, phase)`).
 */
import type { Context, Logger } from '@deepseek-ai/cordis';
/** Scope name prefixed onto every log line from this plugin. */
export declare const LOG_SCOPE = "multi-model-discussion";
/** Create the plugin-scoped logger. */
export declare function createLogger(ctx: Context): Logger;
/**
 * Shorten a run id for log lines. Run ids are UUID-ish; the tail is what
 * distinguishes them in a terminal.
 */
export declare function shortId(id: string): string;
//# sourceMappingURL=logger.d.ts.map