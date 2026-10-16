/**
 * Continuation smoke test.
 *
 * A follow-up run must inherit the previous run's public artefacts -- question,
 * conclusion, answer, plan, execution status -- and nothing else. The context
 * builder is pure, so it is tested directly instead of through a live host.
 *
 * Usage:  node build/continuation-smoke.mjs
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url)).replaceAll('\\', '/').replace(/\/$/, '');
const { buildContinuationContext } = await import(pathToFileURL(REPO_ROOT + '/plugin/lib/host/api-routes.js').href);

const results = [];
const ok = (name, cond, extra) => results.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  [' + extra + ']' : ''));

const finished = {
  runId: 'mmd-aaaa1111',
  request: '把 D:/1 里的实验报告整理成一份 PDF 并附上数据表',
  blackboard: {
    finalAnswer: '已完成：D:/1/result.pdf（6 页）。',
    decision: { id: 'd1', round: 1, decisionMakerProfileId: 'lead', chosenProposalIds: ['p1'], finalDirection: '抽取用 A，渲染用 B。' },
    plan: { id: 'plan-1', steps: [{ id: 's1', description: '读取源文件' }, { id: 's2', description: '生成 PDF' }] },
    execution: { status: 'completed', outputs: [{ stepId: 's1' }, { stepId: 's2' }] },
  },
};
const ctx = buildContinuationContext(finished);
ok('声明这是续接而非新话题', ctx.includes('续接的研讨'));
ok('带上上一轮问题', ctx.includes('把 D:/1 里的实验报告整理成一份 PDF'));
ok('带上结论方向', ctx.includes('抽取用 A，渲染用 B。'));
ok('带上最终答复', ctx.includes('D:/1/result.pdf'));
ok('带上计划步骤', ctx.includes('读取源文件') && ctx.includes('生成 PDF'));
ok('带上执行状态与步数', ctx.includes('completed（2 步）'));
ok('要求不重复已完成步骤', ctx.includes('不要重复执行'));
ok('上下文长度可控', ctx.length < 2400, ctx.length + ' 字符');

const long = buildContinuationContext({ runId: 'r', request: 'x'.repeat(2000), blackboard: { finalAnswer: 'y'.repeat(5000) } });
ok('超长文本被裁剪', long.length < 1600, long.length + ' 字符');
ok('裁剪带省略号', long.includes('…'));

const bare = buildContinuationContext({ runId: 'r', request: '只有问题' });
ok('没有黑板也不报错', bare.includes('只有问题') && bare.includes('不要重复执行'));

const noExecution = buildContinuationContext({ runId: 'r', request: 'q', blackboard: { decision: { finalDirection: 'd' } } });
ok('缺执行阶段不编造执行行', !noExecution.includes('上一轮的执行'));

const fails = results.filter((line) => line.startsWith('FAIL')).length;
console.log(results.join('\n'));
console.log('');
console.log(results.length - fails + '/' + results.length + ' passed');
process.exit(fails === 0 ? 0 : 1);