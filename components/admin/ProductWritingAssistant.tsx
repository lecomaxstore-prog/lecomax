"use client";

import { useEffect, useRef, useState } from "react";

type Draft = { name: string; description: string; tags: string };

export default function ProductWritingAssistant({ context, onApply }: {
  context: string;
  onApply: (patch: Partial<Draft>) => void;
}) {
  const [facts, setFacts] = useState("");
  const [tone, setTone] = useState("professional");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function generate() {
    if (request.current) return;
    const combined = [context, facts.trim()].filter(Boolean).join("\n\n");
    if (combined.trim().length < 10 || combined.length > 8000) {
      setError("Ajoutez des informations produit (8 000 caractères maximum, formulaire compris).");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 50_000);
    setLoading(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/products/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts: combined, tone }), signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "La génération a échoué. Réessayez.");
      if (![result.name, result.description, result.tags].every(value => typeof value === "string")) throw new Error("Réponse incomplète. Réessayez.");
      setDraft(result);
      setNotice("Proposition prête. Relisez les faits avant de l’appliquer.");
    } catch (cause) {
      setError(controller.signal.aborted ? "La génération a pris trop de temps. Réessayez." : cause instanceof Error ? cause.message : "Connexion indisponible. Réessayez.");
    } finally {
      clearTimeout(timeout); request.current = null; setLoading(false);
    }
  }

  function apply(field: keyof Draft) {
    if (!draft) return;
    onApply({ [field]: draft[field] });
    setNotice("Suggestion appliquée au formulaire. Enregistrez le produit pour la conserver.");
  }

  return (
    <details className="group overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/40">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#173e30] text-lg text-white">✦</span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#173e30]">Assistant de rédaction</span><span className="mt-0.5 block text-xs leading-5 text-neutral-600">Vos informations, une fiche produit soignée.</span></span>
        <span aria-hidden="true" className="text-lg text-emerald-800 group-open:rotate-45">+</span>
      </summary>
      <div className="space-y-4 border-t border-emerald-100 p-4">
        <p className="text-xs leading-5 text-neutral-600">Le nom, la marque, la description et les caractéristiques déjà renseignés sont utilisés. Ajoutez ici les faits utiles : matière, dimensions, usage, points forts…</p>
        <div><label htmlFor="product-ai-facts" className="mb-2 block text-xs font-semibold text-neutral-700">Informations complémentaires</label>
          <textarea id="product-ai-facts" value={facts} onChange={event => setFacts(event.target.value)} maxLength={6000} rows={4} placeholder="Ex. : sac de sport, 30 litres, polyester, poche séparée pour les chaussures, bandoulière réglable." className="w-full resize-y rounded-xl border border-neutral-200 bg-white p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-emerald-700" />
        </div>
        <div><label htmlFor="product-ai-tone" className="mb-2 block text-xs font-semibold text-neutral-700">Style de rédaction</label>
          <select id="product-ai-tone" value={tone} onChange={event => setTone(event.target.value)} className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"><option value="professional">Clair et professionnel</option><option value="premium">Élégant et premium</option><option value="friendly">Simple et chaleureux</option></select>
        </div>
        <p className="text-[11px] leading-5 text-neutral-500">Les informations saisies sont envoyées à OpenAI pour préparer votre proposition.</p>
        <button type="button" disabled={loading} onClick={generate} className="min-h-11 w-full rounded-xl bg-[#173e30] px-4 py-3 text-sm font-semibold text-white hover:bg-[#24523f] disabled:cursor-wait disabled:opacity-60">{loading ? "Rédaction en cours…" : draft ? "Générer une autre proposition" : "Générer ma fiche"}</button>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}
        <p role="status" aria-live="polite" className="text-xs leading-5 text-emerald-800">{notice}</p>
        {draft && <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-4">
          <p className="text-sm font-semibold text-neutral-900">Votre proposition</p>
          {([['name', 'Nom du produit'], ['description', 'Description'], ['tags', 'Tags']] as const).map(([field, label]) => <div key={field} className="border-t border-neutral-100 pt-3">
            <p className="text-xs font-semibold text-neutral-500">{label}</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-800">{draft[field]}</p>
            <button type="button" disabled={loading} onClick={() => apply(field)} className="mt-2 min-h-11 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">Utiliser {field === 'description' ? 'cette description' : field === 'name' ? 'ce nom' : 'ces tags'}</button>
          </div>)}
          <p className="text-[11px] leading-5 text-neutral-500">Chaque bouton remplace uniquement le champ indiqué. Vous pouvez ensuite le modifier avant d’enregistrer.</p>
        </div>}
      </div>
    </details>
  );
}
