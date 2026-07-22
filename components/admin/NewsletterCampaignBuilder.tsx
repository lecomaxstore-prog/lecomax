"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Product = { id: string; slug: string; name: string; price: number; original_price?: number | null; images?: string[] | null; active: boolean };
type Campaign = { subject: string; preheader: string; eyebrow: string; heading: string; body: string; ctaLabel: string; ctaUrl: string; sectionTitle: string; heroImage: string; ctaBackground: string; ctaTextColor: string; ctaRadius: string };

const INITIAL: Campaign = {
  subject: "Nos coups de cœur du moment",
  preheader: "Découvrez la sélection L'ecomax choisie pour vous.",
  eyebrow: "Sélection L'ecomax",
  heading: "Les produits que nos clients adorent",
  body: "Une sélection mode, sport et tech pensée pour votre quotidien. Découvrez nos offres du moment, disponibles dans la limite des stocks.",
  ctaLabel: "Découvrir la sélection",
  ctaUrl: "https://lecomax.com/promotions",
  sectionTitle: "Notre sélection",
  heroImage: "/ecomax-hero-banner.jpg.png",
  ctaBackground: "#111111",
  ctaTextColor: "#ffffff",
  ctaRadius: "6",
};

const inputClass = "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/5";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block text-[11px] font-bold text-neutral-600">{label}{children}{hint && <span className="mt-1 block text-[10px] font-normal text-neutral-400">{hint}</span>}</label>;
}

