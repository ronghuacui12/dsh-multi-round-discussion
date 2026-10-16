/**
 * Injected once per page; every class is namespaced \`mmd-\`.
 *
 * Design notes:
 *  - Everything derives from the host theme variables when they exist
 *    (\`--dsh-color-*\`) and falls back to a neutral palette otherwise, so the
 *    panel looks native in both light and dark DSH themes.
 *  - The chat is a real chat: header on top, scrolling transcript in the
 *    middle, and the composer / approval bar docked at the BOTTOM. Approvals
 *    therefore appear where the operator is already looking instead of above
 *    the transcript.
 */
import { ROUNDTABLE_CSS } from './roundtable/styles';

export const STYLE_ID = 'dsh-mmd-styles';

export const CSS = `
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

export function injectStyles(): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS + ROUNDTABLE_CSS;
  document.head.appendChild(el);
}
