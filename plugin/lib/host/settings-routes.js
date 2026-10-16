/**
 * Settings / model-catalog / avatar routes.
 *
 * Split out of `api-routes.js` because these routes exist for the settings
 * panel, while the rest of that file exists for the discussion view. Keeping
 * them apart means the settings surface can be reasoned about (and rate of
 * change) on its own.
 *
 * @module dsh-multi-model-discussion/host/settings-routes
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { avatarDir, mmdHome } from './user-settings.js';

/** Avatars are small images; anything larger is a mistake, not a feature. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
/** Mime types accepted for an uploaded avatar. */
const AVATAR_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
};
/** Executor whitelists are matched exactly, so offer real tool names first. */
const FALLBACK_TOOLS = ['read', 'write', 'edit', 'read_image', 'glob', 'grep', 'pwsh', 'bash', 'todo_write', 'present'];

function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'content-length': Buffer.byteLength(payload),
    });
    res.end(payload);
}

async function readJsonBody(req, limit = 4 * 1024 * 1024) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > limit)
            throw new Error('请求体过大。');
        chunks.push(buffer);
    }
    if (chunks.length === 0)
        return {};
    const text = Buffer.concat(chunks).toString('utf8');
    return text.trim() === '' ? {} : JSON.parse(text);
}

/** Provider routes plus the models each one advertises. */
async function modelCatalog(ctx) {
    const providers = ctx.llm.listProviders();
    const out = [];
    for (const provider of providers) {
        let models = [];
        try {
            const listed = await ctx.llm.listModels(provider.id);
            models = listed.map((model) => ({
                id: model.id,
                name: model.name ?? model.id,
                ...(model.description ? { description: model.description } : {}),
            }));
        }
        catch {
            // An adapter that cannot enumerate models is still usable with an
            // exact model id, so report the route with an empty catalog.
            models = [];
        }
        out.push({ id: provider.id, name: provider.name ?? provider.id, models });
    }
    return out;
}

/** The deployment's default sandbox mode, as the tools will resolve it. */
function sandboxDefault(ctx) {
    try {
        return ctx.get('sandboxPolicy')?.resolve().mode ?? '(未挂载 sandboxPolicy)';
    }
    catch (cause) {
        return `(读取失败：${cause instanceof Error ? cause.message : String(cause)})`;
    }
}
/** Tool names the executor could be allowed to call. */
function toolCatalog(ctx) {
    try {
        const schemas = ctx.tools.schemas();
        const names = schemas.map((schema) => schema.name).filter((name) => typeof name === 'string');
        return names.length > 0 ? names : FALLBACK_TOOLS;
    }
    catch {
        return FALLBACK_TOOLS;
    }
}

/** Persist one uploaded avatar and return its file name. */
function storeAvatar(key, dataUrl) {
    const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl);
    if (!match)
        throw new Error('头像必须是 data URL 形式的 base64 图片。');
    const extension = AVATAR_TYPES[match[1]];
    if (!extension)
        throw new Error(`不支持的头像格式 ${match[1]}，请使用 PNG / JPEG / WebP / GIF。`);
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0)
        throw new Error('头像内容为空。');
    if (buffer.length > MAX_AVATAR_BYTES)
        throw new Error('头像过大（上限 2 MB）。');
    const dir = avatarDir();
    fs.mkdirSync(dir, { recursive: true });
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
    const fileName = `${safeKey}-${createHash('sha256').update(buffer).digest('hex').slice(0, 10)}.${extension}`;
    fs.writeFileSync(path.join(dir, fileName), buffer);
    return fileName;
}

