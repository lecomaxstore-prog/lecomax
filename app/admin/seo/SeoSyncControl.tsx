"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Run = { state: string; startedAt: string | null; finishedAt: string | null;
  completed: number; failed: number; superseded: number; error: string | null;
  budgetExhausted: boolean; batchLimitReached: boolean };
const labels: Record<string, string> = { idle: "Aucun passage", running: "En cours", completed: "Terminé",
  partial: "Lot terminé — travail restant possible", failed: "Échec", interrupted: "Interrompu — délai dépassé" };
export default function SeoSyncControl({ onComplete }: { onComplete: () => Promise<void> }) {
  const [run, setRun] = useState<Run | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const inFlight = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/seo/sync", { cache: "no-store", signal: AbortSignal.timeout(8_000) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "État indisponible.");
      setRun(body.run); setEnabled(body.enabled); setStatusError("");
    } catch { setStatusError("État indisponible. Actualisez avant de lancer une synchronisation."); setEnabled(false); }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 5_000); return () => clearInterval(timer); }, [refresh]);
  async function start() {
    if (inFlight.current || !enabled || run?.state === "running") return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/seo/sync", { method: "POST", signal: AbortSignal.timeout(56_000) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Synchronisation impossible.");
      await onComplete();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Résultat inconnu. Actualisez avant de réessayer."); }
    finally { await refresh(); inFlight.current = false; setBusy(false); }
  }
  return <section aria-label="Exécution du worker SEO" aria-busy={busy || run?.state === "running"}>
    <button disabled={!enabled || busy || run?.state === "running"} onClick={() => void start()}>
      {busy || run?.state === "running" ? "Synchronisation en cours…" : "Run SEO Sync"}
    </button>
    {!enabled && !statusError && <p>Exécution manuelle désactivée jusqu’à la configuration et l’approbation de production.</p>}
    {statusError && <p role="alert">{statusError}</p>}{error && <p role="alert">{error}</p>}
    {run && <div role="status" aria-live="polite">
      <p>État : {labels[run.state] ?? "Inconnu"}</p>
      <p>Dernier lancement : {run.startedAt ? new Date(run.startedAt).toLocaleString("fr-FR") : "Jamais"}</p>
      <p>Fin : {run.finishedAt ? new Date(run.finishedAt).toLocaleString("fr-FR") : "—"}</p>
      <p>{run.completed} fiches traitées · {run.failed} échecs · {run.superseded} travaux remplacés</p>
      {run.error && <p>Erreur : {run.error}</p>}
      {(run.budgetExhausted || run.batchLimitReached) && <p>Limite du passage atteinte. Le travail restant est conservé pour un prochain passage.</p>}
    </div>}
  </section>;
}
