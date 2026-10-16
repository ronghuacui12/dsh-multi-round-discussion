import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { ModelProfile } from '../../lib/types/model-profile';
import { api } from '../api';
import { ActivityBubble } from './bubble';
import { assignSeats, LONG_SEATS, participantsOf, ROLE_TEXT, SEAT_MAP, sceneLayout } from './layout';
import type { SeatPosition, StageParticipant, StageProfile, StageRun } from './layout';
import { Seat } from './seat';
import { activityText, VISUAL, visualState } from './state';
import { artOf, artUrl, MODEL_ART, readArtAssignments, saveArtAssignments } from './catalog';
import type { ArtId } from './catalog';
import { ModelArt } from './art';
import { EditDrawer } from './edit-drawer';
import type { ProviderEntry } from './edit-drawer';
import { SeatPicker } from './seat-picker';
import { TableDialog } from './dialog';
import { fingerprint, isRunning, moveProfiles, nextProfileId, readSeatPrefs, saveSeatPrefs, validateRoster } from './roster';
import { latestSpeech } from './speech';

export type ViewMode = 'split' | 'table' | 'chat';
const HEIGHT_KEY = 'dsh-mmd.roundtable.height', MODE_KEY = 'dsh-mmd.roundtable.mode';
export function readViewMode(): ViewMode { try { const v = localStorage.getItem(MODE_KEY); if (v === 'table' || v === 'chat') return v; } catch {} return 'split'; }
export function saveViewMode(mode: ViewMode) { try { localStorage.setItem(MODE_KEY, mode); } catch {} }
function readHeight() { try { const v = Number(localStorage.getItem(HEIGHT_KEY)); if (Number.isFinite(v) && v >= 25 && v <= 65) return v; } catch {} return 54; }
type Tab = 'live' | 'roster' | 'gallery';
type Editing = { original?: ModelProfile; draft: ModelProfile; appearance?: ArtId; seatId?: string };

