import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import fs from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const sharp = req('sharp');
const W = 1460, H = 900;
const S = [];
const P = (x) => x;
S.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">');
S.push('<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#121826"/><stop offset="100%" stop-color="#0b0f18"/></linearGradient></defs>');
S.push('<rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>');
S.push('<text x="40" y="46" font-family="Microsoft YaHei,Segoe UI" font-size="21" font-weight="700" fill="#e8edf7">圆桌视图 · Q 版角色施工图（画布 512 × 640，脚底中心为原点）</text>');
S.push('<text x="40" y="72" font-family="Microsoft YaHei" font-size="13" fill="#93a0b8">把这张图发给画师：所有部件都画在这块画布里，锚点/头身比/手挂点对齐即可；表情与道具单独成层。</text>');
/* ---- 左：画布 ---- */
const CX = 300, CY = 150, CW = 512, CH = 640;
S.push('<rect x="' + CX + '" y="' + CY + '" width="' + CW + '" height="' + CH + '" fill="#0f1420" stroke="#3b82f6" stroke-width="2"/>');
for (let gx = 0; gx <= CW; gx += 64) S.push('<line x1="' + (CX + gx) + '" y1="' + CY + '" x2="' + (CX + gx) + '" y2="' + (CY + CH) + '" stroke="rgba(255,255,255,.06)"/>');
for (let gy = 0; gy <= CH; gy += 64) S.push('<line x1="' + CX + '" y1="' + (CY + gy) + '" x2="' + (CX + CW) + '" y2="' + (CY + gy) + '" stroke="rgba(255,255,255,.06)"/>');
S.push('<rect x="' + (CX + 16) + '" y="' + (CY + 16) + '" width="' + (CW - 32) + '" height="' + (CH - 32) + '" fill="none" stroke="rgba(148,163,184,.5)" stroke-dasharray="6 5"/>');
S.push('<text x="' + (CX + 20) + '" y="' + (CY + 34) + '" font-family="Consolas,monospace" font-size="11" fill="#64748b">安全区 16px</text>');
/* 头 */
const HX = CX + 256, HY = CY + 190, HR = 85;
S.push('<circle cx="' + HX + '" cy="' + HY + '" r="' + HR + '" fill="rgba(59,130,246,.10)" stroke="#60a5fa" stroke-width="1.6"/>');
S.push('<circle cx="' + HX + '" cy="' + HY + '" r="78" fill="none" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="4 4"/>');
S.push('<circle cx="' + HX + '" cy="' + HY + '" r="3" fill="#60a5fa"/>');
S.push('<text x="' + (HX + 96) + '" y="' + (HY - 76) + '" font-family="Microsoft YaHei" font-size="12" fill="#93c5fd">头部外圈 r=85</text>');
S.push('<text x="' + (HX + 96) + '" y="' + (HY - 58) + '" font-family="Microsoft YaHei" font-size="12" fill="#fbbf24">脸槽 r=78（不画五官，留给用户头像）</text>');
S.push('<text x="' + (HX + 96) + '" y="' + (HY - 40) + '" font-family="Consolas,monospace" font-size="11" fill="#64748b">head center = (256, 190)</text>');
/* 躯干框 */
S.push('<rect x="' + (CX + 150) + '" y="' + (CY + 300) + '" width="212" height="300" rx="40" fill="rgba(34,197,94,.07)" stroke="#22c55e" stroke-width="1.2" stroke-dasharray="5 5"/>');
S.push('<text x="' + (CX + 368) + '" y="' + (CY + 316) + '" font-family="Microsoft YaHei" font-size="12" fill="#6ee7a0">躯干/四肢活动区</text>');
/* 肩与手锚点 */
[['肩 L', 172, 300], ['肩 R', 340, 300], ['手 L', 150, 430], ['手 R', 362, 430]].forEach(function (p) {
  const ax = CX + p[1], ay = CY + p[2];
  S.push('<circle cx="' + ax + '" cy="' + ay + '" r="6" fill="none" stroke="#f472b6" stroke-width="2"/>');
  S.push('<line x1="' + (ax - 12) + '" y1="' + ay + '" x2="' + (ax + 12) + '" y2="' + ay + '" stroke="#f472b6" stroke-width="1"/>');
  S.push('<line x1="' + ax + '" y1="' + (ay - 12) + '" x2="' + ax + '" y2="' + (ay + 12) + '" stroke="#f472b6" stroke-width="1"/>');
  S.push('<text x="' + (ax + 12) + '" y="' + (ay - 10) + '" font-family="Microsoft YaHei" font-size="11" fill="#f9a8d4">' + p[0] + '(' + p[1] + ',' + p[2] + ')</text>');
});
S.push('<text x="' + (CX + 372) + '" y="' + (CY + 470) + '" font-family="Microsoft YaHei" font-size="12" fill="#f9a8d4">道具挂右手</text>');
/* 脚底线 + 锚点 */
const AY = CY + 600;
S.push('<line x1="' + CX + '" y1="' + AY + '" x2="' + (CX + CW) + '" y2="' + AY + '" stroke="#ef4444" stroke-width="2"/>');
S.push('<text x="' + (CX + 10) + '" y="' + (AY - 10) + '" font-family="Microsoft YaHei" font-size="12" fill="#fca5a5">脚底基准线 y=600（角色站在这里）</text>');
S.push('<circle cx="' + (CX + 256) + '" cy="' + AY + '" r="7" fill="none" stroke="#ef4444" stroke-width="2.5"/>');
S.push('<line x1="' + (CX + 216) + '" y1="' + AY + '" x2="' + (CX + 296) + '" y2="' + AY + '" stroke="#ef4444" stroke-width="1.4"/>');
S.push('<path d="M' + (CX + 256) + ' ' + (AY + 8) + ' l0 24" stroke="#ef4444" stroke-width="1.4"/>');
S.push('<text x="' + (CX + 268) + '" y="' + (AY + 26) + '" font-family="Consolas,monospace" font-size="12" fill="#fca5a5">ANCHOR (256, 600)</text>');
S.push('<text x="' + (CX + 150) + '" y="' + (AY + 30) + '" font-family="Microsoft YaHei" font-size="12" fill="#fca5a5">脚下留 40px 影子</text>');
/* 头身比标注 */
S.push('<line x1="' + (CX - 24) + '" y1="' + (CY + 40) + '" x2="' + (CX - 24) + '" y2="' + (CY + 105) + '" stroke="#22c55e" stroke-width="2"/>');
S.push('<line x1="' + (CX - 34) + '" y1="' + (CY + 40) + '" x2="' + (CX - 14) + '" y2="' + (CY + 40) + '" stroke="#22c55e" stroke-width="2"/>');
S.push('<line x1="' + (CX - 34) + '" y1="' + (CY + 105) + '" x2="' + (CX - 14) + '" y2="' + (CY + 105) + '" stroke="#22c55e" stroke-width="2"/>');
S.push('<text x="' + (CX - 92) + '" y="' + (CY + 78) + '" font-family="Microsoft YaHei" font-size="12" fill="#6ee7a0">头部 42%</text>');
S.push('<line x1="' + (CX + 300) + '" y1="' + (CY + 40) + '" x2="' + (CX + 300) + '" y2="' + (CY + 600) + '" stroke="#3b82f6" stroke-width="2"/>');
S.push('<text x="' + (CX + 308) + '" y="' + (CY + 330) + '" font-family="Microsoft YaHei" font-size="12" fill="#93c5fd">全高 560px（y=40 → y=600）</text>');
/* ---- 右：规格 ---- */
const RX = 880;
S.push('<text x="' + RX + '" y="150" font-family="Microsoft YaHei" font-size="15" font-weight="700" fill="#e8edf7">规格</text>');
const specs = [
  ['源画布', '512 × 640 px，透明背景'],
  ['导出', '@2x 256×320 / @1x 128×160'],
  ['锚点', '脚底中心 (256, 600)'],
  ['头部', '中心 (256, 190)，外圈 r=85'],
  ['脸槽', 'r=78，五官不画进模板'],
  ['肩/手', '肩 y=300，手 y=430'],
  ['描边', '512 宽下 2–4px 深色收圆'],
  ['上色', '白/灰底 + 蒙版，代码换色'],
  ['阴影', '不要烘焙进图，代码统一投'],
  ['命名', '全小写 + 下划线，见 manifest']
];
specs.forEach(function (s, i) {
  const y = 180 + i * 30;
  S.push('<text x="' + RX + '" y="' + y + '" font-family="Microsoft YaHei" font-size="13" fill="#93a0b8">' + s[0] + '</text>');
  S.push('<text x="' + (RX + 96) + '" y="' + y + '" font-family="Consolas,Microsoft YaHei" font-size="13" fill="#e8edf7">' + s[1] + '</text>');
});
S.push('<text x="' + RX + '" y="520" font-family="Microsoft YaHei" font-size="15" font-weight="700" fill="#e8edf7">角色配色（衣服主色）</text>');
const roles = [['主导 decisionMaker', '#22c55e'], ['讨论 proposer', '#3b82f6'], ['评审 reviewer', '#a855f7'], ['执行 executor', '#f59e0b'], ['验证 verifier', '#06b6d4']];
roles.forEach(function (r, i) {
  const y = 550 + i * 32;
  S.push('<rect x="' + RX + '" y="' + (y - 14) + '" width="22" height="22" rx="6" fill="' + r[1] + '"/>');
  S.push('<text x="' + (RX + 34) + '" y="' + y + '" font-family="Microsoft YaHei" font-size="13" fill="#e8edf7">' + r[0] + '  ' + r[1] + '</text>');
});
S.push('<text x="' + RX + '" y="740" font-family="Microsoft YaHei" font-size="15" font-weight="700" fill="#e8edf7">屏幕上的实际大小（舞台高 420px 时）</text>');
S.push('<text x="' + RX + '" y="768" font-family="Microsoft YaHei" font-size="12.5" fill="#93a0b8">角色宽 = 舞台高 × 0.19 × 座位缩放（44–96px）；高 = 宽 × 1.3</text>');
S.push('<text x="' + RX + '" y="792" font-family="Consolas,monospace" font-size="12.5" fill="#93a0b8">leader 1.16 → 92×120   proposer 1.06 → 85×110   reviewer 0.95 → 76×99</text>');
S.push('<text x="' + RX + '" y="816" font-family="Consolas,monospace" font-size="12.5" fill="#93a0b8">executor 1.04 → 83×108   verifier 0.90 → 72×94</text>');
S.push('<text x="' + RX + '" y="856" font-family="Microsoft YaHei" font-size="12.5" fill="#f59e0b">所以源图 512×640 足够 4 倍余量；请勿小于 256×320。</text>');
S.push('</svg>');
const svg = S.join('');
fs.writeFileSync((REPO_ROOT + '/美术对齐模板.svg'), svg, 'utf8');
await sharp(Buffer.from(svg)).png().toFile((REPO_ROOT + '/美术对齐模板.png'));
console.log('template png:', fs.statSync((REPO_ROOT + '/美术对齐模板.png')).size, 'bytes');