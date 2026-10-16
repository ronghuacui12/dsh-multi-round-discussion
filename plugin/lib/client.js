window.__ModuleLoader__.load({
  id: 'dsh-multi-model-discussion',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name2 in all)
        __defProp(target, name2, { get: all[name2], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

    // ../dsh-multi-round-discussion/plugin/client-src/index.tsx
    var index_exports = {};
    __export(index_exports, {
      apply: () => apply,
      inject: () => inject,
      name: () => name
    });
    module.exports = __toCommonJS(index_exports);

    // ../dsh-multi-round-discussion/plugin/client-src/roundtable/styles.ts
    var ROUNDTABLE_CSS = `
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

    // ../dsh-multi-round-discussion/plugin/client-src/styles.ts
    var STYLE_ID = "dsh-mmd-styles";
    var CSS = `
    /* ================================================================ tokens */
    .mmd-root {
      --mmd-bg: var(--dsh-color-bg, #ffffff);
      --mmd-fg: var(--dsh-color-fg, #1f2328);
      --mmd-muted: var(--dsh-color-fg-muted, #6b7280);
      --mmd-line: var(--dsh-color-border, rgba(127, 127, 127, .22));
      --mmd-line-strong: rgba(127, 127, 127, .38);
      --mmd-panel: var(--dsh-color-bg-subtle, rgba(127, 127, 127, .06));
      --mmd-panel-2: rgba(127, 127, 127, .1);
      --mmd-shadow: 0 1px 2px rgba(16, 24, 40, .06), 0 8px 24px -18px rgba(16, 24, 40, .35);
      --mmd-shadow-lg: 0 2px 6px rgba(16, 24, 40, .08), 0 24px 48px -28px rgba(16, 24, 40, .45);
      --mmd-radius: 14px;
      --mmd-radius-sm: 10px;
      --mmd-accent: #2563eb;
      --mmd-accent-soft: rgba(37, 99, 235, .12);
      --mmd-lead: #16a34a;
      --mmd-exec: #d97706;
      --mmd-danger: #dc2626;
      display: flex; height: 100%; min-height: 0; font-size: 13px; line-height: 1.6;
      color: var(--mmd-fg); background: var(--mmd-bg);
    }
    .mmd-root *, .mmd-root *::before, .mmd-root *::after { box-sizing: border-box; }
    .mmd-root ::-webkit-scrollbar { width: 10px; height: 10px; }
    .mmd-root ::-webkit-scrollbar-thumb { background: var(--mmd-line-strong); border-radius: 8px;
      border: 3px solid transparent; background-clip: content-box; }
    .mmd-root ::-webkit-scrollbar-thumb:hover { background: var(--mmd-muted); background-clip: content-box; }
    .mmd-root ::-webkit-scrollbar-track { background: transparent; }

    /* ================================================================ chat shell */
    .mmd-chat { display: flex; flex-direction: column; flex: 1; min-width: 0; height: 100%; }

    .mmd-head { display: flex; align-items: center; gap: 10px; padding: 12px 18px;
      border-bottom: 1px solid var(--mmd-line); flex: 0 0 auto; flex-wrap: wrap;
      background: linear-gradient(180deg, var(--mmd-panel), transparent); }
    .mmd-title { font-weight: 650; font-size: 14.5px; letter-spacing: .2px; display: flex; align-items: center; gap: 8px; }
    .mmd-title-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mmd-accent);
      box-shadow: 0 0 0 4px var(--mmd-accent-soft); }
    .mmd-phase-chip { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px;
      border-radius: 999px; font-size: 11.5px; font-weight: 600; background: var(--mmd-accent-soft);
      color: var(--mmd-accent); border: 1px solid rgba(37, 99, 235, .25); }
    .mmd-phase-chip.is-warn { background: rgba(217, 119, 6, .14); color: var(--mmd-exec); border-color: rgba(217, 119, 6, .3); }
    .mmd-phase-chip.is-done { background: rgba(22, 163, 74, .14); color: var(--mmd-lead); border-color: rgba(22, 163, 74, .3); }
    .mmd-phase-chip.is-bad { background: rgba(220, 38, 38, .14); color: var(--mmd-danger); border-color: rgba(220, 38, 38, .3); }
    .mmd-sub { color: var(--mmd-muted); font-size: 12px; }
    .mmd-spacer { flex: 1 1 auto; }

    /* phase rail -------------------------------------------------------- */
    .mmd-rail { display: flex; align-items: center; gap: 0; padding: 10px 18px 6px; flex: 0 0 auto;
      overflow-x: auto; scrollbar-width: none; }
    .mmd-rail::-webkit-scrollbar { display: none; }
    .mmd-step { display: flex; align-items: center; gap: 6px; color: var(--mmd-muted);
      font-size: 11.5px; white-space: nowrap; }
    .mmd-step-dot { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--mmd-line-strong);
      display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;
      background: var(--mmd-bg); transition: all .25s ease; }
    .mmd-step-line { width: 26px; height: 2px; background: var(--mmd-line); margin: 0 8px; border-radius: 2px; transition: background .25s ease; }
    .mmd-step.is-done .mmd-step-dot { border-color: var(--mmd-lead); background: var(--mmd-lead); color: #fff; }
    .mmd-step.is-done .mmd-step-line { background: var(--mmd-lead); }
    .mmd-step.is-now .mmd-step-dot { border-color: var(--mmd-accent); color: var(--mmd-accent);
      box-shadow: 0 0 0 4px var(--mmd-accent-soft); animation: mmd-pop 1.6s infinite ease-in-out; }
    .mmd-step.is-now { color: var(--mmd-fg); font-weight: 600; }

    /* transcript --------------------------------------------------------- */
    .mmd-body { flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; padding: 14px 18px 26px;
      scroll-behavior: smooth; position: relative; }
    .mmd-row { display: flex; gap: 10px; margin-bottom: 16px; align-items: flex-start; animation: mmd-in .22s ease both; }
    .mmd-row-mine { flex-direction: row-reverse; }
    .mmd-col { min-width: 0; max-width: 84%; }
    .mmd-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
    .mmd-row-mine .mmd-meta { flex-direction: row-reverse; }
    .mmd-name { font-weight: 650; font-size: 12.5px; }
    .mmd-tag { font-size: 11px; color: var(--mmd-muted); }
    .mmd-pill { font-size: 10.5px; font-weight: 650; padding: 1px 7px; border-radius: 999px;
      background: var(--mmd-panel-2); color: var(--mmd-muted); }

    .mmd-bubble { border: 1px solid var(--mmd-line); border-radius: var(--mmd-radius);
      padding: 11px 14px; background: var(--mmd-bg); white-space: pre-wrap; word-break: break-word;
      line-height: 1.68; box-shadow: var(--mmd-shadow); }
    .mmd-bubble-mine { background: linear-gradient(180deg, rgba(37, 99, 235, .12), rgba(37, 99, 235, .07));
      border-color: rgba(37, 99, 235, .3); }
    .mmd-bubble-lead { border-color: rgba(22, 163, 74, .38); background: linear-gradient(180deg, rgba(22, 163, 74, .1), rgba(22, 163, 74, .04)); }
    .mmd-bubble-exec { border-color: rgba(217, 119, 6, .38); background: linear-gradient(180deg, rgba(217, 119, 6, .1), rgba(217, 119, 6, .04)); }
    .mmd-bubble-sys { border-style: dashed; background: transparent; color: var(--mmd-muted); font-size: 12px; box-shadow: none; }
    .mmd-bubble-title { font-weight: 700; margin-bottom: 7px; font-size: 13px; }
    .mmd-bubble section { margin-top: 9px; }
    .mmd-sec-label { font-size: 11px; color: var(--mmd-muted); margin-bottom: 3px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .4px; }
    .mmd-bubble ul { margin: 0; padding-left: 18px; }
    .mmd-bubble li { margin: 2px 0; }
    .mmd-bubble code { background: var(--mmd-panel-2); padding: 1px 5px; border-radius: 5px; font-size: 12px; }
    .mmd-divider { display: flex; align-items: center; gap: 12px; margin: 22px 0 16px;
      color: var(--mmd-muted); font-size: 11.5px; font-weight: 600; letter-spacing: .3px; }
    .mmd-divider::before, .mmd-divider::after { content: ''; flex: 1; height: 1px;
      background: linear-gradient(90deg, transparent, var(--mmd-line), transparent); }
    .mmd-thinking { display: inline-flex; align-items: center; gap: 8px; color: var(--mmd-muted); font-size: 12px;
      padding: 7px 12px; border: 1px dashed var(--mmd-line); border-radius: 999px; }
    .mmd-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mmd-accent); animation: mmd-pulse 1.1s infinite ease-in-out; flex: 0 0 auto; }
    .mmd-dot-done { background: var(--mmd-lead); animation: none; }
    .mmd-dot-error { background: var(--mmd-danger); animation: none; }
    .mmd-dot-idle { background: #9ca3af; animation: none; }
    .mmd-avatar { width: 38px; height: 38px; border-radius: 50%; flex: 0 0 auto; overflow: hidden;
      background: var(--mmd-panel); display: flex; align-items: center; justify-content: center;
      font-weight: 650; font-size: 15px; color: #fff; user-select: none;
      box-shadow: 0 0 0 2px var(--mmd-bg), 0 0 0 3px var(--mmd-line); }
    .mmd-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .mmd-empty { padding: 54px 20px; text-align: center; color: var(--mmd-muted); }
    .mmd-empty-badge { width: 54px; height: 54px; margin: 0 auto 14px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center; font-size: 26px;
      background: var(--mmd-accent-soft); border: 1px solid rgba(37, 99, 235, .22); }
    .mmd-empty-title { font-weight: 650; color: var(--mmd-fg); margin-bottom: 6px; font-size: 14px; }

    /* floating jump-to-latest ------------------------------------------- */
    .mmd-fab { position: sticky; bottom: 8px; float: right; margin-right: 4px; z-index: 5;
      border-radius: 999px; padding: 6px 14px; font-size: 12px; cursor: pointer;
      border: 1px solid var(--mmd-line); background: var(--mmd-bg); color: var(--mmd-fg);
      box-shadow: var(--mmd-shadow-lg); }

    /* ================================================================ docked bottom bar */
    .mmd-foot { flex: 0 0 auto; border-top: 1px solid var(--mmd-line); background: var(--mmd-bg);
      padding: 10px 18px 12px; display: flex; flex-direction: column; gap: 10px; }
    .mmd-compose { display: flex; gap: 10px; align-items: center; }
    .mmd-compose .mmd-input { flex: 1; }

    .mmd-approve-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 12px 14px; border-radius: var(--mmd-radius);
      border: 1px solid rgba(217, 119, 6, .45);
      background: linear-gradient(180deg, rgba(217, 119, 6, .16), rgba(217, 119, 6, .07));
      box-shadow: var(--mmd-shadow); animation: mmd-rise .28s ease both; }
    .mmd-approve-bar.is-ask { border-color: rgba(37, 99, 235, .45);
      background: linear-gradient(180deg, rgba(37, 99, 235, .14), rgba(37, 99, 235, .06)); }
    .mmd-approve-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center;
      justify-content: center; font-size: 17px; background: rgba(217, 119, 6, .22); flex: 0 0 auto; }
    .mmd-approve-bar.is-ask .mmd-approve-icon { background: rgba(37, 99, 235, .2); }
    .mmd-approve-text { display: flex; flex-direction: column; gap: 1px; min-width: 180px; }
    .mmd-approve-text b { font-size: 13px; }
    .mmd-approve-text span { font-size: 11.5px; color: var(--mmd-muted); }
    .mmd-pulse { animation: mmd-glow 1.8s infinite ease-in-out; }

    /* inline approval card at the end of the transcript --------------- */
    .mmd-approve-card { border: 1px solid rgba(217, 119, 6, .45); border-radius: var(--mmd-radius);
      background: linear-gradient(180deg, rgba(217, 119, 6, .13), rgba(217, 119, 6, .04));
      padding: 14px 16px; box-shadow: var(--mmd-shadow); animation: mmd-rise .28s ease both; }
    .mmd-approve-card h5 { margin: 0 0 4px; font-size: 13.5px; }
    .mmd-approve-card p { margin: 0 0 10px; font-size: 12px; color: var(--mmd-muted); }
    .mmd-approve-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

    /* ================================================================ controls */
    .mmd-btn { border: 1px solid var(--mmd-line); background: var(--mmd-bg); color: var(--mmd-fg);
      border-radius: 9px; padding: 6px 13px; font-size: 12.5px; font-weight: 500; cursor: pointer;
      transition: background .16s ease, border-color .16s ease, transform .1s ease, box-shadow .16s ease;
      display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
    .mmd-btn:hover:not(:disabled) { background: var(--mmd-panel); border-color: var(--mmd-line-strong); }
    .mmd-btn:active:not(:disabled) { transform: translateY(1px); }
    .mmd-btn:disabled { opacity: .45; cursor: not-allowed; }
    .mmd-btn-primary { background: linear-gradient(180deg, #3b82f6, #2563eb); border-color: #2563eb;
      color: #fff; font-weight: 620; box-shadow: 0 1px 2px rgba(37, 99, 235, .35); }
    .mmd-btn-primary:hover:not(:disabled) { background: linear-gradient(180deg, #2563eb, #1d4ed8); }
    .mmd-btn-danger { border-color: rgba(220, 38, 38, .45); color: var(--mmd-danger); }
    .mmd-btn-danger:hover:not(:disabled) { background: rgba(220, 38, 38, .09); }
    .mmd-btn-ghost { border-color: transparent; background: transparent; color: var(--mmd-muted); }
    .mmd-btn-ghost:hover:not(:disabled) { background: var(--mmd-panel); color: var(--mmd-fg); }
    .mmd-btn-sm { padding: 3px 9px; font-size: 11.5px; border-radius: 8px; }
    .mmd-btn-block { width: 100%; justify-content: center; }

    .mmd-input, .mmd-select, .mmd-textarea { border: 1px solid var(--mmd-line); border-radius: 9px;
      padding: 7px 10px; background: var(--mmd-bg); color: var(--mmd-fg); font-size: 12.5px;
      max-width: 100%; font-family: inherit; transition: border-color .16s ease, box-shadow .16s ease; }
    .mmd-input:focus, .mmd-select:focus, .mmd-textarea:focus { outline: none;
      border-color: var(--mmd-accent); box-shadow: 0 0 0 3px var(--mmd-accent-soft); }
    .mmd-textarea { resize: vertical; min-height: 54px; line-height: 1.55; }
    .mmd-check { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; cursor: pointer; }
    .mmd-check input { accent-color: var(--mmd-accent); width: 14px; height: 14px; }

    /* ================================================================ right rail */
    .mmd-side { flex: 0 0 248px; border-left: 1px solid var(--mmd-line); padding: 14px;
      overflow-y: auto; background: linear-gradient(180deg, var(--mmd-panel), transparent); }
    .mmd-side h4 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .5px;
      color: var(--mmd-muted); font-weight: 700; }
    .mmd-stat { border: 1px solid var(--mmd-line); border-radius: var(--mmd-radius-sm); padding: 10px 12px;
      margin-bottom: 10px; background: var(--mmd-bg); box-shadow: var(--mmd-shadow); }
    .mmd-stat b { font-size: 17px; font-weight: 700; letter-spacing: -.2px; }
    .mmd-stat span { display: block; font-size: 11px; color: var(--mmd-muted); }
    .mmd-bar { height: 6px; border-radius: 4px; background: var(--mmd-line); overflow: hidden; margin: 8px 0 2px; }
    .mmd-bar > i { display: block; height: 100%; background: linear-gradient(90deg, #60a5fa, #2563eb);
      border-radius: 4px; transition: width .4s ease; }
    .mmd-bar.is-hot > i { background: linear-gradient(90deg, #fbbf24, #dc2626); }
    .mmd-cost-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .mmd-cost-table th { text-align: left; color: var(--mmd-muted); font-weight: 600; padding: 3px 2px;
      border-bottom: 1px solid var(--mmd-line); }
    .mmd-cost-table td { padding: 4px 2px; border-bottom: 1px solid var(--mmd-line); }
    .mmd-cost-table tr:last-child td { border-bottom: 0; }
    .mmd-participant { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; font-size: 12px; }

    /* ================================================================ settings */
    .mmd-set { display: flex; flex-direction: column; gap: 18px; padding: 6px 4px 96px; max-width: 940px; }
    .mmd-set-head { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .mmd-set-head h3 { margin: 0 0 4px; font-size: 17px; letter-spacing: -.2px; }
    .mmd-hint { color: var(--mmd-muted); font-size: 12px; line-height: 1.65; margin: 0; }
    .mmd-hint code { background: var(--mmd-panel-2); padding: 1px 5px; border-radius: 5px; }
    .mmd-group { border: 1px solid var(--mmd-line); border-radius: var(--mmd-radius); padding: 14px 16px;
      background: var(--mmd-bg); box-shadow: var(--mmd-shadow); }
    .mmd-group-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
    .mmd-group-head h4 { margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .mmd-role-badge { width: 26px; height: 26px; border-radius: 9px; display: inline-flex; align-items: center;
      justify-content: center; font-size: 13px; font-weight: 700; color: #fff; }
    .mmd-count { font-size: 11px; color: var(--mmd-muted); border: 1px solid var(--mmd-line);
      border-radius: 999px; padding: 1px 8px; }
    .mmd-seat { display: flex; gap: 14px; padding: 14px 0; border-top: 1px dashed var(--mmd-line); align-items: flex-start; }
    .mmd-seat:first-of-type { border-top: 0; }
    .mmd-seat-av { position: relative; flex: 0 0 auto; cursor: pointer; }
    .mmd-seat-av .mmd-avatar { width: 48px; height: 48px; font-size: 19px; }
    .mmd-seat-av input { display: none; }
    .mmd-seat-av::after { content: '换头像'; position: absolute; left: 50%; transform: translateX(-50%);
      bottom: -16px; font-size: 10px; color: var(--mmd-muted); opacity: 0; transition: opacity .15s ease; white-space: nowrap; }
    .mmd-seat-av:hover::after { opacity: 1; }
    .mmd-seat-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 9px; }
    .mmd-seat-line { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
    .mmd-field { display: flex; flex-direction: column; gap: 4px; min-width: 132px; flex: 1 1 132px; }
    .mmd-field > span { font-size: 11px; color: var(--mmd-muted); font-weight: 600; }
    .mmd-seat.is-off { opacity: .55; }
    .mmd-off { font-size: 11px; color: var(--mmd-muted); }

    .mmd-seg { display: inline-flex; border: 1px solid var(--mmd-line); border-radius: 10px; overflow: hidden; }
    .mmd-seg button { border: 0; background: transparent; color: var(--mmd-fg); padding: 6px 12px;
      font-size: 12.5px; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; }
    .mmd-seg button + button { border-left: 1px solid var(--mmd-line); }
    .mmd-seg button.is-on { background: var(--mmd-accent); color: #fff; font-weight: 600; }
    .mmd-mode-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
    .mmd-mode-card { border: 1.5px solid var(--mmd-line); border-radius: var(--mmd-radius-sm); padding: 11px 13px;
      cursor: pointer; display: flex; gap: 10px; align-items: flex-start; transition: all .16s ease; }
    .mmd-mode-card:hover { border-color: var(--mmd-line-strong); }
    .mmd-mode-card.is-on { border-color: var(--mmd-accent); background: var(--mmd-accent-soft);
      box-shadow: 0 0 0 3px var(--mmd-accent-soft); }
    .mmd-mode-card b { font-size: 12.5px; display: block; }
    .mmd-mode-card span { font-size: 11.5px; color: var(--mmd-muted); }

    .mmd-tool-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 10px 0 6px; }
    .mmd-tool-cat { margin-top: 10px; }
    .mmd-tool-cat > .mmd-sec-label { margin-bottom: 6px; }
    .mmd-chips { display: flex; gap: 7px; flex-wrap: wrap; }
    .mmd-chip { border: 1px solid var(--mmd-line); border-radius: 999px; padding: 3px 11px; font-size: 11.5px;
      cursor: pointer; background: var(--mmd-bg); color: var(--mmd-fg); display: inline-flex; align-items: center; gap: 6px;
      transition: all .14s ease; user-select: none; }
    .mmd-chip:hover { border-color: var(--mmd-line-strong); background: var(--mmd-panel); }
    .mmd-chip.is-on { background: var(--mmd-accent); border-color: var(--mmd-accent); color: #fff; font-weight: 600;
      box-shadow: 0 1px 2px rgba(37, 99, 235, .3); }
    .mmd-chip.is-warn.is-on { background: var(--mmd-exec); border-color: var(--mmd-exec); }
    .mmd-chip code { font-size: 11px; opacity: .75; }
    .mmd-chip.is-on code { opacity: .85; }

    .mmd-save { display: flex; align-items: center; gap: 12px; position: sticky; bottom: 0; z-index: 4;
      background: var(--mmd-bg); padding: 12px 14px; border: 1px solid var(--mmd-line);
      border-radius: var(--mmd-radius); box-shadow: var(--mmd-shadow-lg); margin-top: 4px; }
    .mmd-status { font-size: 12.5px; }
    .mmd-ok { color: var(--mmd-lead); }
    .mmd-bad { color: var(--mmd-danger); }
    .mmd-warn { color: var(--mmd-exec); }
    .mmd-dot-unsaved { width: 7px; height: 7px; border-radius: 50%; background: var(--mmd-exec); display: inline-block; }
    .mmd-alert { border-radius: var(--mmd-radius-sm); padding: 9px 12px; font-size: 12.5px;
      display: flex; gap: 8px; align-items: flex-start; }
    .mmd-alert.is-bad { background: rgba(220, 38, 38, .1); border: 1px solid rgba(220, 38, 38, .35); color: var(--mmd-danger); }
    .mmd-alert.is-warn { background: rgba(217, 119, 6, .1); border: 1px solid rgba(217, 119, 6, .35); color: var(--mmd-exec); }

    /* ================================================================ animation */
    @keyframes mmd-pulse { 0%, 100% { opacity: .35; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.12); } }
    @keyframes mmd-pop { 0%, 100% { box-shadow: 0 0 0 3px var(--mmd-accent-soft); } 50% { box-shadow: 0 0 0 7px rgba(37, 99, 235, .08); } }
    @keyframes mmd-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes mmd-rise { from { opacity: 0; transform: translateY(10px) scale(.99); } to { opacity: 1; transform: none; } }
    @keyframes mmd-glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.06); } }

    @media (max-width: 900px) {
      .mmd-side { display: none; }
      .mmd-col { max-width: 100%; }
    }
    `;
    function injectStyles() {
      if (typeof document === "undefined") return;
      const existing = document.getElementById(STYLE_ID);
      if (existing) existing.remove();
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = CSS + ROUNDTABLE_CSS;
      document.head.appendChild(el);
    }

    // ../dsh-multi-round-discussion/plugin/client-src/settings.tsx
    var import_react2 = require("react");

    // ../dsh-multi-round-discussion/plugin/client-src/api.ts
    var PREFIX = "/dsh-mmd";
    async function request(path, init) {
      const response = await fetch(PREFIX + path, {
        ...init,
        headers: { "content-type": "application/json", ...init?.headers ?? {} }
      });
      const text = await response.text();
      let body = void 0;
      try {
        body = text ? JSON.parse(text) : void 0;
      } catch {
        body = void 0;
      }
      if (!response.ok) {
        throw new Error(body && body.error || `${response.status} ${response.statusText}`);
      }
      return body;
    }
    var api = {
      settings: () => request("/settings"),
      saveSettings: (patch) => request("/settings", { method: "POST", body: JSON.stringify(patch) }),
      models: () => request("/models"),
      runs: () => request("/runs"),
      run: (id) => request(`/runs/${encodeURIComponent(id)}`),
      removeRun: (id) => request(`/runs/${encodeURIComponent(id)}`, { method: "DELETE" }),
      control: (id, control) => request(`/runs/${encodeURIComponent(id)}/control`, { method: "POST", body: JSON.stringify({ control }) }),
      start: (payload) => request("/runs", { method: "POST", body: JSON.stringify(payload) }),
      uploadAvatar: (key, dataUrl) => request("/avatars", { method: "POST", body: JSON.stringify({ key, dataUrl }) })
    };
    function subscribeEvents(onRuns, onRun) {
      if (typeof EventSource === "undefined") return () => {
      };
      const source = new EventSource(PREFIX + "/events");
      source.addEventListener("snapshot", (event) => {
        try {
          onRuns(JSON.parse(event.data).runs ?? []);
        } catch {
        }
      });
      source.addEventListener("run-updated", (event) => {
        try {
          onRun(JSON.parse(event.data));
        } catch {
        }
      });
      return () => source.close();
    }

    // ../dsh-multi-round-discussion/plugin/client-src/avatar.tsx
    var import_react = require("react");
    var import_jsx_runtime = require("react/jsx-runtime");
    var PALETTE = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];
    function hueFor(key) {
      let hash = 0;
      for (let i = 0; i < key.length; i++) hash = hash * 31 + key.charCodeAt(i) >>> 0;
      return PALETTE[hash % PALETTE.length];
    }
    function Avatar(props) {
      const { seatKey, label, size = 38, version } = props;
      const [broken, setBroken] = (0, import_react.useState)(false);
      (0, import_react.useEffect)(() => setBroken(false), [version, seatKey]);
      const initial = (label || seatKey || "?").trim().slice(0, 1).toUpperCase();
      const src = version ? `/dsh-mmd/avatars/${encodeURIComponent(seatKey)}?v=${encodeURIComponent(version)}` : `/dsh-mmd/avatars/${encodeURIComponent(seatKey)}`;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mmd-avatar", style: { width: size, height: size, background: hueFor(seatKey), fontSize: Math.round(size * 0.42) }, children: broken ? initial : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src, alt: label, onError: () => setBroken(true) }) });
    }

    // ../dsh-multi-round-discussion/plugin/client-src/settings.tsx
    var import_jsx_runtime2 = require("react/jsx-runtime");
    var GROUPS = [
      { role: "decisionMaker", title: "主导模型", icon: "★", color: "#16a34a", hint: "读完全部提案与互评，拍板选出最终方向，并写出最终答复。", min: 1, max: 1, seat: "lead" },
      { role: "proposer", title: "讨论者", icon: "💡", color: "#2563eb", hint: "各自独立提出方案，然后互相看到对方（匿名）的方案并给出自己的理解与评价。", min: 1, max: 5, seat: "proposer" },
      { role: "reviewer", title: "专职评审（可选）", icon: "🔍", color: "#7c3aed", hint: "不提案，只对匿名方案做交叉评审。讨论者已经在互评，这一组可以留空。", min: 0, max: 3, seat: "reviewer" },
      { role: "executor", title: "执行模型", icon: "⚙", color: "#d97706", hint: "只按批准后的计划动手，不重新规划。", min: 1, max: 1, seat: "executor" },
      { role: "verifier", title: "验证模型（可选）", icon: "✓", color: "#0891b2", hint: "执行后按验收标准检查结果。", min: 0, max: 2, seat: "verifier" }
    ];
    var READ_ONLY = /* @__PURE__ */ new Set([
      "read",
      "glob",
      "grep",
      "read_image",
      "list_dir",
      "skill",
      "load_workspace_dependencies",
      "web_search",
      "web_fetch",
      "job_list",
      "job_output",
      "list_agents",
      "get_goal",
      "team_task_list",
      "team_task_get",
      "wait_agent",
      "present",
      "multi_model_discuss"
    ]);
    var TOOL_CATS = [
      { key: "fs", title: "文件", match: (n) => ["read", "write", "edit", "read_image", "glob", "grep", "list_dir", "notebook_edit"].includes(n) },
      { key: "shell", title: "终端 / 系统", match: (n) => ["pwsh", "bash", "run_code", "kill_shell"].includes(n) },
      { key: "task", title: "任务 / 后台", match: (n) => ["todo_write", "job_list", "job_output", "job_kill", "create_goal", "get_goal", "update_goal", "exit_plan_mode"].includes(n) },
      { key: "web", title: "网络", match: (n) => ["web_search", "web_fetch"].includes(n) },
      { key: "team", title: "协作 / 子代理", match: (n) => /^(spawn_teammate|send_message|wait_agent|list_agents|interrupt_agent|team_task_|subagent|workflow)/.test(n) },
      { key: "mcp", title: "MCP（外部服务器）", match: (n) => n.startsWith("mcp__") },
      { key: "other", title: "其他", match: () => true }
    ];
    var TOOL_PRESETS = [
      { key: "ro", label: "只读", hint: "只能看，不能改", pick: (tools) => tools.filter((t) => READ_ONLY.has(t)) },
      { key: "rw", label: "常用读写", hint: "读 + 写文件 + 终端", pick: (tools) => tools.filter((t) => READ_ONLY.has(t) || ["write", "edit", "pwsh", "todo_write", "present"].includes(t)) },
      { key: "all", label: "全部", hint: "勾上目录里的所有工具", pick: (tools) => [...tools] },
      { key: "none", label: "清空", hint: "执行模型不碰任何工具", pick: () => [] }
    ];
    function toSeats(profiles) {
      return (profiles ?? []).map((p) => ({
        key: String(p.id),
        role: String(p.role),
        provider: String(p.provider ?? ""),
        model: String(p.model ?? ""),
        label: String(p.label ?? p.id),
        temperature: typeof p.temperature === "number" ? p.temperature : 0.4,
        systemPrompt: String(p.systemPrompt ?? ""),
        enabled: p.enabled !== false
      }));
    }
    function nextKey(seats, prefix) {
      let n = 1;
      const used = new Set(seats.map((s) => s.key));
      while (used.has(prefix + "-" + n)) n++;
      return prefix + "-" + n;
    }
    function SettingsSection() {
      const [loading, setLoading] = (0, import_react2.useState)(true);
      const [saving, setSaving] = (0, import_react2.useState)(false);
      const [error, setError] = (0, import_react2.useState)("");
      const [status, setStatus] = (0, import_react2.useState)("");
      const [seats, setSeats] = (0, import_react2.useState)([]);
      const [providers, setProviders] = (0, import_react2.useState)([]);
      const [tools, setTools] = (0, import_react2.useState)([]);
      const [preset, setPreset] = (0, import_react2.useState)("balanced");
      const [peerReview, setPeerReview] = (0, import_react2.useState)(true);
      const [mode, setMode] = (0, import_react2.useState)("confirm");
      const [allowedTools, setAllowedTools] = (0, import_react2.useState)([]);
      const [maxSteps, setMaxSteps] = (0, import_react2.useState)(12);
      const [avatars, setAvatars] = (0, import_react2.useState)({});
      const [mmdHome, setMmdHome] = (0, import_react2.useState)("");
      const [dirty, setDirty] = (0, import_react2.useState)(false);
      const [toolQuery, setToolQuery] = (0, import_react2.useState)("");
      const fileRef = (0, import_react2.useRef)(null);
      const pendingSeat = (0, import_react2.useRef)("");
      const load = (0, import_react2.useCallback)(async () => {
        setLoading(true);
        setError("");
        try {
          const data = await api.settings();
          setSeats(toSeats(data.profiles));
          setProviders(data.providers ?? []);
          setTools(data.tools ?? []);
          setPreset(data.preset ?? "balanced");
          setPeerReview(data.peerReview !== false);
          setMode(data.execution?.mode ?? "confirm");
          setAllowedTools(data.execution?.allowedTools ?? []);
          setMaxSteps(data.execution?.maxSteps ?? 12);
          setAvatars(data.avatars ?? {});
          setMmdHome(data.mmdHome ?? "");
          setDirty(false);
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        } finally {
          setLoading(false);
        }
      }, []);
      (0, import_react2.useEffect)(() => {
        void load();
      }, [load]);
      const modelsOf = (0, import_react2.useCallback)(
        (providerId) => providers.find((p) => p.id === providerId)?.models ?? [],
        [providers]
      );
      const patchSeat = (key, patch) => {
        setSeats((current) => current.map((seat) => seat.key === key ? { ...seat, ...patch } : seat));
        setStatus("");
        setDirty(true);
      };
      const addSeat = (role, prefix) => {
        setSeats((current) => [
          ...current,
          {
            key: nextKey(current, prefix),
            role,
            provider: providers[0]?.id ?? "",
            model: providers[0]?.models?.[0]?.id ?? "",
            label: "",
            temperature: 0.4,
            systemPrompt: "",
            enabled: true
          }
        ]);
        setStatus("");
        setDirty(true);
      };
      const removeSeat = (key) => {
        setSeats((current) => current.filter((seat) => seat.key !== key));
        setStatus("");
        setDirty(true);
      };
      const save = async () => {
        setSaving(true);
        setError("");
        setStatus("");
        try {
          const profiles = seats.filter((seat) => seat.provider && seat.model).map((seat) => ({
            id: seat.key,
            role: seat.role,
            provider: seat.provider,
            model: seat.model,
            label: seat.label || void 0,
            temperature: seat.temperature,
            systemPrompt: seat.systemPrompt || void 0,
            enabled: seat.enabled
          }));
          const result = await api.saveSettings({
            profiles,
            preset,
            peerReview,
            execution: { mode, allowedTools, maxSteps }
          });
          setSeats(toSeats(result.profiles));
          setAvatars(result.avatars ?? {});
          setDirty(false);
          const warnings = result.warnings ?? [];
          setStatus(warnings.length > 0 ? "已保存（" + warnings.join("；") + "）" : "已保存，下一次研讨立即生效。");
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        } finally {
          setSaving(false);
        }
      };
      const uploadAvatar = async (key, file) => {
        setError("");
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("读取图片失败。"));
            reader.readAsDataURL(file);
          });
          const result = await api.uploadAvatar(key, dataUrl);
          setAvatars(result.avatars ?? {});
          setStatus("头像已更新。");
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      };
      const applyToolPreset = (pick) => {
        setAllowedTools(pick(tools.length > 0 ? tools : FALLBACK_TOOLS));
        setStatus("");
        setDirty(true);
      };
      const toggleTool = (name2, on) => {
        setAllowedTools((current) => on ? [.../* @__PURE__ */ new Set([...current, name2])] : current.filter((n) => n !== name2));
        setStatus("");
        setDirty(true);
      };
      const grouped = (0, import_react2.useMemo)(
        () => GROUPS.map((group) => ({ group, seats: seats.filter((seat) => seat.role === group.role) })),
        [seats]
      );
      const toolCats = (0, import_react2.useMemo)(() => {
        const catalog = tools.length > 0 ? tools : FALLBACK_TOOLS;
        const query = toolQuery.trim().toLowerCase();
        const filtered = query ? catalog.filter((name2) => name2.toLowerCase().includes(query)) : catalog;
        const claimed = /* @__PURE__ */ new Set();
        const out = [];
        for (const cat of TOOL_CATS) {
          const names = cat.key === "other" ? filtered.filter((name2) => !claimed.has(name2)) : filtered.filter((name2) => !claimed.has(name2) && cat.match(name2));
          for (const name2 of names) claimed.add(name2);
          if (names.length > 0) out.push({ key: cat.key, title: cat.title, names });
        }
        return out;
      }, [tools, toolQuery]);
      const missingRoles = (0, import_react2.useMemo)(() => {
        const required = [["decisionMaker", "主导模型"], ["proposer", "讨论者"], ["executor", "执行模型"]];
        return required.filter(([role]) => !seats.some((seat) => seat.role === role && seat.enabled && seat.provider && seat.model)).map(([, label]) => label);
      }, [seats]);
      const customTools = allowedTools.filter((name2) => !(tools.length > 0 ? tools : FALLBACK_TOOLS).includes(name2));
      if (loading) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-set", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", children: "正在读取当前配置…" }) });
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-set", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-set-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { flex: "1 1 420px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "研讨模式" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", children: "每个座位选一个已经配好的模型（provider 路由 + 模型 id），不需要再填 API Key——密钥由 DSH 的凭证层按请求解析。留空的座位不参与研讨。" }),
            mmdHome ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "mmd-hint", children: [
              "配置保存到 ",
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: mmdHome + "/roster.json" }),
              "，同时立即对运行中的研讨生效。"
            ] }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { minWidth: 190 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "研讨深度" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { className: "mmd-select", value: preset, onChange: (event) => {
                setPreset(event.target.value);
                setDirty(true);
              }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "fast", children: "快速 · 1 提案者 · 1 轮" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "balanced", children: "平衡 · 3 提案者 · 2 轮" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "deep", children: "深度 · 5 提案者 · 3 轮 + 验证" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "custom", children: "自定义 · 完全按上面的座位" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "mmd-check", style: { marginTop: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked: peerReview, onChange: (event) => {
                setPeerReview(event.target.checked);
                setDirty(true);
              } }),
              "讨论者互相评议"
            ] })
          ] })
        ] }),
        error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-alert is-bad", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "✕" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: error })
        ] }) : null,
        missingRoles.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-alert is-warn", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "!" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "还缺必需角色：" + missingRoles.join("、") + "。补齐之前无法发起研讨。" })
        ] }) : null,
        grouped.map(({ group, seats: groupSeats }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "mmd-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-group-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h4", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-role-badge", style: { background: group.color }, children: group.icon }),
              group.title
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-count", children: groupSeats.length + "/" + group.max }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-spacer" }),
            groupSeats.length < group.max ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-sm", onClick: () => addSeat(group.role, group.seat), children: "+ 添加" }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", children: group.hint }),
          groupSeats.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", style: { marginTop: 8 }, children: "（暂无座位，本组不参与）" }) : null,
          groupSeats.map((seat) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-seat" + (seat.enabled ? "" : " is-off"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "div",
              {
                className: "mmd-seat-av",
                title: "点击上传头像图片",
                onClick: () => {
                  pendingSeat.current = seat.key;
                  fileRef.current?.click();
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Avatar, { seatKey: seat.key, label: seat.label || seat.key, size: 48, version: avatars[seat.key] })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-seat-body", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-seat-line", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", style: { flex: "1 1 150px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "显示名" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      className: "mmd-input",
                      value: seat.label,
                      placeholder: seat.key,
                      onChange: (event) => patchSeat(seat.key, { label: event.target.value })
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "Provider 路由" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                    "select",
                    {
                      className: "mmd-select",
                      value: seat.provider,
                      onChange: (event) => {
                        const provider = event.target.value;
                        patchSeat(seat.key, { provider, model: modelsOf(provider)[0]?.id ?? "" });
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "（未选择）" }),
                        providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: provider.id, children: provider.name }, provider.id))
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "模型" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                    "select",
                    {
                      className: "mmd-select",
                      value: seat.model,
                      onChange: (event) => patchSeat(seat.key, { model: event.target.value }),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "（未选择）" }),
                        modelsOf(seat.provider).map((model) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: model.id, children: model.name }, model.id)),
                        seat.model && !modelsOf(seat.provider).some((m) => m.id === seat.model) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: seat.model, children: seat.model + "（已配置，未在目录中）" }) : null
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", style: { maxWidth: 104, flex: "0 0 104px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "温度" }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      className: "mmd-input",
                      type: "number",
                      min: 0,
                      max: 2,
                      step: 0.1,
                      value: seat.temperature,
                      onChange: (event) => patchSeat(seat.key, { temperature: Number(event.target.value) })
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "mmd-check", style: { paddingBottom: 7 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked: seat.enabled, onChange: (event) => patchSeat(seat.key, { enabled: event.target.checked }) }),
                  "启用"
                ] }),
                group.max > group.min ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-sm mmd-btn-danger", style: { marginBottom: 4 }, onClick: () => removeSeat(seat.key), children: "移除" }) : null
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "角色提示词（同款模型靠它 + 温度分裂成不同角色，可留空）" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "textarea",
                  {
                    className: "mmd-textarea",
                    value: seat.systemPrompt,
                    placeholder: "例如：你偏好激进、直接的落地路径。",
                    onChange: (event) => patchSeat(seat.key, { systemPrompt: event.target.value })
                  }
                )
              ] })
            ] })
          ] }, seat.key))
        ] }, group.role)),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "mmd-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-group-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h4", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-role-badge", style: { background: "#d97706" }, children: "⚙" }),
              "执行方式"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-spacer" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-count", children: "已选 " + allowedTools.length + " 个工具" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-mode-cards", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-mode-card" + (mode === "confirm" ? " is-on" : ""), onClick: () => {
              setMode("confirm");
              setDirty(true);
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", name: "mmd-mode", checked: mode === "confirm", onChange: () => {
                setMode("confirm");
                setDirty(true);
              }, style: { marginTop: 3 } }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "执行前先问我" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "计划涉及改动时停下来，等你点「批准并执行」才会动手。" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-mode-card" + (mode === "auto" ? " is-on" : ""), onClick: () => {
              setMode("auto");
              setDirty(true);
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", name: "mmd-mode", checked: mode === "auto", onChange: () => {
                setMode("auto");
                setDirty(true);
              }, style: { marginTop: 3 } }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "直接执行" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "计划生成后不再询问，立刻交给执行模型。" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "mmd-hint", style: { marginTop: 12 }, children: [
            "执行模型默认没有任何工具，只能给步骤说明。下面的目录来自宿主当前可用的工具；勾得越多它能做的事越多，",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "写文件 / 跑命令这类会改动机器的工具请谨慎勾选" }),
            "。"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-tool-toolbar", children: [
            TOOL_PRESETS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-sm", title: item.hint, onClick: () => applyToolPreset(item.pick), children: item.label }, item.key)),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-spacer" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "mmd-input mmd-btn-sm",
                style: { maxWidth: 180 },
                placeholder: "搜索工具…",
                value: toolQuery,
                onChange: (event) => setToolQuery(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-tool-cat", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-sec-label", children: "全部工具（" + (tools.length > 0 ? tools.length : FALLBACK_TOOLS.length) + " 个可选）" }),
            toolCats.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-tool-cat", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-sec-label", children: cat.title }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-chips", children: cat.names.map((name2) => {
                const on = allowedTools.includes(name2);
                const risky = !READ_ONLY.has(name2);
                return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                  "span",
                  {
                    className: "mmd-chip" + (on ? " is-on" : "") + (risky ? " is-warn" : ""),
                    title: risky ? "这个工具会改动东西" : "只读工具",
                    onClick: () => toggleTool(name2, !on),
                    children: [
                      on ? "✓ " : "",
                      name2
                    ]
                  },
                  name2
                );
              }) })
            ] }, cat.key)),
            toolCats.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "mmd-hint", children: "没有匹配的工具。" }) : null,
            customTools.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-tool-cat", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-sec-label", children: "白名单里额外写死的名字" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-chips", children: customTools.map((name2) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "mmd-chip is-on", onClick: () => toggleTool(name2, false), children: [
                "✓ ",
                name2
              ] }, name2)) })
            ] }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "mmd-seat-line", style: { marginTop: 14 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-field", style: { maxWidth: 160 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "执行步数上限" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                className: "mmd-input",
                type: "number",
                min: 1,
                max: 60,
                value: maxSteps,
                onChange: (event) => {
                  setMaxSteps(Number(event.target.value));
                  setDirty(true);
                }
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mmd-save", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-primary", disabled: saving, onClick: () => void save(), children: saving ? "保存中…" : "保存" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "mmd-btn", disabled: saving, onClick: () => void load(), children: "重新读取" }),
          dirty ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "mmd-status mmd-warn", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-dot-unsaved" }),
            " 有未保存的改动"
          ] }) : null,
          status ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mmd-status mmd-ok", children: status }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            ref: fileRef,
            type: "file",
            accept: "image/png,image/jpeg,image/webp,image/gif",
            onChange: (event) => {
              const file = event.target.files?.[0];
              const key = pendingSeat.current;
              event.target.value = "";
              if (file && key) void uploadAvatar(key, file);
            }
          }
        )
      ] });
    }
    var FALLBACK_TOOLS = ["read", "write", "edit", "read_image", "glob", "grep", "pwsh", "bash", "todo_write", "web_search", "web_fetch", "job_list", "present"];

    // ../dsh-multi-round-discussion/plugin/client-src/chat.tsx
    var import_react3 = require("react");
    var import_jsx_runtime3 = require("react/jsx-runtime");
    var PHASE_TEXT = {
      idle: "空闲",
      clarifying: "正在判断需求",
      "awaiting-user": "等你补充信息",
      proposing: "讨论者独立提案中",
      reviewing: "互相评议中",
      deciding: "主导模型决策中",
      planning: "生成执行计划",
      executing: "执行中",
      verifying: "验证中",
      finalizing: "汇总答复",
      completed: "已完成",
      failed: "失败",
      stopped: "已停止"
    };
    var ROLE_TEXT = {
      decisionMaker: "主导模型",
      proposer: "讨论者",
      reviewer: "评审",
      executor: "执行模型",
      verifier: "验证"
    };
    function stamp(at) {
      if (!Number.isFinite(at) || at <= 0) return "";
      const d = new Date(at);
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    function roundOfProposal(id) {
      const match = /^proposal-r(\d+)-/.exec(id);
      return match ? Number(match[1]) : 1;
    }
    function Section(props) {
      const { label, values } = props;
      if (!values || values.length === 0) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-sec-label", children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { children: values.map((value, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("li", { children: value }, index)) })
      ] });
    }
    function DiscussionView() {
      const [runs, setRuns] = (0, import_react3.useState)([]);
      const [activeId, setActiveId] = (0, import_react3.useState)("");
      const [run, setRun] = (0, import_react3.useState)(null);
      const [names, setNames] = (0, import_react3.useState)({});
      const [avatars, setAvatars] = (0, import_react3.useState)({});
      const [error, setError] = (0, import_react3.useState)("");
      const [draft, setDraft] = (0, import_react3.useState)("");
      const [busy, setBusy] = (0, import_react3.useState)(false);
      const [clarify, setClarify] = (0, import_react3.useState)("");
      const bodyRef = (0, import_react3.useRef)(null);
      const loadMeta = (0, import_react3.useCallback)(async () => {
        try {
          const data = await api.settings();
          const map = {};
          for (const profile of data.profiles ?? []) map[profile.id] = profile.label ?? profile.id;
          setNames(map);
          setAvatars(data.avatars ?? {});
        } catch {
        }
      }, []);
      const loadRuns = (0, import_react3.useCallback)(async (preferId) => {
        try {
          const data = await api.runs();
          const list = data.runs ?? [];
          setRuns(list);
          setActiveId((current) => preferId || current || (list[0]?.runId ?? ""));
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      }, []);
      (0, import_react3.useEffect)(() => {
        void loadMeta();
        void loadRuns();
      }, [loadMeta, loadRuns]);
      (0, import_react3.useEffect)(() => {
        const off = subscribeEvents(
          (list) => setRuns(list),
          (next) => {
            setRuns((current) => [next, ...current.filter((r) => r.runId !== next.runId)]);
            setRun((current) => current && current.runId === next.runId ? next : current);
          }
        );
        const timer = setInterval(() => {
          void loadRuns();
          void loadMeta();
        }, 4e3);
        return () => {
          off();
          clearInterval(timer);
        };
      }, [loadRuns, loadMeta]);
      (0, import_react3.useEffect)(() => {
        if (!activeId) {
          setRun(null);
          return;
        }
        let alive = true;
        const pull = () => api.run(activeId).then((data) => {
          if (alive) setRun(data.run);
        }).catch(() => {
        });
        void pull();
        const timer = setInterval(pull, 1500);
        return () => {
          alive = false;
          clearInterval(timer);
        };
      }, [activeId]);
      const nameOf = (profileId) => names[profileId] ?? run?.participants?.find((p) => p.profileId === profileId)?.label ?? profileId;
      const roleOf = (profileId) => run?.participants?.find((p) => p.profileId === profileId)?.role ?? "";
      const messages = (0, import_react3.useMemo)(() => {
        if (!run) return [];
        const bb = run.blackboard ?? {};
        const proposals = bb.proposals ?? [];
        const reviews = bb.reviews ?? [];
        const decisions = bb.decisions ?? (bb.decision ? [bb.decision] : []);
        const items = [];
        items.push({ kind: "request", id: "request", text: run.request });
        const rounds = [...new Set(proposals.map((p) => roundOfProposal(p.id)))].sort((a, b) => a - b);
        const indexOf = new Map(proposals.map((p, index) => [p.id, index + 1]));
        for (const round of rounds) {
          items.push({ kind: "divider", id: `d-propose-${round}`, text: `第 ${round} 轮 · 独立提案` });
          for (const proposal of proposals.filter((p) => roundOfProposal(p.id) === round)) {
            items.push({ kind: "proposal", id: proposal.id, proposal, label: `P${indexOf.get(proposal.id)}` });
          }
          const roundReviews = reviews.filter((review) => review.round === round);
          if (roundReviews.length > 0) {
            items.push({ kind: "divider", id: `d-review-${round}`, text: `第 ${round} 轮 · 互相评议` });
            for (const review of roundReviews) {
              items.push({
                kind: "review",
                id: review.id,
                review,
                target: `P${indexOf.get(review.targetProposalId) ?? "?"}`
              });
            }
          }
          const decision = decisions.find((d) => d.round === round);
          if (decision) items.push({ kind: "decision", id: decision.id, decision });
        }
        if (bb.plan) items.push({ kind: "plan", id: `plan-${bb.plan.id}`, plan: bb.plan });
        if (bb.execution) items.push({ kind: "execution", id: `exec-${bb.execution.planId}`, execution: bb.execution });
        if (bb.verification) items.push({ kind: "verification", id: `verify-${bb.verification.planId}`, verification: bb.verification });
        for (const notice of run.notices ?? []) {
          items.push({ kind: "notice", id: notice.id, notice });
        }
        if (bb.finalAnswer) items.push({ kind: "answer", id: "answer", text: bb.finalAnswer });
        return items;
      }, [run]);
      (0, import_react3.useEffect)(() => {
        const node = bodyRef.current;
        if (node) node.scrollTop = node.scrollHeight;
      }, [messages.length, run?.phase, run?.revision]);
      const removeRun = async () => {
        if (!run) return;
        try {
          await api.removeRun(run.runId);
          const list = (await api.runs()).runs ?? [];
          setRuns(list);
          setActiveId(list[0]?.runId ?? "");
          setRun(null);
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      };
      const control = async (payload) => {
        if (!run) return;
        try {
          await api.control(run.runId, payload);
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        }
      };
      const start = async () => {
        const request2 = draft.trim();
        if (!request2) return;
        setBusy(true);
        setError("");
        try {
          const created = await api.start({ request: request2 });
          setDraft("");
          await loadRuns(created.run?.runId);
        } catch (cause) {
          setError(String(cause?.message ?? cause));
        } finally {
          setBusy(false);
        }
      };
      const thinking = (run?.participants ?? []).filter((p) => p.state === "thinking");
      const awaitingApproval = run?.phase === "planning" && !!run?.pendingQuestion;
      const awaitingUser = run?.phase === "awaiting-user";
      const settled = ["completed", "failed", "stopped"].includes(run?.phase ?? "");
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-root", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-chat", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-chat-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-chat-title", children: "多模型研讨" }),
            run ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-chat-sub", children: PHASE_TEXT[run.phase] ?? run.phase }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { className: "mmd-select", value: activeId, onChange: (event) => setActiveId(event.target.value), children: [
              runs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "（暂无研讨）" }) : null,
              runs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("option", { value: item.runId, children: [
                stamp(item.startedAt),
                " · ",
                (item.request ?? "").slice(0, 20),
                " · ",
                PHASE_TEXT[item.phase] ?? item.phase
              ] }, item.runId))
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-spacer" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn", disabled: !run || settled, onClick: () => void control({ kind: "stop" }), children: "叫停" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn", disabled: !run || run.phase !== "proposing", onClick: () => void control({ kind: "skip-review" }), children: "跳过评议" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                type: "button",
                className: "mmd-btn mmd-btn-danger",
                disabled: !run,
                title: "从历史记录里删除这次研讨",
                onClick: () => {
                  void removeRun();
                },
                children: "删除"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-compose", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "input",
              {
                className: "mmd-input",
                style: { flex: 1 },
                value: draft,
                placeholder: "提出一个问题，让多个模型分别出方案、再互相评议…",
                onChange: (event) => setDraft(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void start();
                  }
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-primary", disabled: busy || !draft.trim(), onClick: () => void start(), children: busy ? "发起中…" : "发起研讨" })
          ] }),
          awaitingApproval ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-approve", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "计划已生成，等你批准" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-chat-sub", children: "批准后执行模型才会动手。" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-spacer" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-primary", onClick: () => void control({ kind: "approve-plan" }), children: "批准并执行" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-danger", onClick: () => void control({ kind: "stop" }), children: "不执行" })
          ] }) : null,
          awaitingUser ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-approve", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "需要补充信息" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { className: "mmd-input", style: { flex: 1, minWidth: 200 }, value: clarify, onChange: (event) => setClarify(event.target.value), placeholder: run?.pendingQuestion ?? "" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "mmd-btn mmd-btn-primary", onClick: () => {
              void control({ kind: "supply-clarification", answer: clarify });
              setClarify("");
            }, children: "回答" })
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-chat-body", ref: bodyRef, children: [
            error ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble mmd-bubble-sys mmd-bad", children: [
              "✕ ",
              error
            ] }) : null,
            !run ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-empty", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontWeight: 600, marginBottom: 6 }, children: "还没有研讨记录" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { children: "在下面输入一个问题，讨论者会分别独立提案，然后互相评议，最后由主导模型给出结论。" })
            ] }) : null,
            messages.map((item) => {
              if (item.kind === "divider") return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-divider", children: item.text }, item.id);
              if (item.kind === "request") {
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row mmd-row-mine", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: "__user", label: "我" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: "我" }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-tag", children: "提问" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble mmd-bubble-mine", children: item.text })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "proposal") {
                const p = item.proposal;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: p.profileId, label: nameOf(p.profileId), version: avatars[p.profileId] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: nameOf(p.profileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        ROLE_TEXT[roleOf(p.profileId)] ?? "提案",
                        " · ",
                        item.label,
                        " · 信心 ",
                        Math.round((p.confidence ?? 0) * 100),
                        "%"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble-title", children: p.summary }),
                      p.plan,
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "理由", values: p.reasons }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "风险", values: p.risks }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "依赖", values: p.dependencies })
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "review") {
                const rv = item.review;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: rv.reviewerProfileId, label: nameOf(rv.reviewerProfileId), version: avatars[rv.reviewerProfileId] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: nameOf(rv.reviewerProfileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        "评议 ",
                        item.target,
                        " · 信心 ",
                        Math.round((rv.confidence ?? 0) * 100),
                        "%"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "认可", values: rv.pros }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "质疑", values: rv.cons }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "建议", values: rv.suggestions })
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "decision") {
                const d = item.decision;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: d.decisionMakerProfileId, label: nameOf(d.decisionMakerProfileId), version: avatars[d.decisionMakerProfileId] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: d.decisionMakerProfileId === "user" ? "你" : nameOf(d.decisionMakerProfileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        "拍板 · 采纳 ",
                        d.chosenProposalIds?.length ?? 0,
                        " 个方案"
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble mmd-bubble-lead", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble-title", children: "结论方向" }),
                      d.finalDirection,
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "取舍理由", values: [d.rationale] })
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "plan") {
                const plan = item.plan;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: plan.planBuilderProfileId ?? "__plan", label: "计划", version: avatars[plan.planBuilderProfileId ?? ""] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: nameOf(plan.planBuilderProfileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        "执行计划 · ",
                        plan.steps?.length ?? 0,
                        " 步",
                        plan.mutatesState ? " · 会改变系统状态" : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble", children: [
                      (plan.steps ?? []).map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { marginBottom: 6 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
                          index + 1,
                          ". ",
                          step.description
                        ] }),
                        step.tool ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                          "（",
                          step.tool,
                          "）"
                        ] }) : null,
                        step.acceptance ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-sec-label", children: [
                          "验收：",
                          step.acceptance
                        ] }) : null
                      ] }, step.id)),
                      plan.notes ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "说明", values: [plan.notes] }) : null
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "execution") {
                const execution = item.execution;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: execution.executorProfileId ?? "__exec", label: "执行", version: avatars[execution.executorProfileId ?? ""] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: nameOf(execution.executorProfileId) }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        "执行结果 · ",
                        execution.status,
                        execution.stoppedReason ? ` · ${execution.stoppedReason}` : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble mmd-bubble-exec", children: (execution.outputs ?? []).map((output, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { marginBottom: 6 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("strong", { children: [
                        "第 ",
                        index + 1,
                        " 步 · ",
                        output.status
                      ] }),
                      output.error ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bad", children: output.error }) : null,
                      output.rendered ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { children: String(output.rendered).slice(0, 1200) }) : null
                    ] }, output.stepId)) })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "verification") {
                const verification = item.verification;
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: verification.verifierProfileId ?? "__verify", label: "验证", version: avatars[verification.verifierProfileId ?? ""] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: verification.verifierProfileId ? nameOf(verification.verifierProfileId) : "验证" }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mmd-tag", children: [
                        verification.passed ? "通过" : "未通过",
                        " · ",
                        verification.recommendedAction
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-bubble", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "问题", values: verification.issues }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Section, { label: "建议", values: verification.suggestions }),
                      verification.skipped ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-sec-label", children: "（本次未实际验证）" }) : null
                    ] })
                  ] })
                ] }, item.id);
              }
              if (item.kind === "notice") {
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-row", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-col", style: { maxWidth: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble mmd-bubble-sys", children: item.notice.message }) }) }, item.id);
              }
              if (item.kind === "answer") {
                return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: run?.blackboard?.decision?.decisionMakerProfileId ?? "__lead", label: "主导", version: avatars[run?.blackboard?.decision?.decisionMakerProfileId ?? ""] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-col", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-meta", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-name", children: "主导模型" }),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-tag", children: "最终答复" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bubble mmd-bubble-lead", children: item.text })
                  ] })
                ] }, item.id);
              }
              return null;
            }),
            thinking.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Avatar, { seatKey: thinking[0].profileId, label: nameOf(thinking[0].profileId), version: avatars[thinking[0].profileId] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-col", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-thinking", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-dot" }),
                thinking.map((p) => nameOf(p.profileId)).join("、"),
                " 正在思考…"
              ] }) })
            ] }) : null
          ] })
        ] }),
        run ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mmd-cost", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "用量" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            "总 token：",
            run.cost?.totalTokens ?? 0
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            "成本：$",
            (run.cost?.totalCostUsd ?? 0).toFixed(4)
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mmd-bar", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { style: { width: `${Math.min(100, run.cost?.budget?.maxTotalTokens ? run.cost.totalTokens / run.cost.budget.maxTotalTokens * 100 : 0)}%` } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "模型" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "调用" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: "token" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: (run.cost?.byProfile ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { title: `${row.provider}/${row.model}`, children: row.label ?? row.profileId }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: row.calls }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: row.inputTokens + row.outputTokens })
            ] }, row.profileId)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { style: { marginTop: 16 }, children: "参与模型" }),
          (run.participants ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `mmd-dot mmd-dot-${p.state === "thinking" ? "" : p.state}` }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: nameOf(p.profileId) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mmd-tag", children: ROLE_TEXT[p.role] ?? p.role })
          ] }, p.profileId))
        ] }) : null
      ] });
    }

    // ../dsh-multi-round-discussion/plugin/client-src/index.tsx
    var name = "multi-model-discussion/client";
    var inject = ["slots"];
    function apply(ctx) {
      injectStyles();
      const slots = ctx.slots;
      if (!slots) {
        ctx.logger?.("multi-model-discussion/client")?.info?.("composition has no slots service; the discussion UI is not mounted");
        return;
      }
      slots.inject(
        "settings.section",
        () => slots.register(
          { name: "settings.section", id: "multi-model-discussion", order: 30, label: "研讨模式" },
          SettingsSection
        )
      );
      slots.inject(
        "conversation.view",
        () => slots.register(
          { name: "conversation.view", id: "multi-model-discussion", order: 100, label: "多模型研讨" },
          DiscussionView
        )
      );
    }

    return module.exports;
  },
});
