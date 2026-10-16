import type { ModelRole } from '../../lib/types/model-profile';
import { ROLE_COLOR } from './layout';
import { lookOf } from './palette';
import type { VisualState } from './state';

function Hair({ style, color }: { style: number; color: string }) {
  const paths = [
    'M26 57a34 34 0 0 1 68 0q-10-10-34-10T26 57Z',
    'M26 56l6-16 8 10 8-16 8 15 8-14 10 17 8-9 4 13Q60 22 26 56Z',
    'M27 56a33 33 0 0 1 66 0Q73 38 53 48T27 56Z',
    'M27 56a33 33 0 0 1 66 0Q60 35 27 56Z',
    'M32 50a30 30 0 0 1 56 0Q60 34 32 50Z',
    'M30 54a32 32 0 0 1 60 0Q60 42 30 54Z',
  ];
  return <g fill={color}>
    {style === 3 ? <ellipse cx="96" cy="72" rx="10" ry="18" /> : null}
    {style === 4 ? <circle cx="60" cy="21" r="10" /> : null}
    <path d={paths[style]} />
  </g>;
}

function Face({ state }: { state: VisualState }) {
  const happy = state === 'done' || state === 'celebrate';
  const closed = state === 'aborted';
  const thinking = state === 'thinking' || state === 'waiting';
  const focused = state === 'executing';
  const eye = state === 'error'
    ? <path d="M-5 0a5 5 0 1 1 5 5a3 3 0 1 1 3-3" fill="none" stroke="#242630" strokeWidth="2" />
    : happy ? <path d="M-5 2q5-8 10 0" fill="none" stroke="#242630" strokeWidth="2.5" strokeLinecap="round" />
    : closed ? <path d="M-5 0q5 4 10 0" fill="none" stroke="#242630" strokeWidth="2.5" strokeLinecap="round" />
    : thinking ? <path d="M-5 1q5-4 10 0" fill="none" stroke="#242630" strokeWidth="2.5" strokeLinecap="round" />
    : <g><circle r={state === 'ready' || state === 'approval' ? 6 : 5} fill="#242630" /><circle cx="-1.7" cy="-1.8" r="1.7" fill="white" /></g>;
  return <g>
    <g className={state === 'idle' || state === 'ready' ? 'mmd-rt-eyes' : undefined}>
      <g transform="translate(46 57)">{eye}</g><g transform="translate(74 57)">{eye}</g>
    </g>
    <g stroke="#46342c" strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d={focused ? 'M40 43l11 4M69 47l11-4' : state === 'error' ? 'M40 48l11-4M69 44l11 4' : 'M40 45h11M69 45h11'} />
    </g>
    <circle cx="36" cy="66" r="5" fill="#f08a8a" opacity=".35" /><circle cx="84" cy="66" r="5" fill="#f08a8a" opacity=".35" />
    {happy ? <path d="M50 71q10 17 20 0Z" fill="#923e35" />
      : state === 'error' || state === 'thinking' ? <path d="M53 74q3.5-4 7 0t7 0" fill="none" stroke="#a34a3a" strokeWidth="2.3" />
      : closed || focused || state === 'ready' ? <path d="M54 73h12" stroke="#a34a3a" strokeWidth="2.3" strokeLinecap="round" />
      : <circle cx="60" cy="74" r="2.8" fill="#a34a3a" />}
    {state === 'error' ? <path className="mmd-rt-sweat" d="M93 48q-10 16 0 16t0-16" fill="#7dd3fc" /> : null}
  </g>;
}

function Prop({ role, color }: { role: ModelRole; color: string }) {
  if (role === 'decisionMaker') return <g transform="rotate(-24 78 121)"><rect x="76" y="87" width="4" height="34" rx="2" fill="#dba64b" /><circle cx="78" cy="86" r="4" fill="#facc15" /></g>;
  if (role === 'proposer') return <g><rect x="88" y="76" width="3" height="44" rx="1.5" fill="#aab7c9" /><path d="M91 78l18 5-18 7Z" fill={color} stroke="#ffffff" strokeWidth=".6" /></g>;
  if (role === 'reviewer') return <g transform="translate(89 102)"><circle r="9" fill="#93c5fd" fillOpacity=".4" stroke="#d4dce8" strokeWidth="3" /><path d="M7 7l10 10" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" /></g>;
  if (role === 'executor') return <g><path d="M28 122l14-14m-10-3a7 7 0 0 0 10 10l-6-6 1-5Z" fill="none" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" /><rect x="42" y="117" width="36" height="8" rx="2" fill="#594939" /><rect x="55" y="117" width="10" height="8" fill="#d7bc75" /></g>;
  return <g transform="translate(86 98)"><rect width="22" height="28" rx="3" fill="#e5e7eb" stroke="#94a3b8" /><rect x="6" y="-2" width="10" height="5" rx="2" fill="#64748b" /><path d="M5 14l5 5 7-11" stroke="#16a34a" strokeWidth="2.7" fill="none" strokeLinecap="round" /></g>;
}

export function Chibi({ profileId, role, state, width }: { profileId: string; role: ModelRole; state: VisualState; width: number }) {
  const look = lookOf(profileId);
  const cloth = ROLE_COLOR[role];
  const happy = state === 'done' || state === 'celebrate';
  const armAngles = happy ? [150, -150] : state === 'thinking' || state === 'waiting' ? [-10, 118] : state === 'executing' ? [10, 60] : [-10, 10];
  return <svg viewBox="0 0 120 156" width={width} height={width * 1.3} aria-hidden="true" focusable="false" data-look={look.hairStyle + '-' + look.bodyWidth}>
    <ellipse cx="60" cy="148" rx="30" ry="6" fill="#000" opacity=".2" />
    <g data-layer="chair">
      {role === 'decisionMaker' ? <g><rect x="26" y="76" width="68" height="73" rx="19" fill="#2a3446" /><path d="M24 111h72" stroke="#617089" strokeWidth="9" strokeLinecap="round" /></g>
        : <path d="M34 148v-27a26 13 0 0 1 52 0v27" fill="#354256" />}
    </g>
    <g data-layer="legs" fill="#243348"><rect x="43" y="124" width="13" height="21" rx="5" /><rect x="64" y="124" width="13" height="21" rx="5" /></g>
    <g data-layer="arms">
      {[44, 76].map((x, i) => <g key={x} transform={'rotate(' + armAngles[i] + ' ' + x + ' 96)'}><rect x={x - 6} y="92" width="12" height="30" rx="6" fill={cloth} /><circle cx={x} cy="122" r="6" fill={look.skin} /></g>)}
    </g>
    <g data-layer="body"><rect x={60 - look.bodyWidth / 2} y="84" width={look.bodyWidth} height="46" rx="15" fill={cloth} stroke="#000" strokeOpacity=".2" /><path d="M50 86q10 8 20 0" stroke="white" strokeOpacity=".4" strokeWidth="2" fill="none" /></g>
    <g data-layer="prop"><Prop role={role} color={cloth} /></g>
    <g data-layer="head"><circle cx="60" cy="56" r="34" fill={look.skin} /><circle cx="26" cy="58" r="5" fill={look.skin} /><circle cx="94" cy="58" r="5" fill={look.skin} /><Hair style={look.hairStyle} color={look.hair} /><Face state={state} /></g>
    <g data-layer="role-badge"><circle cx="60" cy="104" r="7" fill="white" fillOpacity=".2" /><text x="60" y="108" textAnchor="middle" fontSize="11" fill="white">{role === 'decisionMaker' ? '★' : role === 'verifier' ? '✓' : '•'}</text></g>
  </svg>;
}
