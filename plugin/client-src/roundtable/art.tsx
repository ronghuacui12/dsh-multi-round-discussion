import { useEffect, useState } from 'react';
import { artUrl } from './catalog';
import type { ArtId } from './catalog';
import { Chibi } from './chibi';
import type { StageParticipant } from './layout';
import type { VisualState } from './state';

export function ModelArt({ identity, participant, width, state = 'idle', seated = false }: {
  identity?: ArtId; participant: StageParticipant; width: number; state?: VisualState; seated?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [identity]);
  if (!identity || failed) return <div className="mmd-model-art mmd-art-fallback" style={{ width, height: width * 1.125 }}>
    <Chibi profileId={participant.profileId} role={participant.role} state={state} width={width * .86} />
  </div>;
  return <img className="mmd-model-art" src={artUrl(seated ? `seated-${identity}` : identity)} style={{ width, height: width * (seated ? 1 : 1.125) }}
    alt="" draggable={false} onError={() => setFailed(true)} data-art={identity} />;
}
