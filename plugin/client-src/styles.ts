/** Injected once per page; every class is namespaced `mmd-`. */
export const STYLE_ID = 'dsh-mmd-styles';

export const CSS = `
.mmd-root { --mmd-bg: var(--dsh-color-bg, #fff); --mmd-fg: var(--dsh-color-fg, #1f2328);
  --mmd-muted: var(--dsh-color-fg-muted, #6b7280); --mmd-line: var(--dsh-color-border, rgba(127,127,127,.25));
  --mmd-panel: var(--dsh-color-bg-subtle, rgba(127,127,127,.06));
  display: flex; height: 100%; min-height: 0; font-size: 13px; color: var(--mmd-fg); }

/* ---------------------------------------------------------------- chat shell */
.mmd-chat { display: flex; flex-direction: column; flex: 1; min-width: 0; height: 100%; }
.mmd-chat-head { display: flex; align-items: center; gap: 10px; padding: 10px 16px;
  border-bottom: 1px solid var(--mmd-line); flex: 0 0 auto; flex-wrap: wrap; }
.mmd-chat-title { font-weight: 600; font-size: 14px; }
.mmd-chat-sub { color: var(--mmd-muted); font-size: 12px; }
.mmd-chat-body { flex: 1 1 auto; overflow-y: auto; padding: 16px 16px 132px; scroll-behavior: smooth; }
.mmd-compose { display: flex; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--mmd-line); align-items: center; }
.mmd-chat-foot { flex: 0 0 auto; border-top: 1px solid var(--mmd-line); padding: 10px 16px; }

/* ------------------------------------------------------------------ messages */
.mmd-row { display: flex; gap: 10px; margin-bottom: 16px; align-items: flex-start; }
.mmd-row-mine { flex-direction: row-reverse; }
.mmd-avatar { width: 38px; height: 38px; border-radius: 50%; flex: 0 0 auto; overflow: hidden;
  background: var(--mmd-panel); display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 15px; color: #fff; user-select: none; }
.mmd-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mmd-col { min-width: 0; max-width: 82%; }
.mmd-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.mmd-row-mine .mmd-meta { flex-direction: row-reverse; }
.mmd-name { font-weight: 600; font-size: 12.5px; }
.mmd-tag { font-size: 11px; color: var(--mmd-muted); }
.mmd-bubble { border: 1px solid var(--mmd-line); border-radius: 12px; padding: 9px 12px;
  background: var(--mmd-panel); white-space: pre-wrap; word-break: break-word; line-height: 1.65; }
.mmd-bubble-mine { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.35); }
.mmd-bubble-lead { border-color: rgba(22,163,74,.4); background: rgba(22,163,74,.08); }
.mmd-bubble-exec { border-color: rgba(217,119,6,.4); background: rgba(217,119,6,.08); }
.mmd-bubble-sys { border-style: dashed; background: transparent; color: var(--mmd-muted); font-size: 12px; }
.mmd-bubble-title { font-weight: 600; margin-bottom: 6px; }
.mmd-bubble section { margin-top: 8px; }
.mmd-sec-label { font-size: 11.5px; color: var(--mmd-muted); margin-bottom: 2px; }
.mmd-bubble ul { margin: 0; padding-left: 18px; }
.mmd-divider { display: flex; align-items: center; gap: 10px; margin: 20px 0 16px; color: var(--mmd-muted); font-size: 11.5px; }
.mmd-divider::before, .mmd-divider::after { content: ''; flex: 1; height: 1px; background: var(--mmd-line); }
.mmd-thinking { display: inline-flex; align-items: center; gap: 6px; color: var(--mmd-muted); font-size: 12px; }
.mmd-dot { width: 7px; height: 7px; border-radius: 50%; background: #3b82f6; animation: mmd-pulse 1.1s infinite ease-in-out; }
.mmd-dot-done { background: #16a34a; animation: none; }
.mmd-dot-error { background: #dc2626; animation: none; }
.mmd-dot-idle { background: #9ca3af; animation: none; }
@keyframes mmd-pulse { 0%,100% { opacity: .35; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.1); } }
.mmd-empty { padding: 60px 20px; text-align: center; color: var(--mmd-muted); }

/* ------------------------------------------------------------------ controls */
.mmd-btn { border: 1px solid var(--mmd-line); background: var(--mmd-bg); color: var(--mmd-fg);
  border-radius: 8px; padding: 5px 12px; font-size: 12.5px; cursor: pointer; }
.mmd-btn:hover:not(:disabled) { background: var(--mmd-panel); }
.mmd-btn:disabled { opacity: .45; cursor: not-allowed; }
.mmd-btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }
.mmd-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.mmd-btn-danger { border-color: rgba(220,38,38,.5); color: #dc2626; }
.mmd-spacer { flex: 1; }
.mmd-select, .mmd-input { border: 1px solid var(--mmd-line); border-radius: 8px; padding: 5px 8px;
  background: var(--mmd-bg); color: var(--mmd-fg); font-size: 12.5px; max-width: 100%; }
.mmd-approve { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border: 1px solid rgba(217,119,6,.5);
  background: rgba(217,119,6,.1); border-radius: 12px; margin-bottom: 16px; flex-wrap: wrap; }

/* ----------------------------------------------------------------- settings */
.mmd-set { display: flex; flex-direction: column; gap: 22px; padding: 4px 2px 90px; max-width: 880px; }
.mmd-set h3 { margin: 0 0 4px; font-size: 15px; }
.mmd-set h4 { margin: 0 0 10px; font-size: 13.5px; display: flex; align-items: center; gap: 8px; }
.mmd-hint { color: var(--mmd-muted); font-size: 12px; line-height: 1.6; margin: 0; }
.mmd-group { border: 1px solid var(--mmd-line); border-radius: 12px; padding: 14px 16px; }
.mmd-seat { display: flex; gap: 14px; padding: 12px 0; border-top: 1px dashed var(--mmd-line); align-items: flex-start; }
.mmd-seat:first-of-type { border-top: 0; }
.mmd-seat-avatar { position: relative; flex: 0 0 auto; cursor: pointer; }
.mmd-seat-avatar .mmd-avatar { width: 46px; height: 46px; font-size: 18px; }
.mmd-seat-avatar input { display: none; }
.mmd-seat-avatar:hover::after { content: '换头像'; position: absolute; inset: auto 0 -15px 0; text-align: center;
  font-size: 10px; color: var(--mmd-muted); }
.mmd-seat-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.mmd-seat-line { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.mmd-field { display: flex; flex-direction: column; gap: 3px; min-width: 140px; flex: 1; }
.mmd-field > span { font-size: 11.5px; color: var(--mmd-muted); }
.mmd-save { display: flex; align-items: center; gap: 12px; position: sticky; bottom: 0;
  background: var(--mmd-bg); padding: 12px 0; border-top: 1px solid var(--mmd-line); }
.mmd-status { font-size: 12.5px; }
.mmd-ok { color: #16a34a; }
.mmd-bad { color: #dc2626; }
.mmd-warn { color: #d97706; }
.mmd-radio { display: flex; gap: 16px; flex-wrap: wrap; }
.mmd-radio label { display: flex; gap: 6px; align-items: center; font-size: 12.5px; cursor: pointer; }
.mmd-tools { display: flex; gap: 10px 16px; flex-wrap: wrap; }
.mmd-tools label { display: flex; gap: 6px; align-items: center; font-size: 12.5px; cursor: pointer; }
.mmd-cost { flex: 0 0 240px; border-left: 1px solid var(--mmd-line); padding: 14px; overflow-y: auto; }
.mmd-cost h4 { margin: 0 0 10px; font-size: 12.5px; }
.mmd-cost table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.mmd-cost td, .mmd-cost th { text-align: left; padding: 3px 2px; border-bottom: 1px solid var(--mmd-line); }
.mmd-bar { height: 5px; border-radius: 3px; background: var(--mmd-line); overflow: hidden; margin: 4px 0 10px; }
.mmd-bar > i { display: block; height: 100%; background: #2563eb; }
`;

export function injectStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}