export default function NewsletterCampaignBuilder({ activeSubscribers }: { activeSubscribers: number }) {
  const [campaign, setCampaign] = useState(INITIAL);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("premium");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/products?active=true", { cache: "no-store" }).then((response) => response.json()).then((data) => setProducts(Array.isArray(data) ? data : [])).catch(() => setProducts([]));
  }, []);

  const selectedProducts = useMemo(() => selected.map((id) => products.find((product) => product.id === id)).filter(Boolean) as Product[], [products, selected]);
  const filteredProducts = products.filter((product) => !search || product.name.toLowerCase().includes(search.toLowerCase())).slice(0, 30);
  const update = (key: keyof Campaign, value: string) => setCampaign((current) => ({ ...current, [key]: value }));

  function toggleProduct(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 12 ? [...current, id] : current);
  }

  async function uploadHero(file: File) {
    if (!file.type.startsWith("image/")) { setMessage({ ok: false, text: "Choisissez un fichier image." }); return; }
    if (file.size > 15 * 1024 * 1024) { setMessage({ ok: false, text: "L'image ne doit pas dépasser 15 Mo." }); return; }
    setUploadingHero(true); setMessage(null);
    const form = new FormData(); form.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    setUploadingHero(false);
    if (!response.ok || !data.url) { setMessage({ ok: false, text: data.error || "Upload impossible." }); return; }
    update("heroImage", data.url);
    setMessage({ ok: true, text: "Image principale mise à jour." });
  }

  async function generate() {
    if (!goal.trim()) { setMessage({ ok: false, text: "Décrivez d'abord l'objectif de la campagne." }); return; }
    setGenerating(true); setMessage(null);
    const response = await fetch("/api/newsletter/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, tone, productNames: selectedProducts.map((product) => product.name) }),
    });
    const data = await response.json();
    setGenerating(false);
    if (!response.ok) { setMessage({ ok: false, text: data.error || "Génération impossible." }); return; }
    setCampaign((current) => ({ ...current, ...Object.fromEntries(Object.entries(data).filter(([key, value]) => key in current && typeof value === "string")) }));
    setMessage({ ok: true, text: "Proposition générée. Relisez-la avant l'envoi." });
  }

  async function send() {
    setSending(true); setMessage(null);
    const response = await fetch("/api/newsletter/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...campaign, productIds: selected }),
    });
    const data = await response.json();
    setSending(false); setConfirming(false);
    setMessage(response.ok
      ? { ok: true, text: `Campagne envoyée à ${data.sent} abonné(s)${data.failed ? ` · ${data.failed} échec(s)` : ""}.` }
      : { ok: false, text: data.error || "L'envoi a échoué." });
  }

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Studio campagne</p><h2 className="mt-1 text-base font-black">Créer une newsletter</h2><p className="mt-1 text-xs text-neutral-400">Composez, prévisualisez et envoyez depuis une seule page.</p></div>
        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">{activeSubscribers} destinataires actifs</span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6 p-4 sm:p-6">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-xs font-black text-white">AI</span><h3 className="text-sm font-black">Assistant de rédaction</h3></div>
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={3} maxLength={600} placeholder="Ex. Promouvoir les écouteurs et sacs avec un ton premium, en insistant sur la livraison rapide…" className={`${inputClass} resize-none`} />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select value={tone} onChange={(event) => setTone(event.target.value)} className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-xs font-bold outline-none sm:w-40"><option value="premium">Premium</option><option value="friendly">Chaleureux</option><option value="urgent">Offre limitée</option></select>
              <button type="button" onClick={generate} disabled={generating} className="min-h-10 flex-1 rounded-lg bg-black px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{generating ? "Rédaction en cours…" : "Générer la campagne"}</button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-black">Image principale</h3><p className="mt-1 text-xs text-neutral-400">Recommandé : format paysage, au moins 1200 × 630 px.</p></div><button type="button" onClick={() => heroInputRef.current?.click()} disabled={uploadingHero} className="shrink-0 rounded-lg bg-black px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{uploadingHero ? "Upload…" : "Changer l'image"}</button></div>
            <button type="button" onClick={() => heroInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void uploadHero(file); }} className="relative mt-3 block aspect-[16/7] w-full overflow-hidden rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-100">
              {campaign.heroImage ? <img src={campaign.heroImage} alt="Aperçu de l'image principale" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs font-bold text-neutral-400">Glissez ou choisissez une image</span>}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-black text-white opacity-0 transition hover:opacity-100">Remplacer l'image</span>
            </button>
            <input ref={heroInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadHero(file); event.currentTarget.value = ""; }} />
            <input type="url" value={campaign.heroImage} onChange={(event) => update("heroImage", event.target.value)} placeholder="Ou collez l'URL HTTPS de l'image" className={inputClass} />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => update("heroImage", "/ecomax-hero-banner.jpg.png")} className="shrink-0 overflow-hidden rounded-md border border-neutral-200"><img src="/ecomax-hero-banner.jpg.png" alt="Bannière officielle" className="h-14 w-24 object-cover" /></button>
              {selectedProducts.slice(0, 8).map((product) => product.images?.[0] && <button key={product.id} type="button" onClick={() => update("heroImage", product.images![0])} className="shrink-0 overflow-hidden rounded-md border border-neutral-200"><img src={product.images[0]} alt={product.name} className="h-14 w-14 object-cover" /></button>)}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Objet de l'email" hint={`${campaign.subject.length}/120`}><input value={campaign.subject} maxLength={120} onChange={(e) => update("subject", e.target.value)} className={inputClass} /></Field>
            <Field label="Texte d'aperçu" hint="Visible à côté de l'objet dans la boîte mail"><input value={campaign.preheader} maxLength={160} onChange={(e) => update("preheader", e.target.value)} className={inputClass} /></Field>
            <Field label="Sur-titre"><input value={campaign.eyebrow} maxLength={60} onChange={(e) => update("eyebrow", e.target.value)} className={inputClass} /></Field>
            <Field label="Titre principal"><input value={campaign.heading} maxLength={100} onChange={(e) => update("heading", e.target.value)} className={inputClass} /></Field>
            <div className="sm:col-span-2"><Field label="Message"><textarea value={campaign.body} maxLength={1200} rows={5} onChange={(e) => update("body", e.target.value)} className={`${inputClass} resize-y`} /></Field></div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-black">Bouton d'action</h3><p className="mt-1 text-xs text-neutral-400">Modifiez le bouton « Voir », son lien et son apparence.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Texte du bouton"><input value={campaign.ctaLabel} maxLength={40} onChange={(e) => update("ctaLabel", e.target.value)} className={inputClass} /></Field><Field label="Lien au clic"><input value={campaign.ctaUrl} maxLength={300} onChange={(e) => update("ctaUrl", e.target.value)} className={inputClass} /></Field></div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="text-[11px] font-black text-neutral-600">Fond<div className="mt-1.5 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2"><input type="color" value={campaign.ctaBackground} onChange={(e) => update("ctaBackground", e.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent" /><span className="text-[10px] font-mono text-neutral-500">{campaign.ctaBackground}</span></div></label>
              <label className="text-[11px] font-black text-neutral-600">Texte<div className="mt-1.5 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2"><input type="color" value={campaign.ctaTextColor} onChange={(e) => update("ctaTextColor", e.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent" /><span className="text-[10px] font-mono text-neutral-500">{campaign.ctaTextColor}</span></div></label>
              <label className="col-span-2 text-[11px] font-black text-neutral-600 sm:col-span-1">Coins · {campaign.ctaRadius}px<input type="range" min="0" max="30" value={campaign.ctaRadius} onChange={(e) => update("ctaRadius", e.target.value)} className="mt-4 w-full accent-black" /></label>
            </div>
            <div className="mt-4 px-1"><div className="px-4 py-3 text-center text-xs font-black" style={{ background: campaign.ctaBackground, color: campaign.ctaTextColor, borderRadius: `${campaign.ctaRadius}px` }}>{campaign.ctaLabel || "Voir"}</div></div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-sm font-black">Produits à promouvoir</h3><p className="mt-1 text-xs text-neutral-400">Choisissez jusqu'à 12 produits. Les prix sont relus depuis le catalogue au moment de l'envoi.</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit" className="rounded-lg border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-black sm:w-52" /></div>
            <div className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {filteredProducts.map((product) => {
                const checked = selected.includes(product.id);
                return <button key={product.id} type="button" onClick={() => toggleProduct(product.id)} className={`relative overflow-hidden rounded-lg border p-2 text-left transition ${checked ? "border-emerald-500 bg-emerald-50" : "border-neutral-200 hover:border-neutral-400"}`}>
                  {product.images?.[0] ? <img src={product.images[0]} alt="" className="aspect-square w-full rounded-md object-cover" /> : <div className="aspect-square rounded-md bg-neutral-100" />}
                  <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-4">{product.name}</p><p className="mt-1 text-xs font-black">{product.price} MAD</p>
                  <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${checked ? "bg-emerald-500 text-white" : "bg-white/90 text-neutral-400"}`}>{checked ? "✓" : "+"}</span>
                </button>;
              })}
            </div>
            <div className="mt-3 flex items-center gap-3"><Field label="Titre de la sélection"><input value={campaign.sectionTitle} maxLength={80} onChange={(e) => update("sectionTitle", e.target.value)} className={inputClass} /></Field><span className="mt-6 shrink-0 text-xs font-bold text-neutral-400">{selected.length}/12</span></div>
          </div>

          {message && <div role="status" className={`rounded-lg border px-4 py-3 text-xs font-bold ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}
          {!confirming ? <button type="button" onClick={() => setConfirming(true)} disabled={!activeSubscribers} className="w-full rounded-lg bg-black px-5 py-3.5 text-sm font-black text-white disabled:opacity-40">Vérifier et préparer l'envoi</button> : <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-black text-amber-950">Confirmer l'envoi à {activeSubscribers} abonné(s) ?</p><p className="mt-1 text-xs text-amber-800">Vérifiez l'objet, les prix, les liens et l'aperçu avant de continuer.</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setConfirming(false)} className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-xs font-bold">Annuler</button><button type="button" onClick={send} disabled={sending} className="flex-1 rounded-lg bg-black px-3 py-2.5 text-xs font-black text-white disabled:opacity-50">{sending ? "Envoi…" : "Envoyer maintenant"}</button></div></div>}
        </div>

        <aside className="border-t border-neutral-200 bg-neutral-100 p-4 lg:border-l lg:border-t-0 lg:p-5">
          <div className="sticky top-20"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Aperçu mobile</p><span className="text-[10px] text-neutral-400">390 px</span></div>
            <div className="mx-auto max-w-[360px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
              <div className="p-4 text-center"><img src="/images/lecomax logo.png" alt="L'ecomax" className="mx-auto h-8 w-auto object-contain" /></div>
              <img src={campaign.heroImage || "/ecomax-hero-banner.jpg.png"} alt="" className="h-36 w-full object-cover" />
              <div className="p-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">{campaign.eyebrow}</p><h3 className="mt-2 text-2xl font-black leading-tight">{campaign.heading || "Titre de campagne"}</h3><p className="mt-3 whitespace-pre-line text-xs leading-5 text-neutral-600">{campaign.body}</p><div className="mt-4 px-4 py-3 text-center text-xs font-black" style={{ background: campaign.ctaBackground, color: campaign.ctaTextColor, borderRadius: `${campaign.ctaRadius}px` }}>{campaign.ctaLabel || "Découvrir"}</div></div>
              {selectedProducts.length > 0 && <div className="border-t border-neutral-100 p-4"><h4 className="mb-3 text-lg font-black">{campaign.sectionTitle}</h4><div className="grid grid-cols-3 gap-2">{selectedProducts.slice(0, 3).map((product) => <div key={product.id}><img src={product.images?.[0] || "/favicon.png"} alt="" className="aspect-square w-full rounded-md object-cover" /><p className="mt-1 line-clamp-2 text-[9px] font-bold leading-3">{product.name}</p><p className="mt-1 text-[10px] font-black">{product.price} MAD</p></div>)}</div></div>}
              <div className="bg-neutral-950 px-4 py-5 text-center text-[9px] leading-4 text-neutral-400">L'ECOMAX · MODE, TECH & SPORT<br />Livraison partout au Maroc · Retours sous 30 jours</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
