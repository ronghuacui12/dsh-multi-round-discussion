import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const React = req('react');
const ReactDOMClient = req('react-dom/client');
const jsxRuntime = req('react/jsx-runtime');

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://127.0.0.1:19387/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
try { Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true }); } catch (e) {}
const eventSources = [];
globalThis.EventSource = class {
  listeners = {};
  constructor() { eventSources.push(this); }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  close() { this.closed = true; }
};

const settings = {
  profiles: [
    { id: 'lead', role: 'decisionMaker', provider: 'deepseek-official', model: 'deepseek-v4-pro', label: '主导模型', temperature: 0.4, systemPrompt: '你是负责人', enabled: true },
    { id: 'proposer-a', role: 'proposer', provider: 'deepseek-official', model: 'deepseek-v4-flash', label: '提案 A', temperature: 0.8, systemPrompt: '', enabled: true },
    { id: 'executor', role: 'executor', provider: 'deepseek-official', model: 'deepseek-v4-flash', label: '执行模型', temperature: 0.1, systemPrompt: '', enabled: true }
  ],
  providers: [{ id: 'deepseek-official', name: 'DeepSeek 官方', models: [{ id: 'deepseek-v4-pro', name: 'V4 Pro' }, { id: 'deepseek-v4-flash', name: 'V4 Flash' }] }],
  tools: ['read', 'write', 'edit', 'read_image', 'glob', 'grep', 'pwsh', 'bash', 'todo_write', 'web_search', 'web_fetch', 'job_list', 'job_output', 'job_kill', 'present', 'mcp__win__click', 'mcp__win__screenshot', 'spawn_teammate', 'send_message', 'team_task_create'],
  execution: { mode: 'confirm', allowedTools: ['read', 'glob', 'grep'], maxSteps: 12 },
  preset: 'balanced', peerReview: true, avatars: {}, mmdHome: 'C:/Users/x/.dsh/mmd'
};
const runFixture = {
  runId: 'run-1', request: '把 D:/1 里的报告整理成一份 PDF', phase: 'planning', revision: 7,
  pendingQuestion: '该计划包含会改变系统状态的操作，是否批准执行？',
  participants: [
    { profileId: 'lead', label: '主导模型', role: 'decisionMaker', state: 'idle' },
    { profileId: 'proposer-a', label: '提案 A', role: 'proposer', state: 'thinking' },
    { profileId: 'executor', label: '执行模型', role: 'executor', state: 'idle' }
  ],
  blackboard: {
    proposals: [{ id: 'proposal-r1-1', profileId: 'proposer-a', summary: '先抽取文本再排版', plan: '用 python-docx 抽文本', reasons: ['快'], risks: ['格式丢失'], dependencies: [], confidence: 0.7 }],
    reviews: [{ id: 'review-1', reviewerProfileId: 'proposer-a', targetProposalId: 'proposal-r1-1', round: 1, pros: ['结构清楚'], cons: ['漏了附件'], suggestions: ['补附件'], confidence: 0.6 }],
    decisions: [{ id: 'decision-1', round: 1, decisionMakerProfileId: 'lead', chosenProposalIds: ['proposal-r1-1'], finalDirection: '按 A 走', rationale: '成本低' }],
    plan: { id: 'plan-1', planBuilderProfileId: 'lead', mutatesState: true, notes: '注意备份', steps: [
      { id: 's1', description: '读取源文件', tool: 'read', acceptance: '拿到全文' },
      { id: 's2', description: '生成 PDF', tool: 'write', acceptance: '文件存在' } ] }
  },
  notices: [{ id: 'n1', level: 'info', message: '讨论完成' }],
  cost: { totalTokens: 12345, totalCostUsd: 0.0123, budget: { maxTotalTokens: 2000000 }, byProfile: [{ profileId: 'lead', label: '主导模型', provider: 'p', model: 'm', calls: 2, inputTokens: 100, outputTokens: 50 }] }
};

const writes = [];
globalThis.fetch = async (url, init) => {
  if (init?.method === 'POST') writes.push({ url: String(url), body: JSON.parse(init.body) });
  const u = String(url);
  let body = {};
  if (u.endsWith('/settings')) body = settings;
  else if (u.endsWith('/runs')) body = { runs: [{ runId: 'run-1', request: runFixture.request, phase: 'planning' }] };
  else if (u.includes('/runs/run-1')) body = { run: runFixture };
  return { ok: true, status: 200, text: async () => JSON.stringify(body) };
};

