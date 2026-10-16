import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, subscribeEvents } from './api';
import { Avatar } from './avatar';
import { Roundtable, readViewMode, saveViewMode } from './roundtable';
import type { ViewMode } from './roundtable';

const PHASE_TEXT: Record<string, string> = {
  idle: '空闲', clarifying: '正在判断需求', 'awaiting-user': '等你补充信息',
  proposing: '讨论者独立提案中', reviewing: '互相评议中', deciding: '主导模型决策中',
  planning: '生成执行计划', executing: '执行中', verifying: '验证中', finalizing: '汇总答复',
  completed: '已完成', failed: '失败', stopped: '已停止',
};
const ROLE_TEXT: Record<string, string> = {
  decisionMaker: '主导模型', proposer: '讨论者', reviewer: '评审', executor: '执行模型', verifier: '验证',
};

/** The pipeline, in the order a run walks it. Drives the phase rail. */
const STEPS: { key: string; label: string; icon: string }[] = [
  { key: 'proposing', label: '提案', icon: '1' },
  { key: 'reviewing', label: '互评', icon: '2' },
  { key: 'deciding', label: '决策', icon: '3' },
  { key: 'planning', label: '计划', icon: '4' },
  { key: 'executing', label: '执行', icon: '5' },
  { key: 'verifying', label: '验证', icon: '6' },
  { key: 'finalizing', label: '汇总', icon: '7' },
];
const PHASE_ORDER: Record<string, number> = {
  idle: -1, clarifying: -1, 'awaiting-user': -1,
  proposing: 0, reviewing: 1, deciding: 2, planning: 3,
  executing: 4, verifying: 5, finalizing: 6, completed: 7, failed: 7, stopped: 7,
};

/** Which phase chip style to use. */
function chipClass(phase: string): string {
  if (phase === 'completed') return 'mmd-phase-chip is-done';
  if (phase === 'failed' || phase === 'stopped') return 'mmd-phase-chip is-bad';
  if (phase === 'planning') return 'mmd-phase-chip is-warn';
  return 'mmd-phase-chip';
}

