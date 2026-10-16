import type { PointerEvent, KeyboardEvent } from 'react';
import { ModelArt } from './art';
import type { ArtId } from './catalog';
import { ROLE_COLOR, ROLE_TEXT } from './layout';
import type { SeatPosition, StageParticipant, StageRun } from './layout';
import { activityText, VISUAL, visualState } from './state';

export function Seat({ seat, participant, identity, run, baseWidth, stageHeight, now, selected, hot, editable, gallery, onClick, onMenu, onHover, onPointer, onKey }: {
  seat: SeatPosition; participant?: StageParticipant; identity?: ArtId; run: StageRun | null; baseWidth: number; stageHeight: number; now: number;
  selected: boolean; hot: boolean; editable: boolean; gallery: boolean; onClick: () => void;
  onMenu: (x: number, y: number) => void; onHover: (id: string) => void;
  onPointer: (type: 'down' | 'move' | 'up' | 'cancel', event: PointerEvent<HTMLButtonElement>) => void;
  onKey: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const width = baseWidth * seat.scale, height = width;
  const state = participant ? visualState(participant, run) : 'idle', visual = VISUAL[state];
  const label = participant?.label || participant?.profileId || seat.name;
  const description = participant ? activityText(participant, run, now) : '空位';
  return <button type="button" className={'mmd-table-seat ' + (participant ? 'mmd-rt-actor mmd-rt-state-' + state : 'mmd-rt-vacant') + (selected ? ' is-selected' : '') + (hot ? ' is-drop-target' : '') + (editable ? ' is-editable' : '')}
    style={{ left: seat.x + '%', top: seat.y + '%', width, height }} data-seat={seat.id} data-profile={participant?.profileId} data-role={seat.role} data-state={participant ? state : undefined}
    aria-label={participant ? label + '，' + (gallery ? '形象预览' : ROLE_TEXT[seat.role]) + '，' + visual.label : seat.name + '，空位'} aria-pressed={selected}
    title={label + ' · ' + description + (editable ? ' · 拖动换位，右键编辑' : '')} onClick={onClick}
    onMouseEnter={() => onHover(participant?.profileId || '')} onMouseLeave={() => onHover('')}
    onContextMenu={(event) => { event.preventDefault(); onMenu(event.clientX, event.clientY); }}
    onPointerDown={(e) => onPointer('down', e)} onPointerMove={(e) => onPointer('move', e)} onPointerUp={(e) => onPointer('up', e)} onPointerCancel={(e) => onPointer('cancel', e)} onLostPointerCapture={(e) => onPointer('cancel', e)} onKeyDown={onKey}>
    <span className={'mmd-table-chair' + (seat.role === 'decisionMaker' ? ' is-lead' : '')} aria-hidden="true" />
    {participant ? <>
      <span className="mmd-table-sprite-mask" style={{ height: height * .82 }}>
        <span className={'mmd-rt-character mmd-rt-anim-' + visual.animation}><ModelArt identity={identity} participant={participant} state={state} width={width} seated /></span>
      </span>
      {['thinking','error','approval','executing'].includes(state) && visual.icon ? <span className="mmd-rt-badge" aria-hidden="true">{visual.icon}</span> : null}
      <span className="mmd-rt-caption" style={{ borderColor: ROLE_COLOR[seat.role] }}><b>{label}</b>{!gallery ? <small>{ROLE_TEXT[seat.role] + ' · ' + visual.label}</small> : null}</span>
    </> : <><span className="mmd-table-vacancy">＋</span><span className="mmd-rt-caption"><b>{seat.name}</b><small>{editable ? '点击入座' : '尚未入座'}</small></span></>}
  </button>;
}