export function Roundtable({ run, profiles, mode, providers = [], preset = 'balanced', onSettings, onJump, highlightedProfile = '', onHover }: {
  run: StageRun | null; profiles: StageProfile[]; mode: ViewMode; providers?: ProviderEntry[]; preset?: string;
  onSettings?: (data: any) => void; onJump?: (id: string) => void; highlightedProfile?: string; onHover?: (id: string) => void;
}) {
  const [height, setHeight] = useState(readHeight), [size, setSize] = useState({ height: 300, width: 1200 });
  const [now, setNow] = useState(Date.now), [visible, setVisible] = useState(true);
  const [tab, setTab] = useState<Tab>('live'), [selected, setSelected] = useState('');
  const [artwork, setArtwork] = useState(readArtAssignments), [preferences, setPreferences] = useState(readSeatPrefs);
  const [picker, setPicker] = useState<SeatPosition | null>(null), [editing, setEditing] = useState<Editing | null>(null);
  const [moving, setMoving] = useState<string | null>(null), [removing, setRemoving] = useState<ModelProfile | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<{ source: string; target: string } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [status, setStatus] = useState(''), [tableFailed, setTableFailed] = useState(false);
  const stageRef = useRef<HTMLElement>(null), lock = useRef(false), clickBlockedUntil = useRef(0);
  const splitterDrag = useRef<{ pointer: number; y: number; height: number; available: number } | null>(null);
  const actorDrag = useRef<{ pointer: number; id: string; x: number; y: number; moved: boolean; target: string } | null>(null);
  const historical = tab === 'live' ? run : null, locked = isRunning(run), editable = tab === 'roster' && !locked && !busy;
  const gallery = useMemo<StageParticipant[]>(() => ['step','mimo','qwen','claude','gemini','chatgpt','deepseek','glm','kimi','grok','minimax','doubao'].map((id, i) => { const a = MODEL_ART.find((a) => a.id === id)!; return { profileId: '__art-' + a.id, label: a.name, role: LONG_SEATS[i].role, model: a.id, provider: a.id, state: 'idle', phase: 'idle' }; }), []);
  const participants = useMemo(() => tab === 'gallery' ? gallery : participantsOf(historical, profiles), [tab, gallery, historical, profiles]);
  const { assigned, overflow } = useMemo(() => assignSeats(participants, tab === 'gallery' ? Object.fromEntries(gallery.map((p, i) => [p.profileId, LONG_SEATS[i].id])) : preferences), [participants, tab, gallery, preferences]);
  const active = participants.some((p) => ['thinking', 'executing'].includes(visualState(p, historical)));
  const selectedParticipant = participants.find((p) => p.profileId === selected), selectedProfile = profiles.find((p) => p.id === selected);
  const latest = selectedParticipant ? latestSpeech(selectedParticipant, historical) : '';
  useEffect(() => {
    const node = stageRef.current; if (!node) return;
    const measure = () => setSize({ height: Math.max(180, node.querySelector('.mmd-table-scroll')?.clientHeight || node.clientHeight - 60), width: node.clientWidth }); measure();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }
    const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect();
  }, [tab, mode]);
  useEffect(() => {
    const node = stageRef.current; if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); observer.observe(node); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!active || !visible || mode === 'chat') return;
    setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer);
  }, [active, visible, mode, run?.runId]);
  useEffect(() => {
    const close = (e: Event) => { if (!(e.target as Element)?.closest?.('.mmd-table-context')) setMenu(null); };
    const key = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { setMenu(null); setSelected(''); } };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key); };
  }, []);
  const composition = useMemo(() => sceneLayout(assigned, size.width, size.height), [assigned, size]);
  const baseWidth = composition.characterWidth, bb = historical?.blackboard;
  const approval = historical?.phase === 'planning' && !!historical.pendingQuestion;
  const bubbles = composition.seats.filter((s) => { const p = assigned.get(s.id); return p && ['thinking', 'executing', 'approval'].includes(visualState(p, historical)); }).slice(0, 3);
  const switchTab = (next: Tab) => { setTab(next); setSelected(''); setMenu(null); setError(''); onHover?.(''); };
  const updateHeight = (v: number) => { const n = Math.max(25, Math.min(65, Math.round(v))); setHeight(n); try { localStorage.setItem(HEIGHT_KEY, String(n)); } catch {} };
  const updatePreferences = (next: Record<string, string>) => { setPreferences(next); saveSeatPrefs(next); };
  async function mutate(transform: (current: ModelProfile[]) => ModelProfile[], success: () => void) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setStatus('');
    try {
      const [fresh, live] = await Promise.all([api.settings(), api.runs()]);
      if ((live.runs ?? []).some(isRunning)) throw new Error('有研讨正在运行，结束后再修改阵容。');
      const next = transform(fresh.profiles ?? []); validateRoster(next);
      const result = await api.saveSettings({ profiles: next }); onSettings?.(result);
      setStatus(result.warnings?.length ? result.warnings.join('；') : '已保存，下次研讨生效。'); success();
    } catch (cause: any) { setError(String(cause?.message ?? cause)); }
    finally { lock.current = false; setBusy(false); }
  }
  function newModel(seat?: SeatPosition, identity?: ArtId) {
    if (locked || busy) { setError('研讨运行中，请结束后再修改阵容。'); return; }
    const occupied = assignSeats(participantsOf(null, profiles), preferences).assigned;
    const target = seat || LONG_SEATS.find((s) => !occupied.has(s.id) && s.role === 'proposer') || LONG_SEATS.find((s) => !occupied.has(s.id));
    if (!target) { setError('座位已满；可以编辑或移出现有模型。'); return; }
    const art = MODEL_ART.find((a) => a.id === identity); let provider = '', model = '';
    for (const route of providers) { const found = route.models?.find((m) => art?.match.test(m.id)); if (found) { provider = route.id; model = found.id; break; } }
    setEditing({ draft: { id: nextProfileId(profiles), label: art?.name || '', role: target.role, provider, model, temperature: .4, enabled: true }, appearance: identity, seatId: target.id });
    setPicker(null); setMenu(null); setError('');
  }
  function editProfile(id: string) {
    const p = profiles.find((m) => m.id === id);
    if (!p || locked) { setError(locked ? '运行期间只读；结束后可编辑。' : '这个模型已不在当前阵容中。'); return; }
    setTab('roster'); setEditing({ original: p, draft: { ...p }, appearance: artwork[p.id] }); setMenu(null); setSelected(''); setError('');
  }
  function moveTo(sourceId: string, seat: SeatPosition) {
    if (!editable) { setError('切到「布置阵容」后可换位；运行期间只读。'); return; }
    const source = profiles.find((p) => p.id === sourceId), target = assigned.get(seat.id);
    if (!source || sourceId === target?.profileId) { setMoving(null); return; }
    const oldSeat = [...assigned].find(([, p]) => p.profileId === sourceId)?.[0];
    const done = () => { const next = { ...preferences, [sourceId]: seat.id }; if (target && oldSeat) next[target.profileId] = oldSeat; updatePreferences(next); setMoving(null); setSelected(sourceId); };
    if (source.role === seat.role) { done(); setStatus('座位顺序已保存。'); return; }
    void mutate((fresh) => { if (fresh.find((p) => p.id === sourceId)?.role !== source.role) throw new Error('源模型职责已变更，请重新读取阵容。'); return moveProfiles(fresh, sourceId, seat.role, target?.profileId); }, done);
  }
  function chooseProfile(profile: ModelProfile) {
    if (!picker) return;
    if (profile.enabled !== false) { moveTo(profile.id, picker); setPicker(null); return; }
    const target = picker;
    void mutate((fresh) => { if (!fresh.some((p) => p.id === profile.id)) throw new Error('这个模型已被移出，请重新读取阵容。'); return fresh.map((p) => p.id === profile.id ? { ...p, enabled: true, role: target.role } : p); }, () => { updatePreferences({ ...preferences, [profile.id]: target.id }); setPicker(null); });
  }
  function saveProfile(draft: ModelProfile, appearance?: ArtId) {
    const edit = editing; if (!edit) return;
    void mutate((fresh) => {
      const existing = fresh.find((p) => p.id === draft.id);
      if (edit.original && (!existing || fingerprint(existing) !== fingerprint(edit.original))) throw new Error('此模型已被其他界面修改，请关闭面板重新读取。');
      if (!edit.original && existing) throw new Error('模型 ID 已被占用，请重新新建。');
      return edit.original ? fresh.map((p) => p.id === draft.id ? { ...existing, ...draft } : p) : [...fresh, draft];
    }, () => { const next = { ...artwork }; if (appearance) next[draft.id] = appearance; else delete next[draft.id]; setArtwork(next); saveArtAssignments(next);
      if (edit.seatId && SEAT_MAP.find((s) => s.id === edit.seatId)?.role === draft.role) updatePreferences({ ...preferences, [draft.id]: edit.seatId }); setEditing(null); setTab('roster'); });
  }
  function pointer(seat: SeatPosition, type: 'down' | 'move' | 'up' | 'cancel', e: PointerEvent<HTMLButtonElement>) {
    const actor = assigned.get(seat.id);
    if (type === 'down') { if (!editable || !actor || e.button !== 0) return; actorDrag.current = { pointer: e.pointerId, id: actor.profileId, x: e.clientX, y: e.clientY, moved: false, target: '' }; e.currentTarget.setPointerCapture?.(e.pointerId); return; }
    const d = actorDrag.current; if (!d || d.pointer !== e.pointerId) return;
    if (type === 'move') { if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 7 && !d.moved) return; d.moved = true; d.target = document.elementFromPoint?.(e.clientX, e.clientY)?.closest('[data-seat]')?.getAttribute('data-seat') || ''; setDragging({ source: d.id, target: d.target }); e.preventDefault(); return; }
    actorDrag.current = null; setDragging(null); if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (d.moved) { clickBlockedUntil.current = Date.now() + 300; const destination = SEAT_MAP.find((s) => s.id === d.target); if (type === 'up' && destination) moveTo(d.id, destination); }
  }
  return <>
    <section ref={stageRef} className={'mmd-rt-stage mmd-longtable-stage' + (approval ? ' mmd-rt-awaiting' : '') + (!visible ? ' mmd-rt-paused' : '')} aria-label="模型研讨长桌" style={{ flexBasis: height + '%' }}>
      <div className="mmd-table-topbar"><div className="mmd-table-tabs" role="group" aria-label="舞台内容">{([['live', '本次研讨'], ['roster', '布置阵容'], ['gallery', '十二模型形象']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={tab === value} className={tab === value ? 'is-on' : ''} onClick={() => switchTab(value)}>{label}</button>)}</div><span className="mmd-table-help">{tab === 'gallery' ? '形象展示，不调用模型' : locked ? '研讨中 · 阵容只读' : tab === 'roster' ? '拖动换位 · 右键编辑' : '点击人物查看发言'}</span>{tab === 'roster' ? <button type="button" className="mmd-table-add" disabled={locked || busy} onClick={() => { const vacancy = composition.vacant[0]; if (vacancy) { setPicker(vacancy); setError(''); } else setStatus('座位已满，可编辑现有模型。'); }}>＋ 添加模型</button> : null}</div>
      <div className="mmd-rt-summary"><b>{tab === 'gallery' ? '模型形象库' : tab === 'roster' ? '下次研讨阵容' : '长桌研讨'}</b><span>{assigned.size + ' / 12 入座'}</span>{bb ? <span>{(bb.proposals?.length ?? 0) + ' 提案 · ' + (bb.reviews?.length ?? 0) + ' 评议' + (bb.plan ? ' · ' + (bb.plan.steps?.length ?? 0) + ' 步计划' : '')}</span> : <span>{tab === 'roster' ? '仅修改下次研讨' : '当前启用阵容'}</span>}</div>
      <div className="mmd-table-scroll"><div className="mmd-table-scene" data-count={composition.count} data-table={composition.table} style={{ minWidth: composition.minWidth, '--mmd-character-width': baseWidth + 'px', '--mmd-table-width': composition.tableWidth + 'px' } as any}>
        <div className="mmd-table-room" aria-hidden="true" style={{ backgroundImage: `url("${artUrl('room')}")` }} /><div className="mmd-rt-floor" />
        <div className={'mmd-table-furniture' + (tableFailed ? ' is-fallback' : '')} aria-hidden="true">{!tableFailed ? <img key={composition.table} src={artUrl(composition.table)} alt="" draggable={false} onLoad={() => setTableFailed(false)} onError={() => setTableFailed(true)} /> : <span />}</div>
        {composition.seats.map((seat) => { const i = LONG_SEATS.findIndex((s) => s.id === seat.id); const p = assigned.get(seat.id); return <Seat key={seat.id} seat={seat} participant={p} identity={p ? artOf(p, artwork) : undefined} run={historical} baseWidth={baseWidth} stageHeight={size.height} now={now} selected={!!p && (p.profileId === selected || p.profileId === highlightedProfile)} hot={dragging?.target === seat.id} editable={editable} gallery={tab === 'gallery'}
          onHover={(id) => { if (tab === 'live') onHover?.(id); }} onClick={() => { if (Date.now() < clickBlockedUntil.current) return; setMenu(null); if (p) setSelected(p.profileId); else if (editable) { setPicker(seat); setError(''); } else if (tab === 'live' && !locked) { switchTab('roster'); setStatus('已切到下次研讨阵容，请选择空位。'); } }}
          onMenu={(x, y) => { if (!p) { if (editable) setPicker(seat); return; } const r = stageRef.current?.parentElement?.getBoundingClientRect(); setMenu({ id: p.profileId, x: Math.max(6, Math.min(x - (r?.left || 0), (r?.width || 600) - 206)), y: Math.max(6, Math.min(y - (r?.top || 0), (r?.height || 500) - 250)) }); }}
          onPointer={(type, e) => pointer(seat, type, e)} onKey={(e) => { if (e.altKey && p && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); moveTo(p.profileId, LONG_SEATS[(i + (e.key === 'ArrowRight' ? 1 : 11)) % 12]); } }} />; })}
        {bubbles.map((seat) => <ActivityBubble key={seat.id} seat={seat} participant={assigned.get(seat.id)!} run={historical} baseWidth={baseWidth * .72} now={now} />)}
        {!composition.count ? <div className="mmd-table-empty-scene">还没有参与模型，可以到「布置阵容」添加。</div> : null}
      </div></div>
      {tab === 'roster' && composition.vacant.length ? <div className="mmd-table-vacancies" aria-label="空闲职责位"><span>空闲职责</span>{composition.vacant.map((seat) => <button type="button" key={seat.id} data-seat={seat.id} className={dragging?.target === seat.id ? 'is-drop-target' : ''} disabled={!editable} onClick={() => { setPicker(seat); setError(''); }}>{seat.name + ' ＋'}</button>)}</div> : null}
      {overflow.length ? <div className="mmd-rt-overflow" role="status">{'未入座：' + overflow.map((p) => p.label || p.profileId).join('、')}</div> : null}
    </section>
    <div className="mmd-table-notice" aria-live="polite">{error ? <span className="mmd-bad" role="alert">{error}</span> : status || (tab === 'roster' ? (preset === 'deep' ? '深度模式：最多 5 位讨论、3 位评审与 1 位验证参与；另一验证位作为候选。' : '快速/平衡/自定义模式会选取部分阵容；可在设置中切到深度模式。') : '人物形象与实际 Provider 分开配置，未配置的模型不会被调用。')}{dragging ? <b>{' → ' + (SEAT_MAP.find((s) => s.id === dragging.target)?.name || '选择目标座位')}</b> : null}</div>
    <div className="mmd-rt-splitter" role="separator" aria-label="调整长桌高度" aria-orientation="horizontal" tabIndex={0} aria-valuemin={25} aria-valuemax={65} aria-valuenow={height} aria-valuetext={height + '%'}
      onPointerDown={(e) => { const available = stageRef.current?.parentElement?.clientHeight || 0; if (e.button !== 0 || !available) return; splitterDrag.current = { pointer: e.pointerId, y: e.clientY, height, available }; e.currentTarget.setPointerCapture?.(e.pointerId); e.preventDefault(); }} onPointerMove={(e) => { const d = splitterDrag.current; if (d?.pointer === e.pointerId) updateHeight(d.height + (e.clientY - d.y) / d.available * 100); }} onPointerUp={() => { splitterDrag.current = null; }} onLostPointerCapture={() => { splitterDrag.current = null; }} onPointerCancel={() => { splitterDrag.current = null; }} onKeyDown={(e) => { if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) { e.preventDefault(); updateHeight(e.key === 'Home' ? 25 : e.key === 'End' ? 65 : height + (e.key === 'ArrowUp' ? -5 : 5)); } }}><i /></div>
    <div className="mmd-rt-compact" aria-label="研讨角色状态">{participants.map((p) => <button type="button" key={p.profileId} onClick={() => setSelected(p.profileId)}>{p.label + ' · ' + VISUAL[visualState(p, historical)].label}</button>)}</div>
    {selectedParticipant ? <div className="mmd-table-inspector" role="region" aria-label="人物信息"><button type="button" className="mmd-table-close" onClick={() => setSelected('')} aria-label="关闭人物信息">×</button><div className="mmd-table-person"><ModelArt identity={artOf(selectedParticipant, artwork)} participant={selectedParticipant} width={90} /><div><b>{selectedParticipant.label}</b><small>{tab === 'gallery' ? '形象库 · 未连接 API' : ROLE_TEXT[selectedParticipant.role] + ' · ' + activityText(selectedParticipant, historical, now)}</small><small>{tab === 'gallery' ? '' : (selectedParticipant.provider || '') + ' / ' + (selectedParticipant.model || '')}</small></div></div>
      {latest ? <p className="mmd-table-last-speech">{latest.slice(0, 600)}</p> : <p>{tab === 'gallery' ? '可将此形象用于已配置的模型，或新建一个模型配置。' : '本次还没有发言。'}</p>}
      <div className="mmd-table-inspector-actions">{latest ? <button type="button" className="mmd-btn mmd-btn-sm" onClick={() => { onJump?.(selectedParticipant.profileId); setSelected(''); }}>定位最近发言</button> : null}{tab === 'gallery' ? <button type="button" className="mmd-btn mmd-btn-sm mmd-btn-primary" disabled={locked || busy} onClick={() => newModel(undefined, artOf(selectedParticipant, {}))}>配置此模型</button> : <button type="button" className="mmd-btn mmd-btn-sm" disabled={locked || busy || !selectedProfile} onClick={() => editProfile(selected)}>编辑下次阵容</button>}{editable && selectedProfile ? <button type="button" className="mmd-btn mmd-btn-sm" onClick={() => setMoving(selected)}>换座位…</button> : null}</div>
    </div> : null}
    {menu ? <div className="mmd-table-context" role="menu" aria-label="人物操作" style={{ left: menu.x, top: menu.y }}>
      <button type="button" role="menuitem" onClick={() => { setSelected(menu.id); setMenu(null); }}>查看模型信息</button><button type="button" role="menuitem" disabled={locked || busy || !profiles.some((p) => p.id === menu.id)} onClick={() => editProfile(menu.id)}>编辑信息与形象…</button><button type="button" role="menuitem" disabled={!editable} onClick={() => { setMoving(menu.id); setMenu(null); }}>换座位 / 交换职责…</button><button type="button" role="menuitem" disabled={tab !== 'live'} onClick={() => { onJump?.(menu.id); setMenu(null); }}>定位最近发言</button>
      <button type="button" role="menuitem" disabled={!editable} onClick={() => { const id = menu.id; void mutate((fresh) => fresh.map((p) => p.id === id ? { ...p, enabled: false } : p), () => setSelected('')); setMenu(null); }}>暂时离席</button><button type="button" role="menuitem" className="mmd-bad" disabled={!editable} onClick={() => { setRemoving(profiles.find((p) => p.id === menu.id) || null); setMenu(null); }}>移出阵容…</button>
    </div> : null}
    {picker ? <SeatPicker seat={picker} profiles={profiles} artwork={artwork} busy={busy} error={error} onChoose={chooseProfile} onNew={(id) => newModel(picker, id)} onClose={() => !busy && setPicker(null)} /> : null}
    {editing ? <EditDrawer key={editing.draft.id} profile={editing.draft} providers={providers} appearance={editing.appearance} saving={busy} error={error} onSave={saveProfile} onClose={() => !busy && setEditing(null)} /> : null}
    {moving ? <TableDialog title="换座位 / 交换职责" onClose={() => setMoving(null)}><div className="mmd-table-picker"><p>有人的座位会交换职责；空位会变更职责。</p><div className="mmd-table-destinations">{LONG_SEATS.map((s) => <button type="button" className="mmd-btn" key={s.id} disabled={busy} onClick={() => moveTo(moving, s)}>{s.name + ' · ' + (assigned.get(s.id)?.label || '空位')}</button>)}</div>{error ? <p className="mmd-bad" role="alert">{error}</p> : null}</div></TableDialog> : null}
    {removing ? <TableDialog title="移出阵容" onClose={() => setRemoving(null)}><div className="mmd-table-picker"><p>{'将「' + (removing.label || removing.id) + '」从下次阵容中移出？历史记录会保留。'}</p><button type="button" className="mmd-btn mmd-btn-danger" disabled={busy} onClick={() => void mutate((fresh) => fresh.filter((p) => p.id !== removing.id), () => { setRemoving(null); setSelected(''); })}>确认移出</button>{error ? <p className="mmd-bad" role="alert">{error}</p> : null}</div></TableDialog> : null}
  </>;
}