/** Serve one avatar file by the key it was stored under. */
function serveAvatar(res, settings, key) {
    const fileName = settings.snapshot().avatars?.[key];
    if (typeof fileName !== 'string' || fileName === '') {
        sendJson(res, 404, { error: '该角色还没有头像。' });
        return;
    }
    // `fileName` comes back from our own document, but it is user-editable JSON:
    // refuse anything that escapes the avatar directory.
    const resolved = path.resolve(avatarDir(), path.basename(fileName));
    if (!resolved.startsWith(path.resolve(avatarDir()) + path.sep)) {
        sendJson(res, 400, { error: '头像路径无效。' });
        return;
    }
    let buffer;
    try {
        buffer = fs.readFileSync(resolved);
    }
    catch {
        sendJson(res, 404, { error: '头像文件已丢失，请重新上传。' });
        return;
    }
    const extension = path.extname(resolved).slice(1).toLowerCase();
    const mime = Object.entries(AVATAR_TYPES).find(([, ext]) => ext === extension)?.[0] ?? 'application/octet-stream';
    res.writeHead(200, {
        'content-type': mime,
        'content-length': buffer.length,
        'cache-control': 'no-cache',
    });
    res.end(buffer);
}

/**
 * Route one settings-layer request.
 *
 * @returns whether the request was handled. `false` lets the caller fall
 *   through to the discussion routes, so route ownership stays visible in one
 *   place (the dispatcher) instead of being spread across modules.
 */
export async function handleSettingsRoutes(req, res, requestPath, method, deps) {
    const { ctx, settings, logger } = deps;
    // Explicit allowlist: package art only; never resolve an arbitrary client-supplied path.
    const artMatch = /^\/art\/((?:seated-)?(?:chatgpt|claude|gemini|grok|deepseek|glm|minimax|kimi|step|mimo|qwen|doubao)|longtable|room|wood-short|wood-long)\.webp$/.exec(requestPath);
    if (method === 'GET' && artMatch) {
        try {
            const buffer = fs.readFileSync(new URL(`../art/${artMatch[1]}.webp`, import.meta.url));
            res.writeHead(200, { 'content-type': 'image/webp', 'content-length': buffer.length, 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' });
            res.end(buffer);
        } catch { sendJson(res, 404, { error: '美术资源未安装。' }); }
        return true;
    }
    if (method === 'GET' && requestPath === '/models') {
        sendJson(res, 200, { providers: await modelCatalog(ctx) });
        return true;
    }
    if (method === 'GET' && requestPath === '/settings') {
        sendJson(res, 200, {
            ...settings.snapshot(),
            providers: await modelCatalog(ctx),
            tools: toolCatalog(ctx),
            mmdHome: mmdHome(),
            sandboxDefaultMode: sandboxDefault(ctx),
        });
        return true;
    }
    if (method === 'GET' && requestPath === '/tools') {
        sendJson(res, 200, { tools: toolCatalog(ctx) });
        return true;
    }
    if (method === 'POST' && requestPath === '/settings') {
        const body = await readJsonBody(req);
        try {
            const result = settings.apply(body);
            logger?.info('settings updated: %d profiles', result.settings.profiles.length);
            sendJson(res, 200, {
                ...result.settings,
                providers: await modelCatalog(ctx),
                tools: toolCatalog(ctx),
                mmdHome: mmdHome(),
                sandboxDefaultMode: sandboxDefault(ctx),
                warnings: result.warnings,
            });
        }
        catch (cause) {
            sendJson(res, 400, { error: cause instanceof Error ? cause.message : String(cause) });
        }
        return true;
    }
    if (method === 'POST' && requestPath === '/avatars') {
        const body = await readJsonBody(req);
        const key = typeof body.key === 'string' ? body.key.trim() : '';
        if (key === '') {
            sendJson(res, 400, { error: '缺少 key。' });
            return true;
        }
        try {
            const fileName = storeAvatar(key, typeof body.dataUrl === 'string' ? body.dataUrl : '');
            const avatars = settings.setAvatar(key, fileName);
            sendJson(res, 200, { key, fileName, avatars, url: `/dsh-mmd/avatars/${encodeURIComponent(key)}?v=${randomUUID().slice(0, 6)}` });
        }
        catch (cause) {
            sendJson(res, 400, { error: cause instanceof Error ? cause.message : String(cause) });
        }
        return true;
    }
    const avatarMatch = /^\/avatars\/([^/]+)$/.exec(requestPath);
    if (method === 'GET' && avatarMatch) {
        serveAvatar(res, settings, decodeURIComponent(avatarMatch[1]));
        return true;
    }
    return false;
}
