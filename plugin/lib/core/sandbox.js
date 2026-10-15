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
/** Defaults: read-only tools only, no exceptions, twelve turns. */
export const DEFAULT_SANDBOX = {
    allowedTools: [],
    requireConfirmationForWrites: true,
    maxSteps: 12,
};
/** Heuristic: is this tool name one of the well-known observers? */
export function isReadOnlyTool(toolName) {
    const normalized = toolName.toLowerCase();
    return READ_ONLY_TOOL_PATTERNS.some((pattern) => normalized === pattern || normalized.endsWith(`_${pattern}`) || normalized.startsWith(`${pattern}_`));
}
export class ToolSandbox {
    config;
    allowed;
    constructor(config = {}) {
        this.config = { ...DEFAULT_SANDBOX, ...config };
        this.allowed = new Set(this.config.allowedTools);
    }
    /** Configured step ceiling. */
    get maxSteps() {
        return this.config.maxSteps;
    }
    /** Tools currently permitted, as a sorted list (for reporting). */
    get permitted() {
        return [...this.allowed].sort();
    }
    /**
     * Pre-filter the tool schemas handed to the executor model.
     *
     * A tool that would be denied is never advertised. Confirmation-required
     * tools *are* advertised: the model needs to be able to propose them, and
     * the approval step happens at dispatch time.
     */
    visibleTools(all) {
        return all.filter((tool) => this.allowed.has(tool.name));
    }
    /** Rule on one concrete call. */
    decide(toolName) {
        if (!this.allowed.has(toolName)) {
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