const code = fs.readFileSync((REPO_ROOT + '/plugin/lib/client.js'), 'utf8');
let captured = null;
dom.window.__ModuleLoader__ = { load: (o) => { captured = o; } };
new Function('window', code)(dom.window);
const registered = [];
const ctx = { logger: () => ({ info() {} }), slots: { inject: (name, fn) => fn(), register: (meta, comp) => { registered.push({ meta, comp }); } } };
captured.factory((id) => (id === 'react' ? React : id === 'react/jsx-runtime' ? jsxRuntime : (() => { throw new Error('unexpected require ' + id); })())).apply(ctx);
console.log('registered slots:', registered.map((r) => r.meta.name + ':' + r.meta.id).join(', '));
console.log('styles injected:', !!document.getElementById('dsh-mmd-styles'), '| css bytes:', (document.getElementById('dsh-mmd-styles') || {}).textContent ? document.getElementById('dsh-mmd-styles').textContent.length : 0);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = {};
const mounts = {};
for (const entry of registered) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOMClient.createRoot(host);
  root.render(React.createElement(entry.comp));
  await sleep(120);
  results[entry.meta.name] = host.innerHTML;
  mounts[entry.meta.name] = { host, root };
}
const set = results['settings.section'] || '';
const chat = results['conversation.view'] || '';
const checks = [
  ['settings: title', set.includes('研讨模式')],
  ['settings: role cards', set.includes('主导模型') && set.includes('执行方式')],
  ['settings: tool presets', set.includes('只读') && set.includes('常用读写') && set.includes('清空')],
  ['settings: mcp tools listed', set.includes('mcp__win__click')],
  ['settings: categories', set.includes('MCP（外部服务器）') && set.includes('终端 / 系统')],
  ['settings: seats render', set.includes('提案 A') && set.includes('V4 Pro')],
  ['chat: phase rail', chat.includes('mmd-rail') && chat.includes('提案')],
  ['chat: inline approve card', chat.includes('mmd-approve-card') && chat.includes('批准并执行')],
  ['chat: docked approve bar', chat.includes('mmd-approve-bar')],
  ['chat: plan steps', chat.includes('生成 PDF')],
  ['chat: side panel', chat.includes('mmd-side') && chat.includes('总 token')],
  ['chat: approve bar after transcript', chat.indexOf('mmd-approve-bar') > chat.indexOf('mmd-body')],
  ['chat: composer in bottom dock', chat.indexOf('发起研讨') > chat.indexOf('mmd-body')]
];
const { host: chatHost, root: chatRoot } = mounts['conversation.view'];
const eventSource = eventSources[0];
const publish = async (next) => {
  Object.assign(runFixture, next);
  eventSource.listeners['run-updated']({ data: JSON.stringify(runFixture) });
  await sleep(35);
};
const stateOf = (id) => chatHost.querySelector('.mmd-rt-actor[data-profile="' + id + '"]')?.dataset.state;
const modeButton = (text) => [...chatHost.querySelectorAll('.mmd-rt-toolbar button')].find((b) => b.textContent === text);
checks.push(
  ['adaptive: live scene renders only actual participants', chatHost.querySelectorAll('[data-seat]').length === 3],
  ['P0: frozen run participants occupy correct role seats', chatHost.querySelector('[data-seat="S1"]').dataset.profile === 'lead' && chatHost.querySelector('[data-seat="S10"]').dataset.profile === 'executor'],
  ['P0: approval spotlight only marks the lead', stateOf('lead') === 'approval' && stateOf('executor') === 'waiting'],
  ['P0: stage is above rail and transcript; dock remains last', (() => { const shell = chatHost.querySelector('.mmd-discussion-content'); return shell.firstElementChild.classList.contains('mmd-rt-stage') && shell.querySelector('.mmd-rail').compareDocumentPosition(shell.querySelector('.mmd-body')) & 4 && shell.nextElementSibling.classList.contains('mmd-foot'); })()],
  ['P0: blackboard summary uses run counts', chatHost.querySelector('.mmd-rt-summary').textContent.includes('1 提案 · 1 评议 · 2 步计划')],
);
await publish({ phase: 'proposing', pendingQuestion: undefined, participants: [
  { profileId: 'historic-lead', label: '历史主导', role: 'decisionMaker', state: 'idle', phase: 'idle' },
  ...Array.from({ length: 5 }, (_, i) => ({ profileId: 'p' + i, label: '讨论 ' + i, role: 'proposer', state: 'thinking', phase: 'proposing', startedAt: Date.now() - 12000 })),
  { profileId: 'executor', label: '执行模型', role: 'executor', state: 'idle', phase: 'idle' },
] });
checks.push(
  ['P0: SSE drives thinking expressions without another data source', stateOf('p0') === 'thinking'],
  ['P0: at most three phase action bubbles; elapsed time is shown', chatHost.querySelectorAll('.mmd-rt-activity').length === 3 && /1[2-3]s/.test(chatHost.querySelector('.mmd-rt-activity').textContent)],
  ['P0: historical run does not borrow current roster identities', stateOf('historic-lead') === 'waiting' && !chatHost.querySelector('.mmd-rt-actor[data-profile="lead"]')],
);
await publish({ phase: 'executing', participants: [
  { profileId: 'lead', label: '主导模型', role: 'decisionMaker', state: 'done', phase: 'planning' },
  { profileId: 'executor', label: '执行模型', role: 'executor', state: 'thinking', phase: 'executing', startedAt: Date.now() },
  { profileId: 'oops', label: '失败模型', role: 'proposer', state: 'error', phase: 'proposing', error: '服务暂不可用' },
] });
checks.push(['P0: done, executing and error are distinct', stateOf('lead') === 'done' && stateOf('executor') === 'executing' && stateOf('oops') === 'error']);
await publish({ phase: 'completed' });
checks.push(['P0: success celebrates; failed participant retains error', stateOf('lead') === 'celebrate' && stateOf('oops') === 'error']);
await publish({ phase: 'stopped' });
checks.push(['P0: stopped run desaturates participants', stateOf('executor') === 'aborted']);
await publish({ phase: 'failed' });
checks.push(['P0: failed run stops stale thinking animations', stateOf('executor') === 'waiting']);