/** Short local timestamp for the history picker. */
function stamp(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return '';
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Round number encoded in a proposal id (proposal-r2-1). */
function roundOfProposal(id: string): number {
  const match = /^proposal-r(\d+)-/.exec(id);
  return match ? Number(match[1]) : 1;
}

function Section(props: { label: string; values?: string[] }) {
  const { label, values } = props;
  if (!values || values.length === 0) return null;
  return (
    <section>
      <div className="mmd-sec-label">{label}</div>
      <ul>{values.map((value, index) => <li key={index}>{value}</li>)}</ul>
    </section>
  );
}

/** The 1-to-7 progress rail. */
function PhaseRail(props: { phase: string; awaitingApproval: boolean }) {
  const current = PHASE_ORDER[props.phase] ?? -1;
  const failed = props.phase === 'failed' || props.phase === 'stopped';
  return (
    <div className="mmd-rail" role="list">
      {STEPS.map((step, index) => {
        let cls = 'mmd-step';
        if (index < current) cls = 'mmd-step is-done';
        else if (index === current) cls = 'mmd-step is-now';
        const mark = index < current ? '✓' : (failed && index === current ? '✕' : step.icon);
        return (
          <div className={cls} key={step.key} role="listitem">
            <span className="mmd-step-dot">{mark}</span>
            <span>{step.key === 'planning' && props.awaitingApproval ? '等你批准' : step.label}</span>
            {index < STEPS.length - 1 ? <span className="mmd-step-line" /> : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The discussion, rendered as a group chat: one bubble per contribution, in the
 * order the models actually produced them.
 *
 * The composer and the approval gate live in the BOTTOM dock, and the approval
 * also renders inline at the end of the transcript, so an operator never has to
 * scroll back up to find the approve control.
 */
export function DiscussionView() {
  const [runs, setRuns] = useState<any[]>([]);
  const [activeId, setActiveId] = useState('');
  const [run, setRun] = useState<any>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [hoveredProfile, setHoveredProfile] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [clarify, setClarify] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [stick, setStick] = useState(true);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyMetadata = useCallback((data: any) => {
    const map: Record<string, string> = {};
    for (const p of data.profiles ?? []) map[p.id] = p.label ?? p.id;
    setNames(map); setProfiles(data.profiles ?? []); setAvatars(data.avatars ?? {}); setMetadata(data);
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const data = await api.settings();
      applyMetadata(data);
    } catch { /* the roster is decoration; the run is the content */ }
  }, [applyMetadata]);

  const loadRuns = useCallback(async (preferId?: string) => {
    try {
      const data = await api.runs();
      const list = data.runs ?? [];
      setRuns(list);
      setActiveId((current) => preferId || current || (list[0]?.runId ?? ''));
    } catch (cause: any) {
      setError(String(cause?.message ?? cause));
    }
  }, []);

  useEffect(() => { void loadMeta(); void loadRuns(); }, [loadMeta, loadRuns]);

  useEffect(() => {
    const off = subscribeEvents(
      (list) => setRuns(list),
      (next) => {
        setRuns((current) => [next, ...current.filter((r) => r.runId !== next.runId)]);
        setRun((current: any) => (current && current.runId === next.runId ? next : current));
      },
    );
    const timer = setInterval(() => { void loadRuns(); void loadMeta(); }, 4000);
    return () => { off(); clearInterval(timer); };
  }, [loadRuns, loadMeta]);

  useEffect(() => {
    if (!activeId) { setRun(null); return; }
    let alive = true;
    const pull = () => api.run(activeId).then((data) => { if (alive) setRun(data.run); }).catch(() => {});
    void pull();
    const timer = setInterval(pull, 1500);
    return () => { alive = false; clearInterval(timer); };
  }, [activeId]);

  const nameOf = (profileId: string) => names[profileId] ?? run?.participants?.find((p: any) => p.profileId === profileId)?.label ?? profileId;
  const roleOf = (profileId: string) => run?.participants?.find((p: any) => p.profileId === profileId)?.role ?? '';

  // ------------------------------------------------------------------ messages
  const messages = useMemo(() => {
    if (!run) return [] as any[];
    const bb = run.blackboard ?? {};
    const proposals: any[] = bb.proposals ?? [];
    const reviews: any[] = bb.reviews ?? [];
    const decisions: any[] = bb.decisions ?? (bb.decision ? [bb.decision] : []);
    const items: any[] = [];
    items.push({ kind: 'request', id: 'request', text: run.request });
    const rounds = [...new Set(proposals.map((p) => roundOfProposal(p.id)))].sort((a, b) => a - b);
    const indexOf = new Map(proposals.map((p, index) => [p.id, index + 1]));
    for (const round of rounds) {
      items.push({ kind: 'divider', id: 'd-propose-' + round, text: '第 ' + round + ' 轮 · 独立提案' });
      for (const proposal of proposals.filter((p) => roundOfProposal(p.id) === round)) {
        items.push({ kind: 'proposal', id: proposal.id, proposal, label: 'P' + indexOf.get(proposal.id) });
      }
      const roundReviews = reviews.filter((review) => review.round === round);
      if (roundReviews.length > 0) {
        items.push({ kind: 'divider', id: 'd-review-' + round, text: '第 ' + round + ' 轮 · 互相评议' });
        for (const review of roundReviews) {
          items.push({
            kind: 'review', id: review.id, review,
            target: 'P' + (indexOf.get(review.targetProposalId) ?? '?'),
          });
        }
      }
      const decision = decisions.find((d) => d.round === round);
      if (decision) items.push({ kind: 'decision', id: decision.id, decision });
    }
    if (bb.plan) items.push({ kind: 'plan', id: 'plan-' + bb.plan.id, plan: bb.plan });
    if (bb.execution) items.push({ kind: 'execution', id: 'exec-' + bb.execution.planId, execution: bb.execution });
    if (bb.verification) items.push({ kind: 'verification', id: 'verify-' + bb.verification.planId, verification: bb.verification });
    for (const notice of run.notices ?? []) {
      items.push({ kind: 'notice', id: notice.id, notice });
    }
    if (bb.finalAnswer) items.push({ kind: 'answer', id: 'answer', text: bb.finalAnswer });
    return items;
  }, [run]);

  const awaitingApproval = run?.phase === 'planning' && !!run?.pendingQuestion;
  const awaitingUser = run?.phase === 'awaiting-user';

  /** Keep the newest content in view unless the operator scrolled up. */
  const scrollToEnd = useCallback((force?: boolean) => {
    const node = bodyRef.current;
    if (!node) return;
    if (force || stick) node.scrollTop = node.scrollHeight;
  }, [stick]);

  useEffect(() => { scrollToEnd(); }, [messages.length, run?.phase, run?.revision, scrollToEnd]);
  // A plan gate must be impossible to miss: pin to the bottom the moment it opens.
  useEffect(() => { if (awaitingApproval || awaitingUser) scrollToEnd(true); }, [awaitingApproval, awaitingUser, scrollToEnd]);

  const onScroll = () => {
    const node = bodyRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    setStick(distance < 60);
  };

  useEffect(() => () => { if (highlightTimer.current) clearTimeout(highlightTimer.current); }, []);
  const jumpToProfile = (profileId: string) => {
    setViewMode('split'); saveViewMode('split'); setStick(false);
    const jump = () => {
      const rows = [...(bodyRef.current?.querySelectorAll<HTMLElement>('[data-model]') ?? [])].filter((row) => row.dataset.model === profileId);
      const last = rows.at(-1); if (!last) return;
      bodyRef.current?.querySelectorAll('.mmd-message-highlight').forEach((row) => row.classList.remove('mmd-message-highlight'));
      last.scrollIntoView?.({ block: 'center', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      last.classList.add('mmd-message-highlight');
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => last.classList.remove('mmd-message-highlight'), 2000);
    };
    if (window.requestAnimationFrame) window.requestAnimationFrame(jump); else setTimeout(jump, 0);
  };

  const control = async (payload: any) => {
    if (!run) return;
    try { await api.control(run.runId, payload); } catch (cause: any) { setError(String(cause?.message ?? cause)); }
  };

  /** Delete this run from the on-disk history and from the live list. */
  const removeRun = async () => {
    if (!run) return;
    try {
      await api.removeRun(run.runId);
      const list = (await api.runs()).runs ?? [];
      setRuns(list);
      setActiveId(list[0]?.runId ?? '');
      setRun(null);
    } catch (cause: any) { setError(String(cause?.message ?? cause)); }
  };

  const start = async () => {
    const request = draft.trim();
    if (!request) return;
    setBusy(true);
    setError('');
    try {
      const created = await api.start({ request });
      setDraft('');
      setStick(true);
      await loadRuns(created.run?.runId);
    } catch (cause: any) {
      setError(String(cause?.message ?? cause));
    } finally {
      setBusy(false);
    }
  };

  /** Open the inline plan editor, seeded from the generated plan's steps. */
  const openPlanEditor = () => {
    setViewMode('split');
    saveViewMode('split');
    const steps = run?.blackboard?.plan?.steps ?? [];
    setEditText(steps.map((step: any) => step.description ?? '').join('\n'));
    setEditing(true);
    scrollToEnd(true);
  };

  const submitPlanEdit = async () => {
    const plan = run?.blackboard?.plan;
    if (!plan) return;
    const descriptions = editText.split('\n').map((line) => line.trim()).filter(Boolean);
    if (descriptions.length === 0) { setError('计划不能为空。'); return; }
    const base = plan.steps ?? [];
    const nextSteps = base.map((step: any, index: number) => ({
      ...step,
      description: descriptions[index] ?? step.description,
    }));
    for (let index = base.length; index < descriptions.length; index++) {
      nextSteps.push({ id: 'step-edit-' + (index + 1), description: descriptions[index] });
    }
    setEditing(false);
    await control({ kind: 'edit-plan', plan: { ...plan, steps: nextSteps.slice(0, descriptions.length) } });
  };

  const thinking = (run?.participants ?? []).filter((p: any) => p.state === 'thinking');
  const settled = ['completed', 'failed', 'stopped'].includes(run?.phase ?? '');
  const tokenRatio = run?.cost?.budget?.maxTotalTokens ? (run.cost.totalTokens / run.cost.budget.maxTotalTokens) : 0;

  /** The approval body, shared by the docked bar and the inline card. */
  const approvalActions = (
    <div className="mmd-approve-actions">
      <button type="button" className="mmd-btn mmd-btn-primary" onClick={() => void control({ kind: 'approve-plan' })}>
        ✓ 批准并执行
      </button>
      <button type="button" className="mmd-btn" onClick={openPlanEditor}>✎ 改一下计划</button>
      <button type="button" className="mmd-btn mmd-btn-danger" onClick={() => void control({ kind: 'stop' })}>✕ 不执行</button>
    </div>
  );

  return (
    <div className={'mmd-root mmd-discussion mmd-view-' + viewMode}>
      <div className="mmd-chat">
        <div className="mmd-head">
          <span className="mmd-title"><span className="mmd-title-dot" />多模型研讨</span>
          {run ? <span className={chipClass(run.phase)}>{PHASE_TEXT[run.phase] ?? run.phase}</span> : null}
          {thinking.length > 0 ? <span className="mmd-sub">· {thinking.length} 个模型在思考</span> : null}
          <span className="mmd-spacer" />
          <select className="mmd-select" value={activeId} onChange={(event) => setActiveId(event.target.value)}>
            {runs.length === 0 ? <option value="">（暂无研讨）</option> : null}
            {runs.map((item) => (
              <option key={item.runId} value={item.runId}>
                {stamp(item.startedAt) + ' · ' + (item.request ?? '').slice(0, 20) + ' · ' + (PHASE_TEXT[item.phase] ?? item.phase)}
              </option>
            ))}
          </select>
          <button type="button" className="mmd-btn mmd-btn-sm" disabled={!run || settled} onClick={() => void control({ kind: 'stop' })}>叫停</button>
          <button type="button" className="mmd-btn mmd-btn-sm" disabled={!run || run.phase !== 'proposing'} onClick={() => void control({ kind: 'skip-review' })}>跳过评议</button>
          <button type="button" className="mmd-btn mmd-btn-sm mmd-btn-danger" disabled={!run} title="从历史记录里删除这次研讨" onClick={() => void removeRun()}>删除</button>
        </div>

        <div className="mmd-rt-toolbar">
          <div className="mmd-seg" role="group" aria-label="研讨视图">
            {([['split', '长桌 + 对话'], ['table', '只看长桌'], ['chat', '只看对话']] as const).map(([mode, label]) => (
              <button type="button" key={mode} aria-pressed={viewMode === mode} className={viewMode === mode ? 'is-on' : ''}
                onClick={() => { setViewMode(mode); saveViewMode(mode); }}>{label}</button>
            ))}
          </div>
          <span className="mmd-sub mmd-rt-toolbar-hint">十二模型 · 长桌研讨室</span>
        </div>

        {error ? <div className="mmd-alert is-bad" role="alert"><span>✕</span><span>{error}</span></div> : null}
        <div className="mmd-discussion-content">
        <Roundtable run={run} profiles={profiles} mode={viewMode} providers={metadata?.providers ?? []} preset={metadata?.preset} onSettings={applyMetadata} onJump={jumpToProfile} highlightedProfile={hoveredProfile} onHover={setHoveredProfile} />
        {run ? <PhaseRail phase={run.phase} awaitingApproval={awaitingApproval} /> : null}

        <div className="mmd-body" ref={bodyRef} onScroll={onScroll} onMouseOver={(event) => setHoveredProfile((event.target as Element).closest<HTMLElement>('[data-model]')?.dataset.model || '')} onMouseLeave={() => setHoveredProfile('')}>
          {!run ? (
            <div className="mmd-empty">
              <div className="mmd-empty-badge">🗣</div>
              <div className="mmd-empty-title">还没有研讨记录</div>
              <div>在下面的输入框提一个问题：讨论者会分别独立提案，然后互相评议，最后由主导模型给出结论与执行计划。</div>
            </div>
          ) : null}

          {messages.map((item) => {
            const author = item.proposal?.profileId || item.review?.reviewerProfileId || item.decision?.decisionMakerProfileId || item.plan?.planBuilderProfileId || item.execution?.executorProfileId || item.verification?.verifierProfileId || (item.kind === 'answer' ? run?.participants?.find((p: any) => p.role === 'decisionMaker')?.profileId : '');
            if (item.kind === 'divider') return <div className="mmd-divider" key={item.id}>{item.text}</div>;
            if (item.kind === 'request') {
              return (
                <div className="mmd-row mmd-row-mine" key={item.id}>
                  <Avatar seatKey="__user" label="我" />
                  <div className="mmd-col">
                    <div className="mmd-meta"><span className="mmd-name">我</span><span className="mmd-tag">提问</span></div>
                    <div className="mmd-bubble mmd-bubble-mine">{item.text}</div>
                  </div>
                </div>
              );
            }
            if (item.kind === 'proposal') {
              const p = item.proposal;
              return (
                <div className="mmd-row" key={item.id} data-model={author}>
                  <Avatar seatKey={p.profileId} label={nameOf(p.profileId)} version={avatars[p.profileId]} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{nameOf(p.profileId)}</span>
                      <span className="mmd-pill">{item.label}</span>
                      <span className="mmd-tag">{(ROLE_TEXT[roleOf(p.profileId)] ?? '提案') + ' · 信心 ' + Math.round((p.confidence ?? 0) * 100) + '%'}</span>
                    </div>
                    <div className="mmd-bubble">
                      <div className="mmd-bubble-title">{p.summary}</div>
                      {p.plan}
                      <Section label="理由" values={p.reasons} />
                      <Section label="风险" values={p.risks} />
                      <Section label="依赖" values={p.dependencies} />
                    </div>
                  </div>
                </div>
              );
            }
            if (item.kind === 'review') {
              const rv = item.review;
              return (
                <div className="mmd-row" key={item.id} data-model={author}>
                  <Avatar seatKey={rv.reviewerProfileId} label={nameOf(rv.reviewerProfileId)} version={avatars[rv.reviewerProfileId]} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{nameOf(rv.reviewerProfileId)}</span>
                      <span className="mmd-pill">评议 {item.target}</span>
                      <span className="mmd-tag">{'信心 ' + Math.round((rv.confidence ?? 0) * 100) + '%'}</span>
                    </div>
                    <div className="mmd-bubble">
                      <Section label="认可" values={rv.pros} />
                      <Section label="质疑" values={rv.cons} />
                      <Section label="建议" values={rv.suggestions} />
                    </div>
                  </div>
                </div>
              );
            }
            if (item.kind === 'decision') {
              const d = item.decision;
              return (
                <div className="mmd-row" key={item.id} data-model={author}>
                  <Avatar seatKey={d.decisionMakerProfileId} label={nameOf(d.decisionMakerProfileId)} version={avatars[d.decisionMakerProfileId]} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{d.decisionMakerProfileId === 'user' ? '你' : nameOf(d.decisionMakerProfileId)}</span>
                      <span className="mmd-pill">拍板</span>
                      <span className="mmd-tag">{'采纳 ' + (d.chosenProposalIds?.length ?? 0) + ' 个方案'}</span>
                    </div>
                    <div className="mmd-bubble mmd-bubble-lead">
                      <div className="mmd-bubble-title">结论方向</div>
                      {d.finalDirection}
                      <Section label="取舍理由" values={[d.rationale]} />
                    </div>
                  </div>
                </div>
              );
            }
            if (item.kind === 'plan') {
              const plan = item.plan;
              return (
                <div className="mmd-row" key={item.id} data-model={author}>
                  <Avatar seatKey={plan.planBuilderProfileId ?? '__plan'} label="计划" version={avatars[plan.planBuilderProfileId ?? '']} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{nameOf(plan.planBuilderProfileId)}</span>
                      <span className="mmd-pill">执行计划</span>
                      <span className="mmd-tag">{(plan.steps?.length ?? 0) + ' 步' + (plan.mutatesState ? ' · 会改变系统状态' : ' · 只读')}</span>
                    </div>
                    <div className="mmd-bubble">
                      {(plan.steps ?? []).map((step: any, index: number) => (
                        <div key={step.id} style={{ marginBottom: 7 }}>
                          <strong>{index + 1 + '. ' + step.description}</strong>
                          {step.tool ? <span className="mmd-tag">{'（' + step.tool + '）'}</span> : null}
                          {step.acceptance ? <div className="mmd-sec-label">{'验收：' + step.acceptance}</div> : null}
                        </div>
                      ))}
                      {plan.notes ? <Section label="说明" values={[plan.notes]} /> : null}
                    </div>
                  </div>
                </div>
              );
            }
            if (item.kind === 'execution') {
              const execution = item.execution;
              return (
                <div className="mmd-row" key={item.id} data-model={author}>
                  <Avatar seatKey={execution.executorProfileId ?? '__exec'} label="执行" version={avatars[execution.executorProfileId ?? '']} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{nameOf(execution.executorProfileId)}</span>
                      <span className="mmd-pill">执行结果</span>
                      <span className="mmd-tag">{execution.status + (execution.stoppedReason ? ' · ' + execution.stoppedReason : '')}</span>
                    </div>
                    <div className="mmd-bubble mmd-bubble-exec">
                      {(execution.outputs ?? []).map((output: any, index: number) => (
                        <div key={output.stepId} style={{ marginBottom: 7 }}>
                          <strong>{'第 ' + (index + 1) + ' 步 · ' + output.status}</strong>
                          {output.error ? <div className="mmd-bad">{output.error}</div> : null}
                          {output.rendered ? <div>{String(output.rendered).slice(0, 1200)}</div> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            if (item.kind === 'verification') {
              const verification = item.verification;
              return (
                <div className="mmd-row" key={item.id} data-model={author}>
                  <Avatar seatKey={verification.verifierProfileId ?? '__verify'} label="验证" version={avatars[verification.verifierProfileId ?? '']} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{verification.verifierProfileId ? nameOf(verification.verifierProfileId) : '验证'}</span>
                      <span className="mmd-pill">{verification.passed ? '通过' : '未通过'}</span>
                      <span className="mmd-tag">{verification.recommendedAction}</span>
                    </div>
                    <div className="mmd-bubble">
                      <Section label="问题" values={verification.issues} />
                      <Section label="建议" values={verification.suggestions} />
                      {verification.skipped ? <div className="mmd-sec-label">（本次未实际验证）</div> : null}
                    </div>
                  </div>
                </div>
              );
            }
            if (item.kind === 'notice') {
              return <div className="mmd-row" key={item.id} data-model={author}><div className="mmd-col" style={{ maxWidth: '100%' }}><div className="mmd-bubble mmd-bubble-sys">{item.notice.message}</div></div></div>;
            }
            if (item.kind === 'answer') {
              return (
                <div className="mmd-row" key={item.id} data-model={author}>
                  <Avatar seatKey={run?.blackboard?.decision?.decisionMakerProfileId ?? '__lead'} label="主导" version={avatars[run?.blackboard?.decision?.decisionMakerProfileId ?? '']} />
                  <div className="mmd-col">
                    <div className="mmd-meta"><span className="mmd-name">主导模型</span><span className="mmd-pill">最终答复</span></div>
                    <div className="mmd-bubble mmd-bubble-lead">{item.text}</div>
                  </div>
                </div>
              );
            }
            return null;
          })}

          {/* Inline gate: sits right under the plan, at the end of the transcript. */}
          {awaitingApproval && !editing ? (
            <div className="mmd-approve-card">
              <h5>计划已生成，等你批准</h5>
              <p>批准后执行模型才会动手；不批准则整次研讨到此结束，不会改动任何东西。</p>
              {approvalActions}
            </div>
          ) : null}

          {editing ? (
            <div className="mmd-approve-card">
              <h5>修改执行计划</h5>
              <p>一行一步，改完直接批准执行（会按修改后的计划走）。</p>
              <textarea
                className="mmd-textarea"
                style={{ width: '100%', minHeight: 120, marginBottom: 10 }}
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
              />
              <div className="mmd-approve-actions">
                <button type="button" className="mmd-btn mmd-btn-primary" onClick={() => void submitPlanEdit()}>保存并批准执行</button>
                <button type="button" className="mmd-btn" onClick={() => setEditing(false)}>取消</button>
              </div>
            </div>
          ) : null}

          {thinking.length > 0 ? (
            <div className="mmd-row">
              <Avatar seatKey={thinking[0].profileId} label={nameOf(thinking[0].profileId)} version={avatars[thinking[0].profileId]} />
              <div className="mmd-col">
                <div className="mmd-thinking">
                  <span className="mmd-dot" />
                  {thinking.map((p: any) => nameOf(p.profileId)).join('、') + ' 正在思考…'}
                </div>
              </div>
            </div>
          ) : null}

          {!stick && messages.length > 0 ? (
            <button type="button" className="mmd-fab" onClick={() => { setStick(true); scrollToEnd(true); }}>↓ 跳到最新</button>
          ) : null}
        </div>
        </div>

        {/* Bottom dock: the gate, the clarification box and the composer all live here. */}
        <div className="mmd-foot">
          {awaitingApproval ? (
            <div className="mmd-approve-bar mmd-pulse">
              <span className="mmd-approve-icon">⏸</span>
              <span className="mmd-approve-text">
                <b>计划已生成，等你批准</b>
                <span>批准后执行模型才会动手，不批准则什么都不改。</span>
              </span>
              <span className="mmd-spacer" />
              {approvalActions}
            </div>
          ) : null}

          {awaitingUser ? (
            <div className="mmd-approve-bar is-ask">
              <span className="mmd-approve-icon">❓</span>
              <span className="mmd-approve-text">
                <b>需要补充信息</b>
                <span>{run?.pendingQuestion ?? ''}</span>
              </span>
              <input
                className="mmd-input"
                style={{ flex: '1 1 220px', minWidth: 200 }}
                value={clarify}
                onChange={(event) => setClarify(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') { void control({ kind: 'supply-clarification', answer: clarify }); setClarify(''); } }}
                placeholder="补充一句就好…"
              />
              <button
                type="button"
                className="mmd-btn mmd-btn-primary"
                onClick={() => { void control({ kind: 'supply-clarification', answer: clarify }); setClarify(''); }}
              >
                回答
              </button>
            </div>
          ) : null}

          <div className="mmd-compose">
            <input
              className="mmd-input"
              value={draft}
              placeholder="提出一个问题，让多个模型分别出方案、再互相评议…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void start(); } }}
            />
            <button type="button" className="mmd-btn mmd-btn-primary" disabled={busy || !draft.trim()} onClick={() => void start()}>
              {busy ? '发起中…' : '发起研讨'}
            </button>
          </div>
        </div>
      </div>

      {run ? (
        <aside className="mmd-side">
          <h4>用量</h4>
          <div className="mmd-stat">
            <span>总 token</span>
            <b>{(run.cost?.totalTokens ?? 0).toLocaleString()}</b>
            <div className={'mmd-bar' + (tokenRatio > 0.8 ? ' is-hot' : '')}>
              <i style={{ width: Math.min(100, tokenRatio * 100) + '%' }} />
            </div>
            <span>{'预算 ' + (run.cost?.budget?.maxTotalTokens ?? 0).toLocaleString()}</span>
          </div>
          <div className="mmd-stat">
            <span>成本</span>
            <b>{'$' + (run.cost?.totalCostUsd ?? 0).toFixed(4)}</b>
          </div>
          <h4>分模型</h4>
          <table className="mmd-cost-table">
            <thead><tr><th>模型</th><th>调用</th><th>token</th></tr></thead>
            <tbody>
              {(run.cost?.byProfile ?? []).map((row: any) => (
                <tr key={row.profileId}>
                  <td title={row.provider + '/' + row.model}>{row.label ?? row.profileId}</td>
                  <td>{row.calls}</td>
                  <td>{row.inputTokens + row.outputTokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 style={{ marginTop: 16 }}>参与模型</h4>
          {(run.participants ?? []).map((p: any) => (
            <div className="mmd-participant" key={p.profileId}>
              <span className={'mmd-dot mmd-dot-' + (p.state === 'thinking' ? '' : p.state)} />
              <span>{nameOf(p.profileId)}</span>
              <span className="mmd-tag">{ROLE_TEXT[p.role] ?? p.role}</span>
            </div>
          ))}
        </aside>
      ) : null}
    </div>
  );
}
