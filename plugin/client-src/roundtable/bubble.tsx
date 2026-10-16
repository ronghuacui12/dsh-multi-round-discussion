import type { SeatPosition, StageParticipant, StageRun } from './layout';
import { activityText } from './state';

/** P0 shows phase actions only. Actual model text and transcript linking belong to P2/P3. */
export function ActivityBubble({ seat, participant, run, baseWidth, now }: {
  seat: SeatPosition; participant: StageParticipant; run: StageRun | null; baseWidth: number; now: number;
}) {
  return <div className="mmd-rt-activity" style={{
    left: Math.max(15, Math.min(85, seat.x)) + '%',
    top: 'max(34px, calc(' + seat.y + '% - ' + (baseWidth * seat.scale * 1.3 + 14) + 'px))',
  }} title={participant.label + ' · ' + activityText(participant, run, now)}>
    {activityText(participant, run, now)}
  </div>;
}
