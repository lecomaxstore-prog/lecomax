"use client";
import { useEffect, useRef, useState } from "react";
import { mergeImportedDetails, parseDetailsPaste, validateImportedDetails, type ImportedDetail } from "@/lib/product-details-import";

export default function ProductDetailsImport({ details, onChange }: { details: ImportedDetail[]; onChange: (details: ImportedDetail[]) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<{ before: ImportedDetail[]; after: string } | null>(null);
  const request = useRef<AbortController | null>(null);
  const latest = useRef(details); latest.current = details;
  useEffect(() => () => request.current?.abort(), []);
  function apply(incoming: ImportedDetail[]) {
    if (!incoming.length) throw new Error("Aucun détail détecté dans ce texte.");
    const before = latest.current;
    const after = mergeImportedDetails(before, incoming);
    onChange(after); setUndo({ before, after: JSON.stringify(after) });
    setNotice(`${incoming.length} détail(s) appliqué(s). Vérifiez les lignes puis enregistrez le produit.`);
  }
  async function importDetails(ai: boolean) {
    if (request.current) return;
    setError(""); setNotice("");
    if (!ai) { try { apply(parseDetailsPaste(text)); } catch (e) { setError(e instanceof Error ? e.message : "Texte invalide."); } return; }
    const controller = new AbortController(); request.current = controller; setBusy(true);
    const timeout = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch("/api/admin/products/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, mode: "details" }), signal: controller.signal });
      const data = await response.json();
      if (request.current !== controller) return;
      if (!response.ok) throw new Error(data.error || "Analyse indisponible.");
      apply(validateImportedDetails(data.details));
    } catch (e) {
      if (request.current === controller) setError(controller.signal.aborted ? "Analyse expirée. Réessayez ou utilisez le texte structuré." : e instanceof Error ? e.message : "Analyse indisponible.");
    } finally { clearTimeout(timeout); if (request.current === controller) { request.current = null; setBusy(false); } }
  }
  return <div className="mb-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
    <label htmlFor="product-details-paste" className="block text-sm font-semibold text-emerald-950">Coller les détails de ChatGPT</label>
    <p className="text-xs leading-5 text-neutral-600">Collez tous les détails ici. Les libellés identiques seront mis à jour ; les autres détails seront conservés.</p>
    <textarea id="product-details-paste" value={text} maxLength={20000} rows={4} onChange={event => { request.current?.abort(); request.current = null; setBusy(false); setText(event.target.value); setError(""); setNotice(""); }} placeholder={"Matière : 100 % coton\nCoupe : droite\nEntretien : lavage à 30 °C"} className="w-full min-w-0 rounded-xl border border-neutral-200 bg-white p-3 text-sm" />
    <p className="text-xs leading-5 text-neutral-600">L’IA envoie ce texte à OpenAI et remplit les lignes automatiquement. Vous pouvez les modifier avant l’enregistrement.</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy || text.trim().length < 10} onClick={() => importDetails(true)} className="min-h-11 rounded-xl bg-emerald-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{busy ? "Analyse en cours…" : "Remplir avec l’IA"}</button>
      <button type="button" disabled={busy || !text.trim()} onClick={() => importDetails(false)} className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs disabled:opacity-40">Importer le texte structuré sans IA</button>
      {undo && undo.after === JSON.stringify(details) && <button type="button" onClick={() => { onChange(undo.before); setUndo(null); setNotice("Import annulé."); }} className="min-h-11 px-3 text-xs underline">Annuler l’import</button>}
    </div>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <p role="status" className="text-xs text-emerald-900">{notice}</p>
  </div>;
}
