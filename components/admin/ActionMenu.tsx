import type { ReactNode } from "react";

export default function ActionMenu({ label, children }: { label: string; children: ReactNode }) {
  return <details className="admin-action-menu">
    <summary aria-label={label}><span aria-hidden="true">•••</span><span className="sr-only">{label}</span></summary>
    <div className="flex flex-wrap items-center gap-3 pt-2">{children}</div>
  </details>;
}
