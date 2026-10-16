import { handleSettingsRoutes } from './settings-routes.js';
/** Route prefix. Everything below is owned by this plugin. */
export const API_PREFIX = '/dsh-mmd';
/** Largest request body accepted, in bytes. Control payloads are tiny. */
const MAX_BODY_BYTES = 256 * 1024;
/** Write a JSON response. */
function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'content-length': Buffer.byteLength(payload),
    });
    res.end(payload);
}
/** Read and parse a JSON request body. */
async function readJsonBody(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_BODY_BYTES)
            throw new Error('Request body too large.');
        chunks.push(buffer);
    }
    if (chunks.length === 0)
        return {};
    const text = Buffer.concat(chunks).toString('utf8');
    if (text.trim() === '')
        return {};
    return JSON.parse(text);
}
/**
 * Whether a mutating request came from the same origin as this server.
 *
 * A missing `Origin` is allowed: non-browser clients (curl, the test suite)
 * omit it, and CSRF is a browser-only threat. A *present* `Origin` that
 * disagrees with `Host` is rejected.
 */
function isSameOrigin(req) {
    const origin = req.headers.origin;
    if (typeof origin !== 'string' || origin === '')
        return true;
    const host = req.headers.host;
    if (typeof host !== 'string' || host === '')
        return false;
    try {
        return new URL(origin).host === host;
    }
    catch {
        return false;
    }
}
/** Check the optional shared token. */
function hasValidToken(req, token) {
    if (!token)
        return true;
    const header = req.headers.authorization;
    if (typeof header !== 'string')
        return false;
    return header === `Bearer ${token}`;
}
/**
 * Register every route. Returns a disposer that removes them all.
 *
 * Called only when an HTTP server service is actually mounted; on a headless
 * harness there is nothing to attach to and the plugin still works.
 */
