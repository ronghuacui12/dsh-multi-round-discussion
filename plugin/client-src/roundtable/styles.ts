export const ROUNDTABLE_CSS = `
.mmd-discussion { container: mmd-discussion / inline-size; }
.mmd-discussion-content { display:flex; flex-direction:column; flex:1 1 0; min-height:0; overflow:hidden; position:relative; isolation:isolate; }
.mmd-discussion .mmd-body { flex:1 1 0; min-height:0; }
.mmd-rt-toolbar { display:flex; align-items:center; gap:12px; padding:8px 18px; border-bottom:1px solid var(--mmd-line); flex:0 0 auto; }
.mmd-rt-toolbar .mmd-seg button { padding:4px 12px; font-size:11.5px; }
.mmd-rt-stage { min-height:0; flex:0 0 54%; overflow:hidden; position:relative; display:flex; flex-direction:column; background:var(--mmd-bg); }
.mmd-table-topbar { display:flex; align-items:center; gap:12px; padding:7px 14px 4px; flex:0 0 auto; z-index:1; }
.mmd-table-tabs { display:flex; gap:4px; }
.mmd-table-tabs button { font:inherit; color:var(--mmd-muted); background:transparent; border:1px solid transparent; border-radius:7px; padding:4px 10px; font-size:11px; cursor:pointer; }
.mmd-table-tabs button.is-on { color:var(--mmd-accent); background:var(--mmd-accent-soft); border-color:#8b8db830; font-weight:650; }
.mmd-table-help { margin-left:auto; font-size:10px; color:var(--mmd-muted); }
.mmd-table-add { border:1px solid var(--mmd-line); border-radius:999px; background:var(--mmd-bg); color:var(--mmd-accent); padding:4px 9px; font:inherit; font-size:10px; cursor:pointer; white-space:nowrap; }
.mmd-rt-summary { display:flex; gap:10px; align-items:center; padding:0 16px 5px; font-size:10px; color:var(--mmd-muted); flex:0 0 auto; }
.mmd-rt-summary b { font-weight:600; color:var(--mmd-fg); }
.mmd-rt-summary span:last-child { margin-left:auto; }
.mmd-table-scroll { flex:1 1 0; min-height:0; overflow:auto; display:flex; align-items:stretch; overscroll-behavior:contain; scrollbar-width:thin; background:#f4ebe4; }
.mmd-table-scene { height:100%; min-height:180px; position:relative; flex:1 0 auto; isolation:isolate; overflow:hidden; }
.mmd-table-room { position:absolute; inset:0; z-index:0; background-color:#f6eadd; background-size:cover; background-position:center 48%; pointer-events:none; }
.mmd-table-room::after { content:''; position:absolute; inset:0; background:linear-gradient(#fff7eb10,#fff5e61c 55%,#f3e6d326); }
.mmd-rt-floor { position:absolute; left:15%; width:70%; height:20%; bottom:0; border-radius:50%; background:radial-gradient(ellipse,#6b473c28,transparent 72%); pointer-events:none; }
.mmd-table-furniture { position:absolute; left:50%; width:var(--mmd-table-width); top:calc(78% - var(--mmd-character-width) * .18); transform:translateX(-50%); z-index:30; pointer-events:none; filter:drop-shadow(0 4px 3px #6c49361c); }
.mmd-table-furniture img { width:100%; height:auto; display:block; transform:scaleY(.5); transform-origin:center top; }
.mmd-table-furniture.is-fallback { height:27%; border-radius:9px; border:1px solid #c79d75; background:linear-gradient(#f7dfb8 0 72%,#b68159 73% 85%,transparent 86%); }
.mmd-table-seat { position:absolute; z-index:20; transform:translate(-50%,-100%); margin:0; padding:0; border:0; background:transparent; color:var(--mmd-fg); font:inherit; cursor:pointer; border-radius:14px; overflow:visible; -webkit-tap-highlight-color:transparent; }
.mmd-table-seat.is-editable { cursor:grab; touch-action:none; }
.mmd-table-seat:focus-visible { outline:2px solid var(--mmd-accent); outline-offset:5px; }
.mmd-table-sprite-mask { display:block; position:relative; overflow:hidden; width:100%; pointer-events:none; }
.mmd-rt-character { display:block; position:relative; transform-origin:50% 85%; }
.mmd-model-art { display:block; object-fit:contain; user-select:none; pointer-events:none; filter:drop-shadow(0 2px 2px #302e5320); }
.mmd-art-fallback { display:flex; justify-content:center; align-items:flex-end; }
.mmd-art-fallback svg { display:block; }
.mmd-table-chair { position:absolute; left:18%; width:64%; top:43%; height:49%; background:linear-gradient(100deg,#eadbc6,#fff6e7 42%,#dfc7ae); border:2px solid #b88d6b; border-radius:18px 18px 4px 4px; z-index:-1; box-shadow:inset 0 0 0 2px #fff7e8; }
.mmd-table-chair.is-lead { border-color:#aa92bd; }
.mmd-table-seat.is-selected .mmd-model-art,.mmd-table-seat:hover .mmd-model-art { filter:drop-shadow(0 0 6px #8c8ce095); }
.mmd-table-seat.is-drop-target { outline:2px dashed var(--mmd-accent); outline-offset:5px; background:#7c9aff22; }
.mmd-table-seat.mmd-rt-vacant { opacity:1; }
.mmd-table-vacancy { position:absolute; top:35%; left:50%; transform:translateX(-50%); width:32px; height:32px; border:1px dashed #9699bd; background:var(--mmd-bg); border-radius:50%; display:flex; justify-content:center; align-items:center; color:var(--mmd-muted); font-size:17px; }
.mmd-rt-badge { position:absolute; top:12%; right:3%; line-height:18px; min-width:18px; padding:0 3px; border-radius:50%; background:#fffaf0eb; color:#7872a5; font-size:12px; font-weight:700; pointer-events:none; }
.mmd-rt-state-thinking .mmd-rt-badge { letter-spacing:2px; font-size:16px; }
.mmd-rt-state-error .mmd-rt-badge { color:var(--mmd-danger); }
.mmd-rt-state-done .mmd-rt-badge { color:var(--mmd-lead); }
.mmd-rt-state-aborted .mmd-model-art { filter:grayscale(.7); opacity:.6; }
.mmd-rt-state-error .mmd-model-art { filter:drop-shadow(0 0 5px #ef444477); }
.mmd-rt-caption { position:absolute; bottom:calc(100% + 3px); left:50%; transform:translateX(-50%) translateY(3px); width:120px; max-width:140%; padding:4px 7px; border:1px solid #d6c9df !important; border-radius:8px; opacity:0; transition:opacity .15s,transform .15s; pointer-events:none;
 background:#fffcf6f5; color:#484258; line-height:14px; text-align:center; box-shadow:0 2px 8px #55426915; }
.mmd-table-seat:hover .mmd-rt-caption,.mmd-table-seat:focus-visible .mmd-rt-caption,.mmd-table-seat.is-selected .mmd-rt-caption { opacity:1; transform:translateX(-50%); }
.mmd-rt-caption b { display:block; font-size:10px; font-weight:650; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mmd-rt-caption small { display:block; font-size:8px; color:#6e6f87; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mmd-table-vacancies { display:flex; align-items:center; gap:6px; flex:0 0 auto; overflow-x:auto; padding:5px 12px; font-size:10px; background:var(--mmd-bg); }
.mmd-table-vacancies > span { white-space:nowrap; color:var(--mmd-muted); }
.mmd-table-vacancies button { padding:3px 7px; border:1px dashed var(--mmd-line-strong); border-radius:6px; white-space:nowrap; background:var(--mmd-panel); color:var(--mmd-muted); cursor:pointer; font:inherit; font-size:10px; }
.mmd-table-vacancies button.is-drop-target { border:1px solid var(--mmd-accent); background:var(--mmd-accent-soft); color:var(--mmd-accent); }
.mmd-table-empty-scene { position:absolute; top:35%; left:50%; transform:translateX(-50%); padding:12px 20px; background:#fffaf0df; color:#766779; border-radius:12px; font-size:12px; white-space:nowrap; }
.mmd-rt-activity { position:absolute; z-index:35; transform:translate(-50%,-100%); max-width:160px; padding:4px 8px; border-radius:10px 10px 10px 2px; font-size:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border:1px solid var(--mmd-line); background:var(--mmd-bg); color:var(--mmd-fg); box-shadow:var(--mmd-shadow); pointer-events:none; }
.mmd-rt-overflow { position:absolute; bottom:6px; left:12px; right:12px; z-index:50; font-size:10px; color:var(--mmd-exec); background:var(--mmd-bg); padding:3px 7px; border-radius:6px; }
.mmd-table-notice { flex:0 0 auto; padding:4px 15px; font-size:10px; line-height:15px; color:var(--mmd-muted); border-top:1px solid var(--mmd-line); max-height:46px; overflow:auto; }
.mmd-rt-splitter { height:7px; flex:0 0 7px; cursor:ns-resize; touch-action:none; display:flex; align-items:center; justify-content:center; background:var(--mmd-panel); border-top:1px solid var(--mmd-line); }
.mmd-rt-splitter i { width:45px; height:3px; border-radius:4px; background:var(--mmd-line-strong); }
.mmd-rt-splitter:hover i,.mmd-rt-splitter:focus-visible i { background:var(--mmd-accent); }
.mmd-rt-compact { display:none; flex:0 0 auto; overflow-x:auto; padding:5px 12px; gap:6px; }
.mmd-rt-compact button { white-space:nowrap; padding:2px 8px; font:inherit; font-size:10px; background:var(--mmd-panel); color:var(--mmd-fg); border:1px solid var(--mmd-line); border-radius:999px; cursor:pointer; }
.mmd-view-chat .mmd-rt-stage,.mmd-view-chat .mmd-rt-splitter,.mmd-view-chat .mmd-table-notice { display:none; }
.mmd-view-table .mmd-rt-stage { flex:1 1 0 !important; }
.mmd-view-table .mmd-rt-splitter,.mmd-view-table .mmd-body { display:none; }
.mmd-view-table .mmd-side { display:none; }
.mmd-table-inspector { position:absolute; top:73px; right:14px; width:292px; max-width:calc(100% - 28px); max-height:calc(100% - 88px); overflow:auto; z-index:100; padding:14px; border:1px solid var(--mmd-line); background:var(--mmd-bg); box-shadow:var(--mmd-shadow-lg); border-radius:12px; font-size:12px; }
.mmd-table-close { position:absolute; right:7px; top:4px; border:0; background:none; color:var(--mmd-muted); font-size:20px; cursor:pointer; }
.mmd-table-person { display:flex; gap:8px; align-items:center; }
.mmd-table-person > div { min-width:0; overflow-wrap:anywhere; }
.mmd-table-person small { display:block; font-size:10px; color:var(--mmd-muted); margin-top:4px; }
.mmd-table-last-speech { white-space:pre-wrap; max-height:180px; overflow:auto; padding:9px; background:var(--mmd-panel); border-radius:7px; font-size:11px; }
.mmd-table-inspector-actions { display:flex; flex-wrap:wrap; gap:6px; }
.mmd-table-context { position:absolute; width:204px; z-index:350; border:1px solid var(--mmd-line); background:var(--mmd-bg); border-radius:10px; padding:5px; box-shadow:var(--mmd-shadow-lg); }
.mmd-table-context button { display:block; width:100%; text-align:left; border:0; background:transparent; padding:7px 9px; border-radius:6px; color:var(--mmd-fg); font:inherit; font-size:11px; cursor:pointer; }
.mmd-table-context button:hover:not(:disabled) { background:var(--mmd-accent-soft); }
.mmd-table-context button:disabled { opacity:.4; cursor:not-allowed; }
.mmd-table-backdrop { position:absolute; inset:0; z-index:400; display:flex; justify-content:flex-end; background:#151b3640; }
.mmd-table-drawer { width:390px; max-width:100%; height:100%; background:var(--mmd-bg); color:var(--mmd-fg); border-left:1px solid var(--mmd-line); box-shadow:var(--mmd-shadow-lg); display:flex; flex-direction:column; outline:none; }
.mmd-table-drawer > header { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 15px; border-bottom:1px solid var(--mmd-line); flex:0 0 auto; }
.mmd-table-form,.mmd-table-picker { padding:14px 16px; overflow-y:auto; min-height:0; }
.mmd-table-form { display:flex; flex-direction:column; gap:12px; }
.mmd-table-form label:not(.mmd-check) { display:flex; flex-direction:column; gap:4px; font-size:11px; color:var(--mmd-muted); }
.mmd-table-form-row { display:flex; gap:12px; }
.mmd-table-form-row > label { flex:1; min-width:0; }
.mmd-table-edit-preview { display:flex; align-items:center; gap:12px; border-radius:10px; background:var(--mmd-panel); padding:5px 10px; }
.mmd-table-edit-preview p,.mmd-table-edit-preview small { color:var(--mmd-muted); font-size:10px; }
.mmd-table-form footer { display:flex; flex-direction:column; gap:8px; padding-top:10px; border-top:1px solid var(--mmd-line); }
.mmd-table-form footer small { font-size:10px; color:var(--mmd-muted); }
.mmd-table-picker > p { font-size:11px; color:var(--mmd-muted); }
.mmd-table-picker h4 { margin:18px 0 6px; }
.mmd-table-pick-profile { display:flex; width:100%; text-align:left; align-items:center; padding:7px; gap:10px; margin-bottom:6px; border:1px solid var(--mmd-line); border-radius:8px; background:var(--mmd-bg); color:var(--mmd-fg); cursor:pointer; font:inherit; }
.mmd-table-pick-profile small { display:block; font-size:10px; color:var(--mmd-muted); overflow-wrap:anywhere; }
.mmd-table-art-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; margin:12px 0; }
.mmd-table-art-grid button { display:flex; flex-direction:column; align-items:center; padding:4px 2px; border:1px solid var(--mmd-line); border-radius:8px; background:var(--mmd-panel); color:var(--mmd-fg); cursor:pointer; font-size:10px; }
.mmd-table-destinations { display:flex; flex-direction:column; gap:8px; }
.mmd-message-highlight .mmd-bubble { outline:2px solid #a5a0e6; background:var(--mmd-accent-soft); }
.mmd-table-drawer button:focus-visible,.mmd-table-tabs button:focus-visible,.mmd-table-context button:focus-visible,.mmd-rt-splitter:focus-visible { outline:2px solid var(--mmd-accent); outline-offset:2px; }
@keyframes mmd-rt-breath { 0%,100% { transform:scale(1); } 50% { transform:scale(1.015); } }
@keyframes mmd-rt-sway { 0%,100% { transform:rotate(-1.3deg); } 50% { transform:rotate(1.3deg); } }
@keyframes mmd-rt-pop { 0%,100% { transform:scale(1); } 40% { transform:translateY(-3px) scale(1.04); } }
@keyframes mmd-rt-shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-2px); } 75% { transform:translateX(2px); } }
@keyframes mmd-rt-work { 0%,100% { transform:rotate(-1deg); } 50% { transform:translateY(-2px) rotate(1deg); } }
.mmd-rt-anim-breath { animation:mmd-rt-breath 2.4s ease-in-out infinite; }
.mmd-rt-anim-sway { animation:mmd-rt-sway 3.2s ease-in-out infinite; }
.mmd-rt-anim-pop { animation:mmd-rt-pop .6s ease-out; }
.mmd-rt-anim-shake { animation:mmd-rt-shake .5s ease-in-out; }
.mmd-rt-anim-work { animation:mmd-rt-work 1.4s ease-in-out infinite; }
.mmd-rt-paused *,.mmd-view-chat .mmd-rt-stage * { animation-play-state:paused !important; }
@container mmd-discussion (max-width:899px) {
 .mmd-discussion .mmd-side,.mmd-rt-toolbar-hint,.mmd-table-help { display:none; }
 .mmd-rt-toolbar { padding:6px 12px; } .mmd-rt-toolbar .mmd-seg button { padding:4px 8px; }
 .mmd-table-topbar { padding-left:8px; } .mmd-table-tabs button { padding:4px 7px; }
 .mmd-rt-compact { display:flex; }
}
@media (prefers-reduced-motion:reduce) { .mmd-discussion *,.mmd-discussion *::before,.mmd-discussion *::after { animation:none !important; transition:none !important; scroll-behavior:auto !important; } }
`;