modeButton('只看长桌').click(); await sleep(25);
checks.push(['P0: table view persists locally', chatHost.querySelector('.mmd-root').classList.contains('mmd-view-table') && localStorage.getItem('dsh-mmd.roundtable.mode') === 'table']);
modeButton('只看对话').click(); await sleep(25);
checks.push(['P0: original transcript remains mounted in chat view', chatHost.querySelector('.mmd-root').classList.contains('mmd-view-chat') && chatHost.querySelector('.mmd-body').textContent.includes('生成 PDF')]);
modeButton('长桌 + 对话').click(); await sleep(25);
const separator = chatHost.querySelector('[role="separator"]');
separator.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); await sleep(25);
checks.push(['P0: accessible splitter persists the new height', separator.getAttribute('aria-valuenow') === '59' && localStorage.getItem('dsh-mmd.roundtable.height') === '59']);
checks.push(['P0: switching views and resizing never mutate the server', writes.length === 0]);

await publish({ phase: 'planning', pendingQuestion: '是否批准？' });
modeButton('只看长桌').click(); await sleep(25);
[...chatHost.querySelectorAll('.mmd-foot button')].find((b) => b.textContent.includes('改一下计划')).click(); await sleep(25);
checks.push(['P0: editing a plan reopens the transcript', chatHost.querySelector('.mmd-root').classList.contains('mmd-view-split') && chatHost.querySelector('.mmd-approve-card textarea')]);
[...chatHost.querySelectorAll('.mmd-foot button')].find((b) => b.textContent.includes('批准并执行')).click(); await sleep(25);
checks.push(['P0: bottom approval retains the existing control payload', writes.length === 1 && writes[0].body.control.kind === 'approve-plan' && writes[0].url.endsWith('/runs/run-1/control')]);

// Remount with no historical runs: enabled roster is a preview, never a made-up run.
for (const { root } of Object.values(mounts)) root.unmount();
globalThis.fetch = async (url) => ({ ok: true, text: async () => JSON.stringify(String(url).endsWith('/settings') ? { ...settings, profiles: [...settings.profiles, { id: 'off', role: 'reviewer', enabled: false }] } : { runs: [] }) });
localStorage.setItem('dsh-mmd.roundtable.mode', 'chat');
const emptyRoot = ReactDOMClient.createRoot(chatHost);
emptyRoot.render(React.createElement(registered.find((r) => r.meta.name === 'conversation.view').comp)); await sleep(80);
checks.push(['P0: persisted view preference is restored', chatHost.querySelector('.mmd-root').classList.contains('mmd-view-chat')]);
checks.push(['P0: no-run preview includes only enabled roster models', chatHost.querySelectorAll('.mmd-rt-actor').length === 3 && !chatHost.querySelector('[data-profile="off"]') && chatHost.querySelector('.mmd-empty')]);
emptyRoot.unmount();
checks.push(['P0: event streams close on unmount', eventSources.every((source) => source.closed)]);

let failed = 0;
for (const pair of checks) { console.log((pair[1] ? 'PASS ' : 'FAIL ') + pair[0]); if (!pair[1]) failed++; }
console.log('\n--- chat html length:', chat.length, '| settings html length:', set.length);
console.log('chat tail:', chat.slice(-700));
process.exit(failed > 0 ? 1 : 0);
