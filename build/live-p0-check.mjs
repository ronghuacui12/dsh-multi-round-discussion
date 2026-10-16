import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import fs from 'node:fs';
const api = 'http://127.0.0.1:19387/dsh-mmd';
const response = await fetch(api + '/runs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
  preset: 'fast',
  request: '这是圆桌视图 P0 的只读联调测试。只做文字讨论，不调用任何工具，不读取或修改文件，不执行命令。问题：代码变更后为什么要先做冒烟测试？请用一句话回答；各阶段说明尽量简短，计划中不安排任何工具操作。',
}) });
if (!response.ok) throw new Error(await response.text());
const created = await response.json();
const runId = created.run.runId;
console.log('Started real P0 smoke run:', runId);
fs.writeFileSync((REPO_ROOT + '/build/live-p0-run-id.txt'), runId);
const log = (REPO_ROOT + '/build/live-p0-states.ndjson');
let revision = -1;
for (let i = 0; i < 60; i++) {
  const { run } = await (await fetch(api + '/runs/' + runId)).json();
  if (run.revision !== revision) {
    revision = run.revision;
    fs.appendFileSync(log, JSON.stringify(run) + '\n');
    console.log(JSON.stringify({ phase: run.phase, revision, participants: run.participants.map(p => ({ id: p.profileId, role: p.role, state: p.state })), proposals: run.blackboard.proposals.length, tokens: run.cost.totalTokens }));
  }
  if (['completed', 'failed', 'stopped', 'awaiting-user'].includes(run.phase) || run.phase === 'planning' && run.pendingQuestion) {
    fs.writeFileSync((REPO_ROOT + '/build/live-p0-result.json'), JSON.stringify(run, null, 2));
    console.log('Final smoke state:', run.phase);
    break;
  }
  await new Promise(resolve => setTimeout(resolve, 2000));
}
