"use client";
import { useEffect, useState } from "react";

type TpReview = {
  id: string;
  name: string;
  title: string;
  text: string;
  rating: number;
  date: string;
  url?: string;
  photo?: string; // base64 or URL
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24"
          fill={s <= rating ? "#00b67a" : "#e5e7eb"} stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function ManualForm({ onAdd }: { onAdd: (r: TpReview) => void }) {
  const [form, setForm] = useState({ name: "", title: "", text: "", rating: 5, date: "", photo: "" });
  const [aiHint, setAiHint] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("photo", ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function generateText() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: form.rating, hint: aiHint }),
      });
      const data = await res.json();
      setForm((f) => ({
        ...f,
        name: data.name?.trim() || f.name,
        title: data.title?.trim() || f.title,
        text: data.text?.trim() || f.text,
      }));
      setAiOpen(false);
    } finally {
      setAiLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) return;
    onAdd({
      id: `manual-${Date.now()}`,
      name: form.name.trim(),
      title: form.title.trim(),
      text: form.text.trim(),
      rating: form.rating,
      date: form.date || new Date().toISOString(),
      photo: form.photo || undefined,
    });
    setForm({ name: "", title: "", text: "", rating: 5, date: "", photo: "" });
    setAiHint("");
  }

  return (
    <form onSubmit={submit} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">Ajouter manuellement</p>

      {/* Name + Rating */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-neutral-500 font-semibold">Nom du client *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required
            className="mt-1 w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black" />
        </div>
        <div>
          <label className="text-[11px] text-neutral-500 font-semibold">Note *</label>
          <select value={form.rating} onChange={(e) => set("rating", +e.target.value)}
            className="mt-1 w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black bg-white">
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} étoile{r > 1 ? "s" : ""}</option>)}
          </select>
        </div>
      </div>

      {/* Photo upload */}
      <div>
        <label className="text-[11px] text-neutral-500 font-semibold">Photo du client</label>
        <div className="mt-1 flex items-center gap-3">
          {form.photo ? (
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.photo} alt="preview" className="w-12 h-12 rounded-full object-cover border-2 border-[#00b67a]" />
              <button type="button" onClick={() => set("photo", "")}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          )}
          <label className="flex-1 cursor-pointer">
            <div className="border border-dashed border-neutral-300 rounded-xl px-3 py-2 text-[11px] text-neutral-500 hover:border-neutral-500 transition-colors text-center">
              {form.photo ? "Changer la photo" : "📷 Choisir une photo (JPG, PNG)"}
            </div>
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-[11px] text-neutral-500 font-semibold">Titre</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)}
          className="mt-1 w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black" />
      </div>

      {/* Comment + AI */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-neutral-500 font-semibold">Commentaire *</label>
          <button type="button" onClick={() => setAiOpen((o) => !o)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
              aiOpen ? "bg-violet-600 text-white border-violet-600" : "border-neutral-200 text-neutral-500 hover:border-violet-400 hover:text-violet-600"
            }`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>
            IA
          </button>
        </div>
        {aiOpen && (
          <div className="mb-2 bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">✨ Générer avec l&apos;IA</p>
            <p className="text-[10px] text-violet-500">L&apos;IA va générer le nom, le titre et le commentaire. Décrivez le produit pour personnaliser (optionnel).</p>
            <input value={aiHint} onChange={(e) => setAiHint(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateText()}
              placeholder="Ex: sneakers Nike, livraison rapide…"
              className="w-full border border-violet-200 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500" />
            <button type="button" onClick={generateText} disabled={aiLoading}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
              {aiLoading
                ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Génération…</>
                : <>✨ Générer l&apos;avis complet</>}
            </button>
          </div>
        )}
        <textarea rows={3} value={form.text} onChange={(e) => set("text", e.target.value)} required
          className="mt-0.5 w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black resize-none" />
      </div>

      <button type="submit"
        className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors">
        + Ajouter et afficher sur le site
      </button>
    </form>
  );
}

export default function TrustpilotAdminPage() {
  const [liveReviews, setLiveReviews] = useState<TpReview[]>([]);
  const [featured, setFeatured] = useState<TpReview[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [tab, setTab] = useState<"featured" | "live">("featured");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Load featured from Supabase
    fetch("/api/trustpilot-featured")
      .then((r) => r.json())
      .then((d) => setFeatured(d.reviews ?? []));

    // Load live from Trustpilot API (only if API key is configured)
    setLoadingLive(true);
    fetch("/api/trustpilot-reviews")
      .then((r) => r.json())
      .then((d) => {
        if (d.source === "none") setNoApiKey(true);
        setLiveReviews(d.reviews ?? []);
      })
      .finally(() => setLoadingLive(false));
  }, []);

  const isFeatured = (id: string) => featured.some((r) => r.id === id);

  async function saveFeatured(next: TpReview[]) {
    setSaving(true);
    const res = await fetch("/api/trustpilot-featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviews: next }),
    });
    if (res.ok) {
      setFeatured(next);
      showToast("Sauvegardé ✓");
    } else {
      showToast("Erreur de sauvegarde", false);
    }
    setSaving(false);
  }

  function toggle(review: TpReview) {
    const next = isFeatured(review.id)
      ? featured.filter((r) => r.id !== review.id)
      : [...featured, review];
    saveFeatured(next);
  }

  function remove(id: string) {
    saveFeatured(featured.filter((r) => r.id !== id));
  }

  function addManual(r: TpReview) {
    saveFeatured([...featured, r]);
  }

  const reviewCard = (r: TpReview, showToggle = true) => (
    <div key={r.id}
      className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 transition-all ${isFeatured(r.id) ? "border-[#00b67a] ring-1 ring-[#00b67a]/20" : "border-neutral-100"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-neutral-900 truncate">{r.name}</p>
            {isFeatured(r.id) && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00b67a]/10 text-[#00b67a]">
                ✓ Sur le site
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Stars rating={r.rating} />
            <span className="text-[10px] text-neutral-400">
              {new Date(r.date).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
        {/* Trustpilot logo */}
        <svg width="20" height="20" viewBox="0 0 127.1 117.5" className="shrink-0 opacity-40">
          <polygon fill="#00b67a" points="63.6 0 82.9 55.7 141.4 55.7 96 90.1 113.5 143.8 68.1 109.4 22.7 143.8 40.2 90.1 -5.2 55.7 53.3 55.7" transform="scale(0.9)"/>
        </svg>
      </div>

      {/* Content */}
      {r.title && <p className="text-sm font-semibold text-neutral-900 leading-tight">{r.title}</p>}
      <p className="text-sm text-neutral-600 leading-relaxed line-clamp-4">{r.text}</p>

      {/* Action */}
      {showToggle && (
        <button
          onClick={() => toggle(r)}
          disabled={saving}
          className={`mt-auto w-full py-2.5 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5
            ${isFeatured(r.id)
              ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
              : "bg-[#00b67a] text-white hover:bg-[#009e6b]"
            }`}>
          {isFeatured(r.id) ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>Retirer du site</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Afficher sur le site</>
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 127.1 117.5">
              <polygon fill="#00b67a" points="63.6 0 82.9 55.7 141.4 55.7 96 90.1 113.5 143.8 68.1 109.4 22.7 143.8 40.2 90.1 -5.2 55.7 53.3 55.7" transform="scale(0.9)"/>
            </svg>
            Trustpilot
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            Choisissez quels avis apparaissent sur votre site
          </p>
        </div>
        <a href="https://www.trustpilot.com/review/lecomax.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-[#00b67a] hover:underline">
          Voir sur Trustpilot ↗
        </a>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${toast.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.msg}
        </div>
      )}

      {/* No API key warning */}
      {noApiKey && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm">
          <p className="font-bold text-blue-800 mb-1">ℹ️ Import automatique non disponible</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            L&apos;import automatique des avis Trustpilot nécessite un abonnement payant &quot;API module&quot;. 
            En attendant, <strong>ajoutez vos avis manuellement</strong> dans l&apos;onglet ci-dessous — 
            ils apparaîtront directement sur votre site. Le widget Trustpilot sur la page d&apos;accueil 
            affiche déjà vos vrais avis automatiquement et gratuitement.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {([
          { id: "featured", label: `Avis sur le site (${featured.length})` },
          { id: "live", label: `Avis Trustpilot (${liveReviews.length})` },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Live reviews tab */}
      {tab === "live" && (
        <div className="space-y-4">
          {loadingLive ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-[#00b67a] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : liveReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {liveReviews.map((r) => reviewCard(r))}
            </div>
          ) : (
            <div className="text-center py-16 text-neutral-400 text-sm">
              {noApiKey ? "Aucun avis — clé API non configurée." : "Aucun avis trouvé sur Trustpilot."}
            </div>
          )}
        </div>
      )}

      {/* Featured tab */}
      {tab === "featured" && (
        <div className="space-y-5">
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {featured.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-[#00b67a] ring-1 ring-[#00b67a]/20 p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {r.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photo} alt={r.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-neutral-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-400 font-bold text-sm">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-neutral-900 truncate">{r.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Stars rating={r.rating} />
                          <span className="text-[10px] text-neutral-400">
                            {new Date(r.date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => remove(r.id)} disabled={saving}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  {r.title && <p className="text-sm font-semibold text-neutral-900">{r.title}</p>}
                  <p className="text-sm text-neutral-600 leading-relaxed line-clamp-4">{r.text}</p>
                  <span className="text-[10px] text-[#00b67a] font-bold">✓ Affiché sur le site</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400 text-sm">
              Aucun avis sélectionné pour le site. Allez dans l&apos;onglet &quot;Avis Trustpilot&quot; pour en ajouter.
            </div>
          )}

          {/* Manual add form */}
          <ManualForm onAdd={addManual} />
        </div>
      )}
    </div>
  );
}
