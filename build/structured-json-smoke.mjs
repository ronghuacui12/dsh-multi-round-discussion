/**
 * Structured-output parsing smoke test.
 *
 * Real model replies are not always valid JSON: a stray `]` closing a `{`, an
 * unescaped quote inside a Chinese sentence, a missing comma, or a reply cut off
 * by the token cap. Each of those used to lose the whole contribution (and, at
 * the planning step, the whole run). These cases pin the salvage behaviour.
 *
 * Usage:  node build/structured-json-smoke.mjs
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url)).replaceAll('\\', '/').replace(/\/$/, '');
const { extractJsonValue, parseStructured, repairJsonText } = await import(pathToFileURL(REPO_ROOT + '/plugin/lib/utils/json.js').href);

const results = [];
const ok = (name, cond, extra) => results.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  [' + extra + ']' : ''));
const json = (text) => JSON.stringify(extractJsonValue(text));

ok('纯 JSON', json('{"a":1}') === '{"a":1}');
ok('带前后说明文字', json('好的，这是结果：\n{"a":2}\n希望有帮助') === '{"a":2}');
ok('代码围栏', json('```json\n{"a":3}\n```') === '{"a":3}');
ok('数组根', json('[1,2,3]') === '[1,2,3]');

// 报告的那个缺陷：] 关在 { 上
ok('错误括号类型 ] 关闭 {', JSON.stringify(extractJsonValue('{"a": 1]')) === '{"a":1}', 'got ' + json('{"a": 1]'));
ok('嵌套里错误括号类型', JSON.stringify(extractJsonValue('{"steps": [{"id": "s1"}], ]')) === '{"steps":[{"id":"s1"}]}');
ok('多余右括号被丢弃', JSON.stringify(extractJsonValue('{"a":1}}')) === '{"a":1}');
ok('多余左括号自动补齐', JSON.stringify(extractJsonValue('{"a":{"b":1}')) === '{"a":{"b":1}}');

// 字符串内的缺陷
const inner = extractJsonValue('{"summary": "使用 "缓存" 策略", "risk": "低"}');
ok('字符串里未转义的引号', inner.summary === '使用 "缓存" 策略', String(inner.summary));
ok('缺逗号', JSON.stringify(extractJsonValue('{"a":1 "b":2}')) === '{"a":1,"b":2}');
ok('尾逗号', JSON.stringify(extractJsonValue('{"a":1,}')) === '{"a":1}');

// 截断
const cut = extractJsonValue('{"steps": [1, 2');
ok('截断的数组被补齐', Array.isArray(cut.steps) && cut.steps.length === 2, JSON.stringify(cut));
const cutStr = extractJsonValue('{"note": "没有写完');
ok('截断的字符串被补齐', typeof cutStr.note === 'string', JSON.stringify(cutStr));

// 确实修不好时要报错
let threw = false;
try { extractJsonValue('完全没有 JSON'); } catch { threw = true; }
ok('没有 JSON 时抛错', threw);
threw = false;
try { extractJsonValue('{"a": }'); } catch (cause) { threw = /does not parse|unterminated/.test(String(cause && cause.message)); }
ok('修不好时报可读错误', threw);

// parseStructured 走同一套修复
const shaped = parseStructured('{"summary": "x", "steps": [{"id": "s1"]', (raw) => ({ summary: raw.summary, steps: raw.steps }));
ok('parseStructured 也能修复', shaped.summary === 'x' && shaped.steps.length === 1, JSON.stringify(shaped));
const repaired = repairJsonText('{"a":1 "b":2}');
ok('repairJsonText 仍可单独使用', JSON.stringify(JSON.parse(repaired)) === '{"a":1,"b":2}');

// 全角标点 / 缺逗号：真实中文模型输出里最常见的一类
ok('全角逗号', JSON.stringify(extractJsonValue('{"a": 1， "b": 2}')) === '{"a":1,"b":2}', json('{"a": 1， "b": 2}'));
ok('全角冒号', JSON.stringify(extractJsonValue('{"a"：1}')) === '{"a":1}');
ok('中文引号当分隔符', JSON.stringify(extractJsonValue('{“a”: 1}')) === '{"a":1}');
ok('数组元素缺逗号', JSON.stringify(extractJsonValue('["好" "快"]')) === '["好","快"]');
const reviewShaped = extractJsonValue('{"reviews": [{"targetAnonId": "P1", "pros": ["好"]，"cons": []}]}');
ok('评审样例（全角逗号）', reviewShaped.reviews.length === 1 && reviewShaped.reviews[0].pros[0] === '好', JSON.stringify(reviewShaped));
ok('属性间缺逗号（原来报 Expected , or } 的那类）', JSON.stringify(extractJsonValue('{"a": "x" "b": "y"}')) === '{"a":"x","b":"y"}');
const fails = results.filter((line) => line.startsWith('FAIL')).length;
console.log(results.join('\n'));
console.log('');
console.log((results.length - fails) + '/' + results.length + ' passed');
process.exit(fails === 0 ? 0 : 1);