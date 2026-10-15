import { useEffect, useState } from 'react';

/** Stable colour per seat, so a missing image still looks deliberate. */
const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

function hueFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/**
 * A participant's avatar.
 *
 * The image is read from the plugin's own route keyed by profile id, so a seat
 * keeps its picture even when the model behind it changes. When no image has
 * been uploaded the initial is shown on a colour derived from the seat key.
 */
export function Avatar(props: { seatKey: string; label: string; size?: number; version?: string }) {
  const { seatKey, label, size = 38, version } = props;
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [version, seatKey]);
  const initial = (label || seatKey || '?').trim().slice(0, 1).toUpperCase();
  const src = version
    ? `/dsh-mmd/avatars/${encodeURIComponent(seatKey)}?v=${encodeURIComponent(version)}`
    : `/dsh-mmd/avatars/${encodeURIComponent(seatKey)}`;
  return (
    <div className="mmd-avatar" style={{ width: size, height: size, background: hueFor(seatKey), fontSize: Math.round(size * 0.42) }}>
      {broken ? initial : <img src={src} alt={label} onError={() => setBroken(true)} />}
    </div>
  );
}
