import type { ModelProfile } from '../../lib/types/model-profile';
import type { SeatPosition } from './layout';
import { ROLE_TEXT } from './layout';
import { MODEL_ART, artOf } from './catalog';
import type { ArtId } from './catalog';
import { ModelArt } from './art';
import { TableDialog } from './dialog';

export function SeatPicker({ seat, profiles, artwork, busy, error, onChoose, onNew, onClose }: {
  seat: SeatPosition; profiles: ModelProfile[]; artwork: Record<string, ArtId>; busy: boolean; error: string;
  onChoose: (profile: ModelProfile) => void; onNew: (identity?: ArtId) => void; onClose: () => void;
}) {
  return <TableDialog title={'选择入座 · ' + seat.name} onClose={onClose}>
    <div className="mmd-table-picker"><p>已有模型会移到{ROLE_TEXT[seat.role]}位；有人的目标会交换职责。</p>
      {profiles.map((p) => <button type="button" className="mmd-table-pick-profile" key={p.id} disabled={busy} onClick={() => onChoose(p)}>
        <ModelArt identity={artOf(p, artwork)} participant={{ profileId: p.id, label: p.label || p.id, role: p.role, state: 'idle', phase: 'idle' }} width={44} />
        <span><b>{p.label || p.id}</b><small>{p.provider + ' / ' + p.model}</small><small>{(p.enabled === false ? '已离席 · ' : '') + ROLE_TEXT[p.role]}</small></span>
      </button>)}
      <h4>新建模型 · 选择形象</h4><p>需要选择宿主已注册的 Provider；不会自动接入未配置的 API。</p>
      <div className="mmd-table-art-grid">{MODEL_ART.map((a) => <button type="button" key={a.id} disabled={busy} onClick={() => onNew(a.id)}>
        <ModelArt identity={a.id} participant={{ profileId: a.id, label: a.name, role: seat.role, state: 'idle', phase: 'idle' }} width={70} /><span>{a.name}</span>
      </button>)}</div>
      <button type="button" className="mmd-btn" onClick={() => onNew()} disabled={busy}>＋ 其他模型</button>
      {error ? <p className="mmd-bad" role="alert">{error}</p> : null}
    </div>
  </TableDialog>;
}
