import {fileURLToPath as repoFileURLToPath} from 'node:url';
const REPO_ROOT=repoFileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/').replace(/\/$/,'');
import fs from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const sharp = req('sharp');
const root = (REPO_ROOT + '');
const source = (REPO_ROOT + '/art/concepts/twelve-models-atlas-v3.png');
const output = root + '/plugin/lib/art';
fs.mkdirSync(output, { recursive: true });
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const visited = new Uint8Array(w * h), labels = new Uint32Array(w * h), queue = new Int32Array(w * h), components = [];
let tag = 0;
for (let start = 0; start < visited.length; start++) {
  if (visited[start] || data[start * 4 + 3] < 70) continue;
  let head = 0, tail = 1, minX = w, maxX = 0, minY = h, maxY = 0, sx = 0, sy = 0;
  queue[0] = start; visited[start] = 1;
  while (head < tail) {
    const p = queue[head++], x = p % w, y = Math.floor(p / w);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); sx += x; sy += y;
    const neighbors = [x ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const n of neighbors) if (n >= 0 && !visited[n] && data[n * 4 + 3] >= 70) { visited[n] = 1; queue[tail++] = n; }
  }
  tag++;
  for (let i = 0; i < tail; i++) labels[queue[i]] = tag;
  if (tail > 300) components.push({ tag, area: tail, minX, minY, maxX, maxY, cx: sx / tail, cy: sy / tail });
}
const large = components.filter(c => c.area > 15000);
console.log(JSON.stringify({ w, h, large, components: components.length }, null, 2));
if (large.length !== 12) throw new Error('Expected twelve separated main character components; inspect the generated atlas before packing.');
const names = ['chatgpt', 'claude', 'gemini', 'grok', 'deepseek', 'glm', 'minimax', 'kimi', 'step', 'mimo', 'qwen', 'doubao'];
const ordered = [...large].sort((a, b) => a.cy - b.cy);
const sorted = [];
for (let row = 0; row < 3; row++) sorted.push(...ordered.slice(row * 4, row * 4 + 4).sort((a, b) => a.cx - b.cx));
const manifest = {};
for (let i = 0; i < sorted.length; i++) {
  const main = sorted[i];
  // Nearby detached adornments belong to the closest established character center.
  const parts = components.filter(c => sorted.reduce((best, v) => ((c.cx - v.cx) ** 2 + (c.cy - v.cy) ** 2) < ((c.cx - best.cx) ** 2 + (c.cy - best.cy) ** 2) ? v : best, sorted[0]) === main);
  const left = Math.max(0, Math.min(...parts.map(c => c.minX)) - 3), top = Math.max(0, Math.min(...parts.map(c => c.minY)) - 3);
  const right = Math.min(w, Math.max(...parts.map(c => c.maxX)) + 4), bottom = Math.min(h, Math.max(...parts.map(c => c.maxY)) + 4);
  // Keep only pixels assigned to this character, so touching cell bounds cannot leak a neighbor.
  const crop = Buffer.alloc((right - left) * (bottom - top) * 4);
  const tags = new Set(parts.map(c => c.tag));
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
    let keep = tags.has(labels[y * w + x]);
    if (!labels[y * w + x] && data[(y * w + x) * 4 + 3]) {
      for (let dy = -2; dy <= 2 && !keep; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (x + dx >= 0 && x + dx < w && y + dy >= 0 && y + dy < h && tags.has(labels[(y + dy) * w + x + dx])) { keep = true; break; }
      }
    }
    if (keep) data.copy(crop, ((y - top) * (right - left) + x - left) * 4, (y * w + x) * 4, (y * w + x) * 4 + 4);
  }
  const file = names[i] + '.webp';
  await sharp(crop, { raw: { width: right - left, height: bottom - top, channels: 4 } }).resize(320, 360, { fit: 'contain', background: '#00000000' }).webp({ quality: 94, alphaQuality: 100 }).toFile(output + '/' + file);
  manifest[names[i]] = { file, width: 320, height: 360, sourceBounds: { left, top, width: right - left, height: bottom - top } };
}
await sharp((REPO_ROOT + '/art/concepts/longtable-v3.png')).trim({ background: '#00000000', threshold: 10 }).resize({ width: 1800 }).webp({ quality: 94, alphaQuality: 100 }).toFile(output + '/longtable.webp');
fs.writeFileSync(output + '/manifest.json', JSON.stringify({ version: 1, characters: manifest, table: 'longtable.webp' }, null, 2));
console.log('Packed twelve alpha sprites and the long table.');
