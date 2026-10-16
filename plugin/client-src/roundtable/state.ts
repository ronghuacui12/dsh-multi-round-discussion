import type { StageParticipant, StageRun } from './layout';

export type VisualState = 'idle' | 'ready' | 'thinking' | 'waiting' | 'done' | 'approval' | 'executing' | 'error' | 'aborted' | 'celebrate';
export const VISUAL: Record<VisualState, { label: string; icon: string; animation: string }> = {
  idle: { label: '等待派发', icon: '', animation: 'breath' },
  ready: { label: '准备开始', icon: '⌛', animation: 'breath' },
  thinking: { label: '思考中', icon: '···', animation: 'sway' },
  waiting: { label: '等待其他模型', icon: '', animation: 'breath' },
  done: { label: '发言完成', icon: '✓', animation: 'pop' },
  approval: { label: '等你批准', icon: '❗', animation: 'breath' },
  executing: { label: '执行中', icon: '⚙', animation: 'work' },
  error: { label: '出错', icon: '✕', animation: 'shake' },
  aborted: { label: '已叫停', icon: '—', animation: '' },
  celebrate: { label: '研讨完成', icon: '🎉', animation: 'pop' },
};
const ROLE_PHASES: Record<string, string[]> = {
  decisionMaker: ['clarifying', 'deciding', 'planning', 'finalizing'],
  proposer: ['proposing', 'reviewing'], reviewer: ['reviewing'],
  executor: ['executing'], verifier: ['verifying'],
};
export const ACTION_TEXT: Record<string, string> = {
  clarifying: '正在判断需求', proposing: '正在独立提案', reviewing: '正在交叉评议',
  deciding: '正在比较方案', planning: '正在生成计划', executing: '正在执行计划',
  verifying: '正在检查结果', finalizing: '正在汇总答复',
};

export function visualState(p: StageParticipant, run: StageRun | null): VisualState {
  if (p.state === 'error') return 'error';
  if (p.state === 'aborted') return 'aborted';
  if (run?.phase === 'stopped') return 'aborted';
  if (run?.phase === 'completed') return 'celebrate';
  // A failed run can leave other participants marked thinking; freeze them without blaming them.
  if (run?.phase === 'failed') return p.state === 'done' ? 'done' : 'waiting';
  if (run?.phase === 'planning' && run.pendingQuestion) return p.role === 'decisionMaker' ? 'approval' : 'waiting';
  if (run?.phase === 'awaiting-user') return 'waiting';
  if (p.state === 'thinking') return p.role === 'executor' && run?.phase === 'executing' ? 'executing' : 'thinking';
  if (p.state === 'done') return 'done';
  if (run && ROLE_PHASES[p.role]?.includes(run.phase)) return 'ready';
  if (run?.participants?.some((other) => other.state === 'thinking')) return 'waiting';
  return 'idle';
}

export function activityText(p: StageParticipant, run: StageRun | null, now: number): string {
  const state = visualState(p, run);
  if (state === 'thinking' || state === 'executing') {
    const action = ACTION_TEXT[p.phase || run?.phase || ''] ?? '正在思考';
    const seconds = Number.isFinite(p.startedAt) ? Math.max(0, Math.floor((now - p.startedAt!) / 1000)) : null;
    return action + '…' + (seconds === null ? '' : ' ' + seconds + 's');
  }
  if (state === 'error') return p.error || '本次调用出错';
  return VISUAL[state].label;
}
