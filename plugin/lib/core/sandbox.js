/**
 * Tools considered safe to run unattended: they observe, they do not mutate.
 * Used only to decide which calls need confirmation — being on this list is
 * not sufficient to be allowed, `allowedTools` still has to name it.
 */
export const READ_ONLY_TOOL_PATTERNS = [
    'read',
    'read_file',
    'view',
    'cat',
    'ls',
    'list',
    'list_dir',
    'glob',
    'glob_file_search',
    'grep',
    'search',
    'search_code',
    'rg',
    'find',
    'file_search',
    'web_search',
    'web_fetch',
    'fetch',
    'question',
    'todo_read',
    'get_todo',
];
/**
 * Defaults: read-only tools only, no exceptions, twelve turns.
 *
 * `requireConfirmationForWrites` is off because this plugin has no interactive
 * approval channel for individual tool calls: leaving it on does not ask the
 * user, it silently skips every mutating tool and reports the step as skipped.
 * The gate that does reach the user is the plan approval in the orchestrator.
 */
export const DEFAULT_SANDBOX = {
    allowedTools: [],
    requireConfirmationForWrites: false,
    maxSteps: 12,
};
/**
 * Allow-list entry that permits every tool the host exposes, including tools
 * registered later (a newly mounted MCP server, a new built-in). Preferred over
 * listing every name, which silently excludes whatever appears next.
 */
export const ALL_TOOLS = '*';
/** Heuristic: is this tool name one of the well-known observers? */
export function isReadOnlyTool(toolName) {
    const normalized = toolName.toLowerCase();
    return READ_ONLY_TOOL_PATTERNS.some((pattern) => normalized === pattern || normalized.endsWith(`_${pattern}`) || normalized.startsWith(`${pattern}_`));
}
export class ToolSandbox {
    config;
    allowed;
    /** True when the allow-list carries {@link ALL_TOOLS}. */
    allowAll;
    constructor(config = {}) {
        this.config = { ...DEFAULT_SANDBOX, ...config };
        this.allowed = new Set(this.config.allowedTools);
        this.allowAll = this.allowed.has(ALL_TOOLS);
    }
    /**
     * Configured step ceiling.
     *
     * 0 / undefined / negative means *unlimited*: the executor keeps calling
     * tools until the plan is done or the run is aborted. The run's budget guard
     * and abort signal still bound it.
     */
    get maxSteps() {
        const steps = this.config.maxSteps;
        if (typeof steps !== 'number' || !Number.isFinite(steps) || steps <= 0)
            return Number.POSITIVE_INFINITY;
        return steps;
    }
    /** Tools currently permitted, as a sorted list (for reporting). */
    get permitted() {
        return this.allowAll ? [ALL_TOOLS] : [...this.allowed].sort();
    }
    /** Whether one tool name may be dispatched. */
    allows(toolName) {
        return this.allowAll || this.allowed.has(toolName);
    }
    /**
     * Pre-filter the tool schemas handed to the executor model.
     *
     * A tool that would be denied is never advertised. Confirmation-required
     * tools *are* advertised: the model needs to be able to propose them, and
     * the approval step happens at dispatch time.
     */
    visibleTools(all) {
        return all.filter((tool) => this.allows(tool.name));
    }
    /** Rule on one concrete call. */
    decide(toolName) {
        if (!this.allows(toolName)) {
            return {
                kind: 'deny',
                reason: `Tool "${toolName}" is not on this run's allow-list. ` +
                    `Permitted tools: ${this.permitted.length > 0 ? this.permitted.join(', ') : '(none)'}. ` +
                    `Report this as a blocked step rather than retrying.`,
            };
        }
        if (this.config.requireConfirmationForWrites && !isReadOnlyTool(toolName)) {
            return {
                kind: 'confirm',
                reason: `Tool "${toolName}" can change state and requires confirmation before it runs.`,
            };
        }
        return { kind: 'allow' };
    }
}
//# sourceMappingURL=sandbox.js.map