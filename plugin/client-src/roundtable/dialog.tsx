import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function TableDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="mmd-table-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="mmd-table-drawer" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
        if (event.key !== 'Tab') return;
        const nodes = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') ?? [])];
        if (!nodes.length) { event.preventDefault(); return; }
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
      }}>
      <header><b>{title}</b><button type="button" className="mmd-btn mmd-btn-sm" onClick={onClose} aria-label="关闭面板">关闭</button></header>
      {children}
    </div>
  </div>;
}
