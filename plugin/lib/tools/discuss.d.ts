import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { RunStore } from '../services/run-store.js';
import type { Orchestrator, OrchestratorConfig } from '../plugins/orchestrator.js';
/** Tool name. Namespaced to avoid colliding with other discussion plugins. */
export declare const DISCUSS_TOOL_NAME = "multi_model_discuss";
export interface DiscussToolOptions {
    store: RunStore;
    orchestrator: Orchestrator;
    config: () => OrchestratorConfig;
}
/**
 * Build the tool definition.
 *
 * The description matters more than usual here: it is the only thing telling
 * the calling model when escalation is worth its cost, so it states the
 * trade-off explicitly instead of just describing the mechanism.
 */
export declare function createDiscussTool(options: DiscussToolOptions): ToolDefinition;
//# sourceMappingURL=discuss.d.ts.map