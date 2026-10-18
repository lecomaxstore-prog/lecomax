"use client";
import { useEffect, useRef, useState } from "react";
import { parseProductPaste, pasteFieldLabels, type PastedProduct } from "@/lib/product-paste";

export default function ProductPasteImport({ onApply }: { onApply: (fields: PastedProduct) => void }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof parseProductPaste> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  function cancelAnalysis() {
    request.current?.abort(); request.current = null; setLoading(false);
  }
  async function analyzeWithAI() {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 55_000);
    setLoading(true); setError(""); setNotice(""); setResult(null);
    try {
      const response = await fetch("/api/admin/products/parse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }), signal: controller.signal,
      });
      const data = await response.json();
      if (request.current !== controller) return;
      if (!response.ok) throw new Error(data.error || "Analyse indisponible.");
      if (!data.fields || typeof data.fields !== "object" || Array.isArray(data.fields) || !Array.isArray(data.warnings)
        || !Object.entries(data.fields).every(([key, value]) => Object.hasOwn(pasteFieldLabels, key) && typeof value === "string")
        || !data.warnings.every((value: unknown) => typeof value === "string")) throw new Error("Réponse invalide. Réessayez.");
      setResult(data); setSelected(Object.keys(data.fields));
      setNotice("Analyse GPT-6.1 Sol terminée. Vérifiez chaque champ avant de l’appliquer.");
    } catch (cause) {
      if (request.current === controller) setError(controller.signal.aborted ? "L’analyse a pris trop de temps. Réessayez." : cause instanceof Error ? cause.message : "Connexion indisponible.");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) { request.current = null; setLoading(false); }
    }
  }
  function analyze() {
    setError(""); setNotice(""); setResult(null);
    try { const parsed = parseProductPaste(text); setResult(parsed); setSelected(Object.keys(parsed.fields)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Texte non reconnu."); }
  }
  return <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
    <div><span className="mb-2 inline-flex rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800">GPT-6.1 Sol</span><h3 className="text-sm font-semibold text-[#173e30]">Collez vos informations, l’IA les organise</h3><p className="mt-1 text-xs leading-5 text-neutral-600">Collez la réponse de ChatGPT, une description libre ou des notes. GPT-6.1 Sol repère les informations présentes et les associe aux champs du produit.</p></div>
    <details className="rounded-xl border border-emerald-100 bg-white p-3"><summary className="cursor-pointer text-xs font-semibold text-emerald-800">Format à demander à ChatGPT</summary><p className="mt-3 select-text whitespace-pre-wrap text-xs leading-6 text-neutral-700">{"Présente les informations connues avec ces libellés, un champ par ligne. N’invente aucune information et omets les champs inconnus. Prix en MAD, poids en kg.\n\nNom du produit :\nMarque :\nDescription :\nCatégorie : homme / femme / chaussures / accessoires\nPrix :\nAncien prix :\nStock :\nTags :\nPoids (kg) :"}</p><p className="mt-2 text-xs text-neutral-500">Le JSON, les libellés en gras et les tableaux simples à deux colonnes sont aussi acceptés. Images, tailles et couleurs se renseignent dans leurs sections.</p></details>
    <div><label htmlFor="chatgpt-product-paste" className="mb-2 block text-xs font-semibold text-neutral-700">Réponse de ChatGPT</label><textarea id="chatgpt-product-paste" rows={7} maxLength={20000} value={text} onChange={event => { cancelAnalysis(); setText(event.target.value); setResult(null); setError(""); setNotice(""); }} placeholder={"Nom du produit : Sac de sport\nDescription : Sac de 30 litres avec poche chaussures.\nPrix : 249 MAD\nStock : 3\nTags : sport, sac"} className="w-full resize-y rounded-xl border border-neutral-200 bg-white p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-emerald-700" /></div>
    <p className="text-[11px] leading-5 text-neutral-500">L’analyse IA envoie ce texte à OpenAI. Vous validez les champs avant tout remplacement.</p>
    <button type="button" disabled={loading || text.trim().length < 10} onClick={analyzeWithAI} className="min-h-12 w-full rounded-xl bg-[#173e30] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{loading ? "Analyse en cours…" : "Analyser avec GPT-6.1 Sol"}</button>
    <button type="button" disabled={loading || !text.trim()} onClick={analyze} className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 disabled:opacity-40">Détecter sans IA (texte structuré)</button>
    {error && <p role="alert" className="text-xs leading-5 text-red-700">{error}</p>}
    {result && <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-semibold text-neutral-900">Champs à remplir</p><p className="text-xs leading-5 text-neutral-600">Seuls les champs cochés seront remplacés. Les informations absentes restent inchangées.</p>
      {Object.entries(result.fields).map(([key, value]) => <label key={key} className="flex items-start gap-3 border-t border-neutral-100 pt-3"><input type="checkbox" checked={selected.includes(key)} onChange={event => setSelected(current => event.target.checked ? [...current, key] : current.filter(field => field !== key))} className="mt-1 h-4 w-4 shrink-0 accent-emerald-800" /><span className="min-w-0"><span className="block text-xs font-semibold text-neutral-600">{pasteFieldLabels[key as keyof PastedProduct]}</span><span className="mt-1 block max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-neutral-800">{value}</span></span></label>)}
      {result.warnings.length > 0 && <ul className="space-y-1 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
      <button type="button" disabled={!selected.length} onClick={() => { onApply(Object.fromEntries(Object.entries(result.fields).filter(([key]) => selected.includes(key)))); setResult(null); setNotice("Informations ajoutées au formulaire. Vérifiez-les puis enregistrez le produit."); }} className="min-h-11 w-full rounded-xl bg-[#173e30] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Remplir les champs sélectionnés</button>
    </div>}
    <p role="status" className="text-xs leading-5 text-emerald-800">{notice}</p>
  </div>;
}
