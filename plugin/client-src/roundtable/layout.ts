import type { ParticipantStatus, RunState } from '../../lib/types/run';
import type { ModelProfile, ModelRole } from '../../lib/types/model-profile';

export type StageParticipant = ParticipantStatus & { provider?: string; model?: string };
export type StageRun = Pick<RunState, 'runId' | 'phase' | 'participants' | 'blackboard' | 'pendingQuestion'> & Partial<Pick<RunState, 'cost'>>;
export type StageProfile = ModelProfile;
export interface SeatPosition { id: string; role: ModelRole; x: number; y: number; scale: number; name: string }

export const ROLE_TEXT: Record<ModelRole, string> = {
  decisionMaker: '主导', proposer: '讨论', reviewer: '评审', executor: '执行', verifier: '验证', planBuilder: '计划',
};
export const ROLE_COLOR: Record<ModelRole, string> = {
  decisionMaker: '#22c55e', proposer: '#3b82f6', reviewer: '#a855f7', executor: '#f59e0b', verifier: '#06b6d4', planBuilder: '#22c55e',
};
export const SEAT_MAP: readonly SeatPosition[] = [
  { id: 'S1', role: 'decisionMaker', x: 50, y: 88, scale: 1.16, name: '主导位' },
  { id: 'S2', role: 'proposer', x: 26, y: 78, scale: 1.06, name: '讨论位 1' },
  { id: 'S3', role: 'proposer', x: 74, y: 78, scale: 1.06, name: '讨论位 2' },
  { id: 'S4', role: 'proposer', x: 10, y: 66, scale: 0.99, name: '讨论位 3' },
  { id: 'S5', role: 'proposer', x: 90, y: 66, scale: 0.99, name: '讨论位 4' },
  { id: 'S6', role: 'proposer', x: 23, y: 58, scale: 0.95, name: '讨论位 5' },
  { id: 'S7', role: 'reviewer', x: 77, y: 58, scale: 0.95, name: '评审位 1' },
  { id: 'S8', role: 'reviewer', x: 11, y: 52, scale: 0.90, name: '评审位 2' },
  { id: 'S9', role: 'reviewer', x: 89, y: 52, scale: 0.90, name: '评审位 3' },
  { id: 'S10', role: 'executor', x: 50, y: 46, scale: 1.04, name: '执行位' },
  { id: 'S11', role: 'verifier', x: 33, y: 50, scale: 0.90, name: '验证位 1' },
  { id: 'S12', role: 'verifier', x: 67, y: 50, scale: 0.90, name: '验证位 2' },
];

/** An existing run freezes identity and roles. Today's roster only previews the next run. */
export function participantsOf(run: StageRun | null, profiles: StageProfile[]): StageParticipant[] {
  if (run) return (run.participants ?? []).map((p) => {
    const profile = profiles.find((m) => m.id === p.profileId);
    const cost = run.cost?.byProfile?.find((m) => m.profileId === p.profileId);
    return { ...p, provider: cost?.provider || (p as StageParticipant).provider || profile?.provider, model: cost?.model || (p as StageParticipant).model || profile?.model };
  });
  return profiles.filter((p) => p.enabled !== false).map((p) => ({
    profileId: p.id, role: p.role, label: p.label || p.id, provider: p.provider, model: p.model, state: 'idle', phase: 'idle',
  }));
}

export function assignSeats(participants: StageParticipant[], preferences: Record<string, string> = {}) {
  const assigned = new Map<string, StageParticipant>();
  const overflow: StageParticipant[] = [];
  const seen = new Set<string>();
  for (const p of participants) {
    const seat = SEAT_MAP.find((s) => s.id === preferences[p.profileId] && s.role === p.role);
    if (seat && !assigned.has(seat.id) && !seen.has(p.profileId)) { assigned.set(seat.id, p); seen.add(p.profileId); }
  }
  for (const participant of participants) {
    if (seen.has(participant.profileId)) continue;
    seen.add(participant.profileId);
    const seat = SEAT_MAP.find((s) => s.role === participant.role && !assigned.has(s.id));
    if (seat) assigned.set(seat.id, participant);
    else overflow.push(participant);
  }
  return { assigned, overflow };
}

/** Same role-bearing seats, arranged along the far side of a long table. */
const LONG_ORDER = ['S4', 'S2', 'S6', 'S8', 'S11', 'S1', 'S10', 'S12', 'S7', 'S3', 'S5', 'S9'];
export const LONG_SEATS: readonly SeatPosition[] = LONG_ORDER.map((id, index) => ({
  ...SEAT_MAP.find((s) => s.id === id)!, x: 4.8 + index * 8.22, y: 72 + ([0, 1, -1][index % 3]), scale: id === 'S1' ? 1.08 : 1,
}));

/** Logical roles stay fixed; the visible composition depends only on this run's occupants. */
export function sceneLayout(assigned: Map<string, StageParticipant>, viewportWidth: number, stageHeight: number) {
  const occupied = LONG_SEATS.filter((s) => assigned.has(s.id));
  const lead = occupied.find((s) => s.role === 'decisionMaker');
  const ordered = occupied.filter((s) => s !== lead);
  if (lead) ordered.splice(Math.floor(ordered.length / 2), 0, lead);
  const count = ordered.length;
  const minWidth = Math.max(460, count * 78 + 64);
  const width = Math.max(minWidth, viewportWidth || 1000);
  const characterWidth = Math.max(90, Math.min(240, stageHeight * .84, (width - 80) / (Math.max(3, count) + .35) * 1.8));
  const stride = characterWidth * .55;
  const tableWidth = Math.min(width - 32, Math.max(350, (count + .85) * stride));
  return { count, minWidth, width, characterWidth, tableWidth, table: count <= 6 ? 'wood-short' as const : 'wood-long' as const,
    seats: ordered.map((s, i) => ({ ...s, x: 50 + (i - (count - 1) / 2) * stride / width * 100, y: 78, scale: 1 })),
    vacant: LONG_SEATS.filter((s) => !assigned.has(s.id)),
  };
}
