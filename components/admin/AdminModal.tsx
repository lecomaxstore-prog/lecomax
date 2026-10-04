"use client";
import { useEffect, useId, useRef, type HTMLAttributes } from "react";

/** Adds keyboard containment to existing dismissible overlays without changing their actions. */
export default function AdminModal({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement;
    const heading = root.querySelector('h1,h2,h3');
    if (heading) { if (!heading.id) heading.id = titleId; root.setAttribute('aria-labelledby', heading.id); }
    root.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      // A nested native confirmation dialog owns its own keyboard events.
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') { event.preventDefault(); root.click(); }
      if (event.key !== 'Tab') return;
      const fields = [...root.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = fields[0], last = fields.at(-1);
      if (!first) { event.preventDefault(); root.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    root.addEventListener('keydown', keydown);
    return () => { root.removeEventListener('keydown', keydown); if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, [titleId]);
  return <div {...props} className={`admin-dialog-overlay ${className}`} ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={props['aria-label'] ?? 'Fenêtre d’administration'}>{children}</div>;
}
