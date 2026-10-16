import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const dom = new JSDOM('<div id="root"></div>', {url:'http://localhost/'});
globalThis.window=dom.window; globalThis.document=dom.window.document; globalThis.localStorage=dom.window.localStorage;
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
const React=req('react'), {createRoot}=req('react-dom/client');
const out=await build({stdin:{contents:`export {Roundtable} from '../plugin/client-src/roundtable/index'; export * from '../plugin/client-src/roundtable/catalog'; export * from '../plugin/client-src/roundtable/roster';`,resolveDir:(REPO_ROOT + '/build'),loader:'ts'},bundle:true,jsx:'automatic',write:false,platform:'node',format:'cjs',external:['react','react/jsx-runtime']});
const mod={exports:{}}; new Function('require','module','exports',out.outputFiles[0].text)(req,mod,mod.exports);
const {Roundtable,MODEL_ART,artOf,moveProfiles,validateRoster}=mod.exports;
const roles=['decisionMaker','proposer','executor'];
let settings={profiles:roles.map((role,i)=>({id:['lead','proposer','executor'][i],role,model:['gpt-6','claude-sonnet','deepseek-v4'][i],provider:'route',label:['GPT','Claude','DeepSeek'][i],enabled:true,temperature:.4,apiKeyRef:'route-key',maxTokens:4096})),providers:[{id:'route',models:MODEL_ART.map(a=>({id:a.id,name:a.name}))}],execution:{mode:'confirm',allowedTools:['read']},preset:'deep'};
const initial=structuredClone(settings); let runs=[],writes=[],failure=false;
globalThis.fetch=async(url,init)=>{if(init?.method==='POST'){writes.push(JSON.parse(init.body));if(failure)return {ok:false,status:500,text:async()=>JSON.stringify({error:'测试保存失败'})};Object.assign(settings,JSON.parse(init.body));}return {ok:true,text:async()=>JSON.stringify(String(url).endsWith('/runs')?{runs}:settings)};};
const host=document.getElementById('root'),root=createRoot(host);let run=null,jumped='';
function render(){root.render(React.createElement(Roundtable,{profiles:structuredClone(settings.profiles),providers:settings.providers,preset:settings.preset,run,mode:'split',onSettings:(data)=>{settings=data;render();},onJump:id=>jumped=id}));}
const pause=()=>new Promise(r=>setTimeout(r,35)); const checks=[];
const check=(name,ok)=>{checks.push([name,!!ok]);};
function button(text){const b=[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===text);if(!b)throw Error('Missing button '+text);return b;}
async function click(text){button(text).click();await pause();}
const seat=id=>host.querySelector('[data-seat="'+id+'"]');
async function context(id){host.querySelector('[data-profile="'+id+'"]').dispatchEvent(new dom.window.MouseEvent('contextmenu',{bubbles:true,clientX:100,clientY:100}));await pause();}
async function close(){host.querySelector('[role="dialog"] [aria-label="关闭面板"]')?.click();await pause();}
render();await pause();
check('live scene shows only 3 enabled models',host.querySelectorAll('[data-seat]').length===3&&host.querySelectorAll('.mmd-rt-actor').length===3);
check('explicit GLM model wins over OpenAI-compatible provider',artOf({model:'glm-5',provider:'openai'}, {})==='glm');
check('Qwen and Doubao auto-identify',artOf({model:'qwen3.5'}, {})==='qwen'&&artOf({model:'doubao-seed-2'}, {})==='doubao');
await click('十二模型形象');
check('gallery has all twelve seated images including Qwen/Doubao',host.querySelectorAll('.mmd-rt-actor img').length===12&&host.innerHTML.includes('/seated-qwen.webp')&&host.innerHTML.includes('/seated-doubao.webp'));
check('gallery makes no API writes',writes.length===0);
await click('布置阵容');check('roster retains twelve logical role targets',host.querySelectorAll('[data-seat]').length===12);
await context('lead');await click('换座位 / 交换职责…');await click('执行位 · DeepSeek');
check('occupied-seat swap persists both roles',settings.profiles.find(p=>p.id==='lead').role==='executor'&&settings.profiles.find(p=>p.id==='executor').role==='decisionMaker');
check('only profiles are submitted; route settings survive',Object.keys(writes[0]||{}).join()==='profiles'&&settings.execution.mode==='confirm'&&settings.preset==='deep'&&settings.profiles[0].apiKeyRef==='route-key'&&settings.profiles[0].maxTokens===4096);
await close();
const count=writes.length;await context('executor');await click('暂时离席');
check('required lead cannot leave',writes.length===count&&host.textContent.includes('需要保留'));
await context('proposer');await click('换座位 / 交换职责…');await click('评审位 1 · 空位');
check('last proposer cannot move to vacant different role',writes.length===count&&settings.profiles.find(p=>p.id==='proposer').role==='proposer');await close();
failure=true;await context('lead');await click('换座位 / 交换职责…');await click('主导位 · DeepSeek');
check('server failure visible without optimistic role changes',host.textContent.includes('测试保存失败')&&settings.profiles.find(p=>p.id==='lead').role==='executor');await close();failure=false;
await context('proposer');await click('编辑信息与形象…');
check('editor contains registered route and manual model ID',host.querySelector('[aria-label="Provider 路由"] option[value="route"]')&&host.querySelector('[aria-label="模型 ID"]').tagName==='INPUT');
settings.profiles=settings.profiles.map(p=>p.id==='proposer'?{...p,label:'外部更改'}:p);
const beforeConflict=writes.length;host.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await pause();
check('concurrent profile edit is rejected',writes.length===beforeConflict&&host.textContent.includes('其他界面修改'));await close();render();await pause();
runs=[{phase:'executing'}];await context('lead');await click('换座位 / 交换职责…');await click('主导位 · DeepSeek');
check('another active run blocks roster writes',writes.length===beforeConflict&&host.textContent.includes('有研讨正在运行'));await close();runs=[];
await context('proposer');await click('编辑信息与形象…');
const appearance=host.querySelector('[aria-label="人物形象"]');appearance.value='qwen';appearance.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await pause();host.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await pause();
check('art assignment persists independently of API identity',JSON.parse(localStorage.getItem('dsh-mmd.art.assignments.v1')).proposer==='qwen'&&settings.profiles.find(p=>p.id==='proposer').model==='claude-sonnet');
seat('S3').click();await pause();
check('vacant seat opens picker with twelve identity choices',host.querySelector('[role="dialog"]')&&host.querySelectorAll('.mmd-table-art-grid button').length===12);await close();
// Restore an optional disabled profile through a vacant seat, using its existing route.
settings.profiles.push({id:'off',role:'reviewer',label:'Off',provider:'route',model:'kimi',temperature:.4,enabled:false});render();await pause();seat('S7').click();await pause();
const off=[...host.querySelectorAll('.mmd-table-pick-profile')].find(b=>b.textContent.includes('Off'));off?.click();await pause();
check('disabled optional model can rejoin without losing connection',settings.profiles.find(p=>p.id==='off').enabled===true&&settings.profiles.find(p=>p.id==='off').model==='kimi');
// Real pointer path through occupied seats: threshold, hit-testing and release.
document.elementFromPoint=()=>seat('S1');const source=host.querySelector('[data-profile="lead"]');
function pointer(type,x,y){const e=new dom.window.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0});Object.defineProperty(e,'pointerId',{value:7});source.dispatchEvent(e);}
pointer('pointerdown',0,0);pointer('pointermove',50,50);await pause();check('pointer drag highlights target',seat('S1').classList.contains('is-drop-target'));pointer('pointerup',50,50);await pause();
check('pointer drop swaps actual model roles',settings.profiles.find(p=>p.id==='lead').role==='decisionMaker');
await new Promise(r=>setTimeout(r,320));run={runId:'history',phase:'proposing',participants:[{profileId:'lead',role:'decisionMaker',label:'Frozen GPT',state:'thinking'}],blackboard:{proposals:[{profileId:'lead',summary:'真实公开发言'}]}};render();await pause();
await click('本次研讨');host.querySelector('[data-profile="lead"]').click();await pause();
check('selected character shows latest public contribution',host.textContent.includes('真实公开发言'));await click('定位最近发言');check('transcript callback carries profile ID',jumped==='lead');
await click('布置阵容');await context('lead');check('active selected run disables editing',button('编辑信息与形象…').disabled&&button('暂时离席').disabled);
let rejected=false;try{validateRoster([{...initial.profiles[0],role:'proposer'},...initial.profiles.slice(1)]);}catch{rejected=true;}check('roster rejects missing lead',rejected);
rejected=false;try{moveProfiles(initial.profiles,'lead','proposer');}catch{rejected=true;}check('pure move validates required roles',rejected);
root.unmount();
for(const [name,ok]of checks)console.log((ok?'PASS ':'FAIL ')+name);
console.log(checks.filter(c=>c[1]).length+'/'+checks.length+' passed');process.exitCode=checks.some(c=>!c[1])?1:0;
