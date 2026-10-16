import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const sharp = req('sharp');
const html = fs.readFileSync((REPO_ROOT + '/圆桌视图-原型.html'), 'utf8');
const s = html.indexOf('var SEATS = [');
const e = html.indexOf('/* ============================================================================\n   3. 状态');
const pure = html.slice(s, e);
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(pure + '\n;globalThis.__x = {SEATS:SEATS, MODELS:MODELS, INITIAL_SEATED:INITIAL_SEATED, ROLE_COLOR:ROLE_COLOR, ROLE_TEXT:ROLE_TEXT, chibiSVG:chibiSVG, hash:hash};', ctx);
const X = ctx.__x;
const W = 1480, H = 820;
const P = (v, total) => v / 100 * total;
const base = H * 0.175;
const chars = [];
const seats = X.SEATS;
for (const st of seats) {
  const id = X.INITIAL_SEATED[st.id]; if (!id) continue;
  const m = X.MODELS[id];
  const px = Math.round(base * st.s);
  const w = px, h = Math.round(px * 1.3);
  const x = P(st.x, W) - w / 2, y = P(st.y, H) - h;
  const vis = (st.role === 'decisionMaker') ? 'approval' : (st.role === 'executor' ? 'executing' : (st.role === 'proposer' ? 'thinking' : (st.role === 'verifier' ? 'ready' : 'waiting')));
  const cap = '<g transform="translate(' + P(st.x, W) + ',' + (P(st.y, H) + 16) + ')"><rect x="-72" y="-12" width="144" height="20" rx="10" fill="rgba(9,13,20,.86)" stroke="' + X.ROLE_COLOR[st.role] + '55"/><text text-anchor="middle" y="2" font-family="Microsoft YaHei" font-size="11" fill="#cbd5e1">' + X.ROLE_TEXT[st.role] + ' · ' + m.label + '</text></g>';
  chars.push({ z: st.y + 0.01, svg: '<g transform="translate(' + x + ',' + y + ')">' + X.chibiSVG(m, vis, px, 'chibi') + '</g>' + cap, x: P(st.x, W), y: P(st.y, H), label: m.label, role: st.role });
}
const behind = chars.filter(c => c.z < 55).sort((a, b) => a.z - b.z).map(c => c.svg).join('');
const front = chars.filter(c => c.z >= 55).sort((a, b) => a.z - b.z).map(c => c.svg).join('');
const bubbles = [
  { x: 0.20 * W, y: 0.78 * H - 268, who: '提案 A · 交付优先', text: '我倾向先抽取文本再排版：链路最短，格式风险集中在最后一步。' },
  { x: 0.80 * W, y: 0.78 * H - 268, who: '提案 B · 运维优先', text: '先把内容归一化成 Markdown，样式与内容解耦，后续换样式不用重跑。' },
  { x: 0.50 * W, y: 0.46 * H - 214, who: '执行模型 · 待命', text: '等主导模型拍板，批准后按计划动手。' }
];
const bubbleSVG = bubbles.map(b => {
  const w = 330, h = 66;
  return '<g transform="translate(' + (b.x - w / 2) + ',' + (b.y - h) + ')">' +
    '<rect width="' + w + '" height="' + h + '" rx="14" fill="#f8fafc" opacity=".97"/>' +
    '<path d="M' + (w / 2 - 8) + ' ' + h + ' l8 10 l8 -10 z" fill="#f8fafc" opacity=".97"/>' +
    '<text x="14" y="22" font-family="Microsoft YaHei,Segoe UI" font-size="12" fill="#475569">' + b.who + '</text>' +
    '<text x="14" y="44" font-family="Microsoft YaHei,Segoe UI" font-size="13" fill="#0f172a">' + b.text + '</text>' +
  '</g>';
}).join('');
const rail = ['提案','互评','决策','计划','等待批准','执行','验证','汇总'];
let railSVG = ''; let rx = 34;
rail.forEach((r, i) => {
  const on = i <= 1, now = i === 1;
  railSVG += '<circle cx="' + rx + '" cy="30" r="9" fill="' + (on ? (now ? '#3b82f6' : '#22c55e') : 'none') + '" stroke="' + (on ? (now ? '#3b82f6' : '#22c55e') : 'rgba(255,255,255,.28)') + '" stroke-width="1.5"/>';
  railSVG += '<text x="' + (rx + 14) + '" y="34" font-family="Microsoft YaHei" font-size="12" fill="' + (on ? '#e8edf7' : '#93a0b8') + '">' + r + '</text>';
  rx += 30 + r.length * 12 + 26;
  if (i < rail.length - 1) railSVG += '<line x1="' + (rx - 22) + '" y1="30" x2="' + (rx - 6) + '" y2="30" stroke="rgba(255,255,255,.18)"/>';
});
const scene = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
  '<defs><radialGradient id="bg" cx="50%" cy="0%" r="90%"><stop offset="0%" stop-color="#1b2740"/><stop offset="60%" stop-color="#0b0f18"/></radialGradient>' +
  '<radialGradient id="tab" cx="50%" cy="25%"><stop offset="0%" stop-color="#3b4a63"/><stop offset="70%" stop-color="#242f42"/><stop offset="100%" stop-color="#1a2231"/></radialGradient>' +
  '<radialGradient id="floor" cx="50%" cy="45%"><stop offset="0%" stop-color="#7896ff" stop-opacity=".16"/><stop offset="100%" stop-color="#7896ff" stop-opacity="0"/></radialGradient></defs>' +
  '<rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>' +
  '<ellipse cx="' + (W / 2) + '" cy="' + (H * 0.88) + '" rx="' + (W * 0.45) + '" ry="' + (H * 0.24) + '" fill="url(#floor)"/>' +
  railSVG +
  behind +
  '<ellipse cx="' + (W / 2) + '" cy="' + (H * 0.55) + '" rx="' + (W * 0.31) + '" ry="' + (H * 0.15) + '" fill="url(#tab)" stroke="rgba(255,255,255,.10)"/>' +
  '<ellipse cx="' + (W / 2) + '" cy="' + (H * 0.55) + '" rx="' + (W * 0.31) + '" ry="' + (H * 0.15) + '" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="7"/>' +
  '<ellipse cx="' + (W / 2) + '" cy="' + (H * 0.585) + '" rx="' + (W * 0.29) + '" ry="' + (H * 0.145) + '" fill="none" stroke="rgba(255,255,255,.06)"/>' +
  front +
  bubbleSVG +
  '<text x="34" y="' + (H - 26) + '" font-family="Microsoft YaHei" font-size="12" fill="#93a0b8">多模型研讨 · 圆桌视图 设计稿（参数化 Q 版形象：角色姿态 × 状态表情）</text>' +
  '<text x="' + (W - 34) + '" y="' + (H - 26) + '" text-anchor="end" font-family="Microsoft YaHei" font-size="12" fill="#93a0b8">主导（前）· 讨论者（两侧）· 执行（最里）</text>' +
  '</svg>';
fs.writeFileSync((REPO_ROOT + '/圆桌设计预览.svg'), scene, 'utf8');
await sharp(Buffer.from(scene)).png().toFile((REPO_ROOT + '/圆桌设计预览.png'));
const st = fs.statSync((REPO_ROOT + '/圆桌设计预览.png'));
console.log('PNG written:', st.size, 'bytes');