export function registerApiRoutes(options) {
    const { ctx, store, registry, orchestrator } = options;
    // The host webserver service key is `webServer` in the installed runtime
    // (@deepseek-ai/dsh-host-webserver 0.1.3-alpha.2 registers super(ctx, "webServer")).
    // Older/other builds used `httpServer`, so prefer the current key and fall back.
    const httpServer = ctx.get('webServer') ?? ctx.get('httpServer');
    if (!httpServer) {
        options.logger?.info('no webServer/httpServer service mounted; the discussion view will not be reachable over HTTP');
        return () => { };
    }
    const dispose = httpServer.register({
        kind: 'prefix',
        path: API_PREFIX,
        handler: async (req, res) => {
            try {
                await dispatch(req, res, options);
            }
            catch (cause) {
                const message = cause instanceof Error ? cause.message : String(cause);
                options.logger?.warn('api request failed: %s', message);
                if (!res.headersSent)
                    sendJson(res, 500, { error: message });
                else
                    res.end();
            }
        },
    });
    return dispose;
}
/** Route one request. */
async function dispatch(req, res, options) {
    const { store, registry, orchestrator, config } = options;
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname.slice(API_PREFIX.length) || '/';
    const method = req.method ?? 'GET';
    // A read-only surface: everything below either observes or applies a control.
    if (method !== 'GET' && method !== 'POST' && method !== 'DELETE') {
        sendJson(res, 405, { error: `Method ${method} not allowed.` });
        return;
    }
    if (method === 'POST') {
        if (!isSameOrigin(req)) {
            sendJson(res, 403, { error: 'Cross-origin control requests are refused.' });
            return;
        }
        if (!hasValidToken(req, options.token)) {
            sendJson(res, 401, { error: 'Missing or invalid bearer token.' });
            return;
        }
    }
    // The settings layer owns the model catalog, the roster editor and avatars.
    // It is consulted first because its paths are disjoint from the run routes.
    if (options.settings) {
        const handled = await handleSettingsRoutes(req, res, path, method, {
            ctx: options.ctx,
            settings: options.settings,
            logger: options.logger,
        });
        if (handled)
            return;
    }
    // ------------------------------------------------------------- observation
    if (method === 'GET' && (path === '/' || path === '/handshake')) {
        sendJson(res, 200, {
            ok: true,
            plugin: 'dsh-multi-model-discussion',
            version: options.version,
            preset: config().preset,
            enabled: config().enabled,
        });
        return;
    }
    if (method === 'GET' && path === '/profiles') {
        sendJson(res, 200, {
            profiles: registry.listProfiles(),
            providers: registry.listProviders(),
            preset: config().preset,
        });
        return;
    }
    if (method === 'GET' && path === '/providers') {
        sendJson(res, 200, { providers: registry.listProviders() });
        return;
    }
    if (method === 'GET' && path === '/runs') {
        // A restored run is a read-only record; the client needs to be able to
        // tell it apart from a live one, and `restored` lives on the context
        // rather than in the transported state.
        sendJson(res, 200, {
            runs: store.all().map((context) => ({
                ...context.state,
                restored: context.restored === true,
            })),
        });
        return;
    }
    if (method === 'GET' && path === '/events') {
        streamEvents(req, res, store);
        return;
    }
    const runMatch = /^\/runs\/([^/]+)$/.exec(path);
    if (method === 'GET' && runMatch) {
        const context = store.get(decodeURIComponent(runMatch[1]));
        if (!context) {
            sendJson(res, 404, { error: 'No such run.' });
            return;
        }
        sendJson(res, 200, { run: context.state });
        return;
    }
    // ------------------------------------------------------------------ control
    if (method === 'POST' && path === '/runs') {
        if (!config().enabled) {
            sendJson(res, 409, { error: 'The plugin is disabled by configuration.' });
            return;
        }
        const body = (await readJsonBody(req));
        if (typeof body.request !== 'string' || body.request.trim() === '') {
            sendJson(res, 400, { error: 'Field "request" must be a non-empty string.' });
            return;
        }
        // A follow-up run names the run it continues. The parent may be live or
        // restored from history; either way only its public artefacts are read.
        let parent;
        if (body.parentRunId !== undefined) {
            if (typeof body.parentRunId !== 'string' || body.parentRunId.trim() === '') {
                sendJson(res, 400, { error: 'Field "parentRunId" must be a non-empty string.' });
                return;
            }
            parent = store.get(body.parentRunId.trim());
            if (!parent) {
                sendJson(res, 404, { error: '找不到要续接的研讨记录。' });
                return;
            }
            if (!TERMINAL_PHASES.has(parent.state.phase)) {
                sendJson(res, 409, { error: '上一轮研讨还没结束，先等它结束或叫停，再继续追问。' });
                return;
            }
        }
        try {
            const state = orchestrator.start({
                request: body.request,
                ...(typeof body.preset === 'string' ? { preset: body.preset } : {}),
                ...(body.overrides && typeof body.overrides === 'object'
                    ? { overrides: body.overrides }
                    : {}),
                ...(parent
                    ? { parentRunId: parent.state.runId, context: buildContinuationContext(parent.state) }
                    : {}),
            });
            sendJson(res, 201, { run: state });
        }
        catch (cause) {
            // A roster error is a configuration problem the caller can act on, so it
            // is a 400 rather than a 500.
            sendJson(res, 400, { error: cause instanceof Error ? cause.message : String(cause) });
        }
        return;
    }
    const controlMatch = /^\/runs\/([^/]+)\/control$/.exec(path);
    if (method === 'POST' && controlMatch) {
        const runId = decodeURIComponent(controlMatch[1]);
        const body = (await readJsonBody(req));
        const control = parseControl(body.control);
        if (!control) {
            sendJson(res, 400, { error: 'Field "control" is not a recognised control command.' });
            return;
        }
        // A run restored from disk has no gate, budget or state machine behind it:
        // driving it would half-apply a control to a record, so it is refused.
        if (store.get(runId)?.restored) {
            sendJson(res, 409, { error: '该研讨来自历史记录，已经结束，无法再下发指令。' });
            return;
        }
        if (!orchestrator.control(runId, control)) {
            sendJson(res, 404, { error: 'No such run, or it has already finished.' });
            return;
        }
        sendJson(res, 200, { ok: true, run: store.get(runId)?.state });
        return;
    }
    // ------------------------------------------------------------------ history
    if (method === 'DELETE' && runMatch) {
        const runId = decodeURIComponent(runMatch[1]);
        if (!store.get(runId)) {
            sendJson(res, 404, { error: 'No such run.' });
            return;
        }
        orchestrator.dispose?.(runId);
        store.remove(runId);
        options.history?.forget(runId);
        sendJson(res, 200, { ok: true, runId });
        return;
    }
    sendJson(res, 404, { error: `No route for ${method} ${path}.` });
}
/** Phases after which a run never changes again. */
const TERMINAL_PHASES = new Set(['completed', 'failed', 'stopped']);
/** How much of each earlier artefact a follow-up run inherits. */
const CONTINUATION_LIMITS = { question: 300, direction: 400, answer: 800 };
/** Clip a piece of inherited text so one long answer cannot flood the next run. */
function clipText(value, max) {
    const text = typeof value === 'string' ? value.trim() : '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
}
/**
 * Fold a finished run's public artefacts into the context block a follow-up run
 * starts with.
 *
 * Only blackboard content is used -- never hidden reasoning -- and every field
 * is clipped. The last requirement line is what keeps a follow-up from redoing
 * work the earlier run already finished and verified.
 */
