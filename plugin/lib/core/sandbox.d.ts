/**
 * Tool sandbox (doc §2.5, §11.2).
 *
 * The executor is the only component that can change the world, so it gets the
 * only guard rail that is structural rather than advisory:
 *
 *   - tools are matched against an explicit allow-list by exact name;
 *   - anything not on the list is denied, and the denial is surfaced as a tool
 *     result the model can read (so it adapts instead of stalling);
 *   - the tool schemas offered to the model are pre-filtered to the same list,
 *     so a denied tool is never even advertised.
 *
 * Filtering the advertised schema is the part that matters. A model that never
 * sees `write` cannot waste a turn being told no.
 */
import type { ToolSchema } from '@deepseek-ai/dsh-llm';
/**
 * Tools considered safe to run unattended: they observe, they do not mutate.
 * Used only to decide which calls need confirmation — being on this list is
 * not sufficient to be allowed, `allowedTools` still has to name it.
 */
export declare const READ_ONLY_TOOL_PATTERNS: readonly string[];
/** Sandbox configuration. */
export interface SandboxConfig {
    /**
     * Tools the executor may use, by exact name. Empty means the executor runs
     * with no tools at all — it can still reason, but cannot act.
     */
    allowedTools: string[];
    /**
     * Whether a call to a tool that is not recognisably read-only must be
     * confirmed by a human before it runs.
     */
    requireConfirmationForWrites: boolean;
    /** Maximum model turns the executor may take. */
    maxSteps: number;
}
/** Defaults: read-only tools only, no exceptions, twelve turns. */
export declare const DEFAULT_SANDBOX: SandboxConfig;
/** The sandbox's ruling on one proposed call. */
export type ToolDecision = {
    kind: 'allow';
} | {
    kind: 'deny';
    reason: string;
} | {
    kind: 'confirm';
    reason: string;
};
/** Heuristic: is this tool name one of the well-known observers? */
export declare function isReadOnlyTool(toolName: string): boolean;
export declare class ToolSandbox {
    private readonly config;
    private readonly allowed;
    constructor(config?: Partial<SandboxConfig>);
    /** Configured step ceiling. */
    get maxSteps(): number;
    /** Tools currently permitted, as a sorted list (for reporting). */
    get permitted(): readonly string[];
    /**
     * Pre-filter the tool schemas handed to the executor model.
     *
     * A tool that would be denied is never advertised. Confirmation-required
     * tools *are* advertised: the model needs to be able to propose them, and
     * the approval step happens at dispatch time.
     */
    visibleTools(all: readonly ToolSchema[]): ToolSchema[];
    /** Rule on one concrete call. */
    decide(toolName: string): ToolDecision;
}
//# sourceMappingURL=sandbox.d.ts.map