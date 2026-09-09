"use client";
import { useRef, type ReactNode } from "react";

/** Fields stay mounted, so uploads, form state and native validation survive collapse. */
export default function MobileSection({ title, children, defaultOpen = false, id }: { title: string; children: ReactNode; defaultOpen?: boolean; id?: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  return <details id={id} ref={ref} open={defaultOpen || undefined} className="admin-mobile-section" onInvalidCapture={event => {
    if (ref.current) ref.current.open = true;
    const field = event.target;
    requestAnimationFrame(() => { if (field instanceof HTMLElement) { field.focus(); field.scrollIntoView({ block: "center" }); } });
  }}>
    <summary>{title}<svg className="admin-section-chevron" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></summary>
    <div className="admin-section-body">{children}</div>
  </details>;
}
