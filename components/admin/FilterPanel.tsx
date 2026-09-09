"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function FilterPanel({ children, title = "Filtres et tri", onReset }: { children: ReactNode; title?: string; onReset?: () => void }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const query = matchMedia("(max-width: 1023px)");
    const update = () => { setMobile(query.matches); if (!query.matches) setOpen(false); };
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!mobile || !open) return;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); trigger.current?.focus({ preventScroll: true }); };
  }, [mobile, open]);
  const controls = <div className="admin-filter-fields">{children}</div>;
  return <div className="admin-filter-panel">
    <button ref={trigger} type="button" className="admin-filter-trigger lg:hidden" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M7 12h10M10 17h4" /></svg>{title}
    </button>
    {mobile ? <dialog ref={ref} className="admin-filter-dialog" aria-labelledby={id} onCancel={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="admin-filter-inner">
        <header><h2 id={id}>{title}</h2><button autoFocus type="button" aria-label="Fermer les filtres" onClick={() => setOpen(false)}>✕</button></header>
        <p className="px-4 pt-3 text-xs text-neutral-500">Les résultats se mettent à jour avec vos choix.</p>
        {controls}
        <footer>{onReset && <button type="button" onClick={onReset}>Réinitialiser</button>}<button type="button" className="admin-primary" onClick={() => setOpen(false)}>Voir les résultats</button></footer>
      </div>
    </dialog> : controls}
  </div>;
}
