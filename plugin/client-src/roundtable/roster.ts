import type { ModelProfile, ModelRole } from '../../lib/types/model-profile';
import { ROLE_TEXT, SEAT_MAP } from './layout';

export const ROLE_LIMITS: Record<string, number> = { decisionMaker: 1, proposer: 5, reviewer: 3, executor: 1, verifier: 2 };
export const REQUIRED = ['decisionMaker', 'proposer', 'executor'];
export const isRunning = (run?: { phase?: string } | null) => !!run && !['completed', 'failed', 'stopped', 'idle'].includes(run.phase || 'idle');
export function validateRoster(profiles: ModelProfile[]) {
  const used = new Set<string>();
  for (const p of profiles) {
    if (used.has(p.id)) throw new Error('模型 ID 重复：' + p.id);
    used.add(p.id);
    if (!p.id.trim() || !p.provider.trim() || !p.model.trim()) throw new Error('请填写显示名对应的 Provider 和模型 ID。');
    if (!ROLE_LIMITS[p.role]) throw new Error('不支持的职责：' + p.role);
    if (p.temperature !== undefined && (!Number.isFinite(p.temperature) || p.temperature < 0 || p.temperature > 2)) throw new Error('温度应在 0 到 2 之间。');
  }
  for (const [role, max] of Object.entries(ROLE_LIMITS)) {
    const count = profiles.filter((p) => p.enabled !== false && p.role === role).length;
    if (count > max) throw new Error(ROLE_TEXT[role as ModelRole] + '最多 ' + max + ' 位。');
    if (REQUIRED.includes(role) && !count) throw new Error('需要保留至少一位启用的' + ROLE_TEXT[role as ModelRole] + '。');
  }
}
export function moveProfiles(profiles: ModelProfile[], sourceId: string, role: ModelRole, targetId?: string): ModelProfile[] {
  const source = profiles.find((p) => p.id === sourceId);
  const target = profiles.find((p) => p.id === targetId);
  if (!source || source.enabled === false) throw new Error('源模型已离席，请重新读取阵容。');
  if (targetId && (!target || target.enabled === false || target.role !== role)) throw new Error('目标座位已变更，请重新读取后再试。');
  const next = profiles.map((p) => p.id === sourceId ? { ...p, role } : target && p.id === target.id ? { ...p, role: source.role } : p);
  validateRoster(next);
  return next;
}
export function fingerprint(profile: ModelProfile) {
  return JSON.stringify(Object.entries(profile).sort(([a], [b]) => a.localeCompare(b)));
}
export function nextProfileId(profiles: ModelProfile[]) {
  let index = 1;
  while (profiles.some((p) => p.id === 'table-model-' + index)) index++;
  return 'table-model-' + index;
}
const SEAT_KEY = 'dsh-mmd.table.seats.v1';
export function readSeatPrefs(): Record<string, string> {
  try {
    const data = JSON.parse(localStorage.getItem(SEAT_KEY) || '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([, id]) => SEAT_MAP.some((s) => s.id === id))) as Record<string, string>;
  } catch { return {}; }
}
export function saveSeatPrefs(prefs: Record<string, string>) { try { localStorage.setItem(SEAT_KEY, JSON.stringify(prefs)); } catch {} }
