import type { Context } from '@deepseek-ai/cordis';
import type { Logger } from '@deepseek-ai/cordis';
import type { ModelRegistry } from '../services/model-registry.js';
import type { RunStore } from '../services/run-store.js';
import type { Orchestrator, OrchestratorConfig } from '../plugins/orchestrator.js';
/** Route prefix. Everything below is owned by this plugin. */
export declare const API_PREFIX = "/dsh-mmd";
export interface ApiRouteOptions {
    ctx: Context;
    store: RunStore;
    registry: ModelRegistry;
    orchestrator: Orchestrator;
    config: () => OrchestratorConfig;
    /** Version string reported by the handshake route. */
    version: string;
    /** Optional shared token; when set, requests must carry it. */
    token?: string | undefined;
    logger?: Logger;
}
/**
 * Register every route. Returns a disposer that removes them all.
 *
 * Called only when an HTTP server service is actually mounted; on a headless
 * harness there is nothing to attach to and the plugin still works.
 */
export declare function registerApiRoutes(options: ApiRouteOptions): () => void;
//# sourceMappingURL=api-routes.d.ts.map