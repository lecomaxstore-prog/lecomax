"use client";

import { useEffect } from "react";

/** Protect reloads and ordinary in-app links. Call confirm explicitly for router actions. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.download || event.ctrlKey || event.metaKey) return;
      if (link.href === window.location.href || link.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm("Des modifications ne sont pas enregistrées. Quitter sans enregistrer ?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);
}