export function buildContinuationContext(state) {
    const board = state.blackboard ?? {};
    const decision = board.decision ?? (Array.isArray(board.decisions) ? board.decisions[board.decisions.length - 1] : undefined);
    const lines = [
        '【这是一条续接的研讨】下面是上一轮已经完成的结论，本轮是同一话题的追问，不是新话题。',
        `上一轮的问题：${clipText(state.request, CONTINUATION_LIMITS.question)}`,
    ];
    if (decision?.finalDirection)
        lines.push(`上一轮的结论方向：${clipText(decision.finalDirection, CONTINUATION_LIMITS.direction)}`);
    if (board.finalAnswer)
        lines.push(`上一轮的最终答复：${clipText(board.finalAnswer, CONTINUATION_LIMITS.answer)}`);
    if (board.plan?.steps?.length) {
        const steps = board.plan.steps.slice(0, 6).map((step) => step.description).filter(Boolean).join('；');
        if (steps !== '')
            lines.push(`上一轮的计划：${clipText(steps, CONTINUATION_LIMITS.direction)}`);
    }
    if (board.execution)
        lines.push(`上一轮的执行：${board.execution.status ?? '未知'}（${Array.isArray(board.execution.outputs) ? board.execution.outputs.length : 0} 步）`);
    lines.push('本轮要求：直接回答追问；上一轮已经完成并通过验证的步骤不要重复执行；若要改动，给出新的计划并说明与上一轮的差异。');
    return lines.join('\n');
}
/** Validate and narrow an untrusted control payload. */
function parseControl(raw) {
    if (typeof raw !== 'object' || raw === null)
        return undefined;
    const o = raw;
    switch (o.kind) {
        case 'stop':
            return { kind: 'stop' };
        case 'skip-review':
            return { kind: 'skip-review' };
        case 'approve-plan':
            return { kind: 'approve-plan' };
        case 'force-adopt':
            return typeof o.proposalId === 'string' ? { kind: 'force-adopt', proposalId: o.proposalId } : undefined;
        case 'supply-clarification':
            return typeof o.answer === 'string' ? { kind: 'supply-clarification', answer: o.answer } : undefined;
        case 'edit-plan': {
            // A plan edit is a structural object; the orchestrator validates it
            // against the plan shape when it consumes it.
            const plan = o.plan;
            if (typeof plan !== 'object' || plan === null)
                return undefined;
            return { kind: 'edit-plan', plan: plan };
        }
        default:
            return undefined;
    }
}
/**
 * SSE stream of run-state changes.
 *
 * New subscribers receive a full snapshot immediately, so the client never has
 * to poll to reach a consistent view — it can render from the first event.
 */
function streamEvents(req, res, store) {
    res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
    });
    const write = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    // Initial state.
    write('snapshot', { runs: store.list() });
    const unsubscribe = store.subscribe((state) => {
        write('run-updated', state);
    });
    // Heartbeat keeps intermediaries from closing an idle stream. A run can sit
    // parked on a user answer for minutes.
    const heartbeat = setInterval(() => {
        res.write(': ping\n\n');
    }, 15_000);
    const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
    };
    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('error', cleanup);
}
//# sourceMappingURL=api-routes.js.map