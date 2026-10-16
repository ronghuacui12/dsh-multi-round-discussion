import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, subscribeEvents } from './api';
import { Avatar } from './avatar';

const PHASE_TEXT: Record<string, string> = {
  idle: '空闲', clarifying: '正在判断需求', 'awaiting-user': '等你补充信息',
  proposing: '讨论者独立提案中', reviewing: '互相评议中', deciding: '主导模型决策中',
  planning: '生成执行计划', executing: '执行中', verifying: '验证中', finalizing: '汇总答复',
  completed: '已完成', failed: '失败', stopped: '已停止',
};
const ROLE_TEXT: Record<string, string> = {
  decisionMaker: '主导模型', proposer: '讨论者', reviewer: '评审', executor: '执行模型', verifier: '验证',
};

/** Short local timestamp for the history picker. */
function stamp(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return '';
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Round number encoded in a proposal id (`proposal-r2-1`). */
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

/**
 * The discussion, rendered as a group chat: one bubble per contribution, in the
 * order the models actually produced them.
 */
export function DiscussionView() {
  const [runs, setRuns] = useState<any[]>([]);
  const [activeId, setActiveId] = useState('');
  const [run, setRun] = useState<any>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [clarify, setClarify] = useState('');
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      const data = await api.settings();
      const map: Record<string, string> = {};
      for (const profile of data.profiles ?? []) map[profile.id] = profile.label ?? profile.id;
      setNames(map);
      setAvatars(data.avatars ?? {});
    } catch { /* the roster is decoration; the run is the content */ }
  }, []);

  const loadRuns = useCallback(async (preferId?: string) => {
    try {
      const data = await api.runs();
      const list = data.runs ?? [];
      setRuns(list);
      // `??` would keep an empty string; an empty selection must still fall
      // through to the newest run, which is what the operator wants to see.
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
      items.push({ kind: 'divider', id: `d-propose-${round}`, text: `第 ${round} 轮 · 独立提案` });
      for (const proposal of proposals.filter((p) => roundOfProposal(p.id) === round)) {
        items.push({ kind: 'proposal', id: proposal.id, proposal, label: `P${indexOf.get(proposal.id)}` });
      }
      const roundReviews = reviews.filter((review) => review.round === round);
      if (roundReviews.length > 0) {
        items.push({ kind: 'divider', id: `d-review-${round}`, text: `第 ${round} 轮 · 互相评议` });
        for (const review of roundReviews) {
          items.push({
            kind: 'review', id: review.id, review,
            target: `P${indexOf.get(review.targetProposalId) ?? '?'}`,
          });
        }
      }
      const decision = decisions.find((d) => d.round === round);
      if (decision) items.push({ kind: 'decision', id: decision.id, decision });
    }
    if (bb.plan) items.push({ kind: 'plan', id: `plan-${bb.plan.id}`, plan: bb.plan });
    if (bb.execution) items.push({ kind: 'execution', id: `exec-${bb.execution.planId}`, execution: bb.execution });
    if (bb.verification) items.push({ kind: 'verification', id: `verify-${bb.verification.planId}`, verification: bb.verification });
    for (const notice of run.notices ?? []) {
      items.push({ kind: 'notice', id: notice.id, notice });
    }
    if (bb.finalAnswer) items.push({ kind: 'answer', id: 'answer', text: bb.finalAnswer });
    return items;
  }, [run]);

  useEffect(() => {
    const node = bodyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, run?.phase, run?.revision]);

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

  const control = async (payload: any) => {
    if (!run) return;
    try { await api.control(run.runId, payload); } catch (cause: any) { setError(String(cause?.message ?? cause)); }
  };

  const start = async () => {
    const request = draft.trim();
    if (!request) return;
    setBusy(true);
    setError('');
    try {
      const created = await api.start({ request });
      setDraft('');
      await loadRuns(created.run?.runId);
    } catch (cause: any) {
      setError(String(cause?.message ?? cause));
    } finally {
      setBusy(false);
    }
  };

  const thinking = (run?.participants ?? []).filter((p: any) => p.state === 'thinking');
  const awaitingApproval = run?.phase === 'planning' && !!run?.pendingQuestion;
  const awaitingUser = run?.phase === 'awaiting-user';
  const settled = ['completed', 'failed', 'stopped'].includes(run?.phase ?? '');

  return (
    <div className="mmd-root">
      <div className="mmd-chat">
        <div className="mmd-chat-head">
          <span className="mmd-chat-title">多模型研讨</span>
          {run ? <span className="mmd-chat-sub">{PHASE_TEXT[run.phase] ?? run.phase}</span> : null}
          <select className="mmd-select" value={activeId} onChange={(event) => setActiveId(event.target.value)}>
            {runs.length === 0 ? <option value="">（暂无研讨）</option> : null}
            {runs.map((item) => (
              <option key={item.runId} value={item.runId}>
                {stamp(item.startedAt)} · {(item.request ?? '').slice(0, 20)} · {PHASE_TEXT[item.phase] ?? item.phase}
              </option>
            ))}
          </select>
          <span className="mmd-spacer" />
          <button type="button" className="mmd-btn" disabled={!run || settled} onClick={() => void control({ kind: 'stop' })}>叫停</button>
          <button type="button" className="mmd-btn" disabled={!run || run.phase !== 'proposing'} onClick={() => void control({ kind: 'skip-review' })}>跳过评议</button>
          <button
            type="button"
            className="mmd-btn mmd-btn-danger"
            disabled={!run}
            title="从历史记录里删除这次研讨"
            onClick={() => { void removeRun(); }}
          >删除</button>
        </div>

        {/* The run is started here rather than from the session composer: the
            composer belongs to the chat tab and would send the text to the agent
            loop instead of to this plugin. */}
        <div className="mmd-compose">
          <input
            className="mmd-input"
            style={{ flex: 1 }}
            value={draft}
            placeholder="提出一个问题，让多个模型分别出方案、再互相评议…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void start(); } }}
          />
          <button type="button" className="mmd-btn mmd-btn-primary" disabled={busy || !draft.trim()} onClick={() => void start()}>
            {busy ? '发起中…' : '发起研讨'}
          </button>
        </div>

        {awaitingApproval ? (
          <div className="mmd-approve">
            <strong>计划已生成，等你批准</strong>
            <span className="mmd-chat-sub">批准后执行模型才会动手。</span>
            <span className="mmd-spacer" />
            <button type="button" className="mmd-btn mmd-btn-primary" onClick={() => void control({ kind: 'approve-plan' })}>批准并执行</button>
            <button type="button" className="mmd-btn mmd-btn-danger" onClick={() => void control({ kind: 'stop' })}>不执行</button>
          </div>
        ) : null}
        {awaitingUser ? (
          <div className="mmd-approve">
            <strong>需要补充信息</strong>
            <input className="mmd-input" style={{ flex: 1, minWidth: 200 }} value={clarify} onChange={(event) => setClarify(event.target.value)} placeholder={run?.pendingQuestion ?? ''} />
            <button type="button" className="mmd-btn mmd-btn-primary" onClick={() => { void control({ kind: 'supply-clarification', answer: clarify }); setClarify(''); }}>回答</button>
          </div>
        ) : null}

        <div className="mmd-chat-body" ref={bodyRef}>
          {error ? <div className="mmd-bubble mmd-bubble-sys mmd-bad">✕ {error}</div> : null}
          {!run ? (
            <div className="mmd-empty">
              <div style={{ fontWeight: 600, marginBottom: 6 }}>还没有研讨记录</div>
              <div>在下面输入一个问题，讨论者会分别独立提案，然后互相评议，最后由主导模型给出结论。</div>
            </div>
          ) : null}

          {messages.map((item) => {
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
                <div className="mmd-row" key={item.id}>
                  <Avatar seatKey={p.profileId} label={nameOf(p.profileId)} version={avatars[p.profileId]} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{nameOf(p.profileId)}</span>
                      <span className="mmd-tag">{ROLE_TEXT[roleOf(p.profileId)] ?? '提案'} · {item.label} · 信心 {Math.round((p.confidence ?? 0) * 100)}%</span>
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
                <div className="mmd-row" key={item.id}>
                  <Avatar seatKey={rv.reviewerProfileId} label={nameOf(rv.reviewerProfileId)} version={avatars[rv.reviewerProfileId]} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{nameOf(rv.reviewerProfileId)}</span>
                      <span className="mmd-tag">评议 {item.target} · 信心 {Math.round((rv.confidence ?? 0) * 100)}%</span>
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
                <div className="mmd-row" key={item.id}>
                  <Avatar seatKey={d.decisionMakerProfileId} label={nameOf(d.decisionMakerProfileId)} version={avatars[d.decisionMakerProfileId]} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{d.decisionMakerProfileId === 'user' ? '你' : nameOf(d.decisionMakerProfileId)}</span>
                      <span className="mmd-tag">拍板 · 采纳 {d.chosenProposalIds?.length ?? 0} 个方案</span>
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
                <div className="mmd-row" key={item.id}>
                  <Avatar seatKey={plan.planBuilderProfileId ?? '__plan'} label="计划" version={avatars[plan.planBuilderProfileId ?? '']} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{nameOf(plan.planBuilderProfileId)}</span>
                      <span className="mmd-tag">执行计划 · {plan.steps?.length ?? 0} 步{plan.mutatesState ? ' · 会改变系统状态' : ''}</span>
                    </div>
                    <div className="mmd-bubble">
                      {(plan.steps ?? []).map((step: any, index: number) => (
                        <div key={step.id} style={{ marginBottom: 6 }}>
                          <strong>{index + 1}. {step.description}</strong>
                          {step.tool ? <span className="mmd-tag">（{step.tool}）</span> : null}
                          {step.acceptance ? <div className="mmd-sec-label">验收：{step.acceptance}</div> : null}
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
                <div className="mmd-row" key={item.id}>
                  <Avatar seatKey={execution.executorProfileId ?? '__exec'} label="执行" version={avatars[execution.executorProfileId ?? '']} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{nameOf(execution.executorProfileId)}</span>
                      <span className="mmd-tag">执行结果 · {execution.status}{execution.stoppedReason ? ` · ${execution.stoppedReason}` : ''}</span>
                    </div>
                    <div className="mmd-bubble mmd-bubble-exec">
                      {(execution.outputs ?? []).map((output: any, index: number) => (
                        <div key={output.stepId} style={{ marginBottom: 6 }}>
                          <strong>第 {index + 1} 步 · {output.status}</strong>
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
                <div className="mmd-row" key={item.id}>
                  <Avatar seatKey={verification.verifierProfileId ?? '__verify'} label="验证" version={avatars[verification.verifierProfileId ?? '']} />
                  <div className="mmd-col">
                    <div className="mmd-meta">
                      <span className="mmd-name">{verification.verifierProfileId ? nameOf(verification.verifierProfileId) : '验证'}</span>
                      <span className="mmd-tag">{verification.passed ? '通过' : '未通过'} · {verification.recommendedAction}</span>
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
              return <div className="mmd-row" key={item.id}><div className="mmd-col" style={{ maxWidth: '100%' }}><div className="mmd-bubble mmd-bubble-sys">{item.notice.message}</div></div></div>;
            }
            if (item.kind === 'answer') {
              return (
                <div className="mmd-row" key={item.id}>
                  <Avatar seatKey={run?.blackboard?.decision?.decisionMakerProfileId ?? '__lead'} label="主导" version={avatars[run?.blackboard?.decision?.decisionMakerProfileId ?? '']} />
                  <div className="mmd-col">
                    <div className="mmd-meta"><span className="mmd-name">主导模型</span><span className="mmd-tag">最终答复</span></div>
                    <div className="mmd-bubble mmd-bubble-lead">{item.text}</div>
                  </div>
                </div>
              );
            }
            return null;
          })}

          {thinking.length > 0 ? (
            <div className="mmd-row">
              <Avatar seatKey={thinking[0].profileId} label={nameOf(thinking[0].profileId)} version={avatars[thinking[0].profileId]} />
              <div className="mmd-col">
                <div className="mmd-thinking">
                  <span className="mmd-dot" />
                  {thinking.map((p: any) => nameOf(p.profileId)).join('、')} 正在思考…
                </div>
              </div>
            </div>
          ) : null}
        </div>


      </div>

      {run ? (
        <div className="mmd-cost">
          <h4>用量</h4>
          <div>总 token：{run.cost?.totalTokens ?? 0}</div>
          <div>成本：${(run.cost?.totalCostUsd ?? 0).toFixed(4)}</div>
          <div className="mmd-bar">
            <i style={{ width: `${Math.min(100, run.cost?.budget?.maxTotalTokens ? (run.cost.totalTokens / run.cost.budget.maxTotalTokens) * 100 : 0)}%` }} />
          </div>
          <table>
            <thead><tr><th>模型</th><th>调用</th><th>token</th></tr></thead>
            <tbody>
              {(run.cost?.byProfile ?? []).map((row: any) => (
                <tr key={row.profileId}>
                  <td title={`${row.provider}/${row.model}`}>{row.label ?? row.profileId}</td>
                  <td>{row.calls}</td>
                  <td>{row.inputTokens + row.outputTokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 style={{ marginTop: 16 }}>参与模型</h4>
          {(run.participants ?? []).map((p: any) => (
            <div key={p.profileId} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
              <span className={`mmd-dot mmd-dot-${p.state === 'thinking' ? '' : p.state}`} />
              <span>{nameOf(p.profileId)}</span>
              <span className="mmd-tag">{ROLE_TEXT[p.role] ?? p.role}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
