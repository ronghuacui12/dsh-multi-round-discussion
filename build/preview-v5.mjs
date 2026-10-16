import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
// Loopback-only visual harness for the actual Loader bundle. No real model/tool calls.
import fs from 'node:fs';
import http from 'node:http';
import { build } from 'esbuild';
const base = (REPO_ROOT + '');
const smoke = fs.readFileSync(base + '/build/ui-smoke.mjs', 'utf8');
const fixtures = smoke.slice(smoke.indexOf('const settings ='), smoke.indexOf('const writes ='));
const source = `
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as jsx from 'react/jsx-runtime';
${fixtures}
const sources = [];
const live = new URLSearchParams(location.search).has('live');
const nativeFetch = window.fetch.bind(window);
if (!live) window.EventSource = class {
  listeners = {};
  constructor() { sources.push(this); }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  close() {}
};
const full = new URLSearchParams(location.search).has('full');
if (full) {
  const brands = ['ChatGPT','Claude','Gemini','Grok','DeepSeek','GLM','MiniMax','Kimi','Step','MiMo','Qwen','Doubao'];
  runFixture.participants = Array.from({ length: 12 }, (_, i) => ({
    profileId: 'full-' + i, label: brands[i], provider: 'preview', model: brands[i].toLowerCase(),
    role: ['decisionMaker', 'proposer', 'proposer', 'proposer', 'proposer', 'proposer', 'reviewer', 'reviewer', 'reviewer', 'executor', 'verifier', 'verifier'][i],
    state: 'idle', phase: 'idle',
  }));
  settings.profiles = runFixture.participants.map(p => ({id:p.profileId,label:p.label,provider:p.provider,model:p.model,role:p.role,enabled:true,temperature:.4}));
  settings.providers = [{id:'preview',name:'预览提供商',models:brands.map(b=>({id:b.toLowerCase(),name:b}))}];
  runFixture.phase = 'completed'; runFixture.pendingQuestion = undefined;
}
const brands=['ChatGPT','Claude','Gemini','Grok','DeepSeek','GLM','MiniMax','Kimi','Step','MiMo','Qwen','Doubao'];
function setPeople(count) {
 const picked=count===3?[0,1,4]:count===6?[0,1,2,3,5,4]:brands.map((_,i)=>i);
 const roleList=count===3?['decisionMaker','proposer','executor']:count===6?['decisionMaker','proposer','proposer','proposer','reviewer','executor']:['decisionMaker','proposer','proposer','proposer','proposer','proposer','reviewer','reviewer','reviewer','executor','verifier','verifier'];
 settings.profiles=picked.map((index,i)=>({id:'model-'+index,label:brands[index],model:brands[index].toLowerCase(),provider:'preview',role:roleList[i],enabled:true,temperature:.4}));
 settings.providers=[{id:'preview',name:'预览提供商',models:brands.map(b=>({id:b.toLowerCase(),name:b}))}];
 runFixture.participants=settings.profiles.map(p=>({...p,profileId:p.id,state:'idle',phase:'idle'}));runFixture.phase='completed';runFixture.pendingQuestion=undefined;runFixture.revision++;
 runFixture.blackboard={proposals:[{id:'proposal-v5',profileId:settings.profiles[1]?.id,summary:'先把目标拆清楚，再一起比较方案。',plan:'补充执行步骤，确认后开始。',reasons:[],risks:[],dependencies:[],confidence:.8}]};
 for (const s of sources) s.listeners['run-updated']?.({data:JSON.stringify(runFixture)});
}
if (!live) setPeople(Number(new URLSearchParams(location.search).get('count'))||12);
window.fetch = async (url, init) => {
  if (live && !init?.method) return nativeFetch(url, init);
  if (init?.method) console.info('Preview control (no real execution)', init.body);
  if (String(url).endsWith('/settings') && init?.method === 'POST') Object.assign(settings, JSON.parse(init.body));
  const path = String(url);
  const data = path.endsWith('/settings') ? settings : path.endsWith('/runs') ? { runs: [{ runId: 'run-1', request: runFixture.request, phase: runFixture.phase }] } : { run: runFixture };
  return { ok: true, text: async () => JSON.stringify(data) };
};
window.__ModuleLoader__ = { load(module) {
  const registrations = [];
  module.factory(id => id === 'react' ? React : jsx).apply({ slots: {
    inject: (name, callback) => callback(), register: (meta, component) => registrations.push({ meta, component }),
  }});
  const View = registrations.find(item => item.meta.name === 'conversation.view').component;
  createRoot(document.getElementById('app')).render(React.createElement(View));
}};
document.getElementById('theme').onclick = () => document.body.classList.toggle('dark');
document.getElementById('people').value=String(runFixture.participants.length);
document.getElementById('phase').value=runFixture.phase;
document.getElementById('people').onchange=e=>setPeople(Number(e.target.value));
document.getElementById('replace').onclick=()=>{const p=runFixture.participants.at(-1);p.model=p.model==='qwen'?'doubao':'qwen';p.label=p.model==='qwen'?'千问':'豆包';runFixture.revision++;for(const s of sources)s.listeners['run-updated']?.({data:JSON.stringify(runFixture)});};
document.getElementById('phase').onchange = event => {
  const phase = event.target.value;
  runFixture.phase = phase;
  runFixture.pendingQuestion = phase === 'planning' ? '是否批准执行？' : undefined;
  runFixture.participants = runFixture.participants.map(p => ({ ...p,
    state: phase === 'proposing' && p.role === 'proposer' || phase === 'executing' && p.role === 'executor' ? 'thinking' : phase === 'failed' && p.role === 'proposer' ? 'error' : phase === 'completed' ? 'done' : 'idle',
    phase, startedAt: Date.now() - 12000,
  }));
  runFixture.revision++;
  for (const s of sources) s.listeners['run-updated']?.({ data: JSON.stringify(runFixture) });
};
if (live) { document.getElementById('phase').disabled = true; document.querySelector('header b').textContent = '圆桌 P0 · 实际 DSH run / 只读联调'; }
`;
const result = await build({ stdin: { contents: source, resolveDir: base + '/build', loader: 'js' }, bundle: true,
  nodePaths: [REPO_ROOT + '/node_modules'], write: false, format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"development"' } });
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>可变阵容长桌 · 真实组件预览</title><style>
*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI','Microsoft YaHei',sans-serif;background:#eef2f7}header{height:44px;padding:8px 16px;display:flex;align-items:center;gap:14px;font-size:12px}header b{margin-right:auto}button,select{font:inherit}#app{height:calc(100dvh - 44px)}.dark{--dsh-color-bg:#111827;--dsh-color-fg:#e5edf8;--dsh-color-fg-muted:#9caec6;--dsh-color-border:#ffffff26;--dsh-color-bg-secondary:#182236;background:#0d1523;color:#e5edf8}
</style><header><b>可变阵容预览 · 模拟数据</b><label>人数 <select id="people"><option>3</option><option>6</option><option>12</option></select></label><button id="replace">替换末位模型</button><label>阶段 <select id="phase"><option value="planning">等你批准</option><option value="proposing">并行提案</option><option value="executing">执行中</option><option value="failed">失败</option><option value="stopped">叫停</option><option value="completed">完成</option></select></label><button id="theme">切换主题</button></header><div id="app"></div><script src="/boot.js"></script><script src="/client.js"></script></html>`;
const server = http.createServer((request, response) => {
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  response.setHeader('Cache-Control', 'no-store');
  if (/^\/dsh-mmd\/art\/((?:seated-)?(?:chatgpt|claude|gemini|grok|deepseek|glm|minimax|kimi|step|mimo|qwen|doubao)|longtable|room|wood-short|wood-long)\.webp$/.test(path)) {
    response.setHeader('Content-Type','image/webp'); response.end(fs.readFileSync(base + '/plugin/lib/art/' + path.split('/').pop())); return;
  }
  if (path.startsWith('/dsh-mmd/') && request.method === 'GET') {
    const upstream = http.get({ hostname: '127.0.0.1', port: 19387, path: request.url }, incoming => {
      response.writeHead(incoming.statusCode, incoming.headers);
      incoming.pipe(response);
    });
    upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end(); });
    response.on('close', () => upstream.destroy());
    return;
  }
  if (path === '/boot.js') { response.setHeader('Content-Type', 'text/javascript; charset=utf-8'); response.end(result.outputFiles[0].text); }
  else if (path === '/client.js') { response.setHeader('Content-Type', 'text/javascript; charset=utf-8'); response.end(fs.readFileSync(base + '/plugin/lib/client.js')); }
  else { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html); }
});
server.listen(19409, '127.0.0.1', () => console.log('Adaptive preview: http://127.0.0.1:19409/?count=12'));
