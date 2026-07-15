"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { publishSettings } from "@/lib/use-settings";

type SettingsMap = Record<string, string>;

const DEFAULT_SETTINGS: SettingsMap = {
  store_name: "L'ECOMAX",
  store_email: "contact@lecomax.com",
  store_phone: "",
  store_address: "",
  store_city: "Casablanca",
  currency: "MAD",
  whatsapp_number: "212699289568",
  instagram_url: "https://www.instagram.com/lecomaxcom",
  facebook_url: "https://www.facebook.com/lecomaxcom",
  tiktok_url: "https://www.tiktok.com/@lecomaxcom",
  free_shipping_threshold: "500",
  shipping_cost: "35",
  maintenance_mode: "false",
  enable_reviews: "true",
  enable_coupons: "true",
  enable_newsletter: "true",
  enable_wishlist: "true",
  enable_ecoclub: "true",
  announcement_1: "LIVRAISON GRATUITE DÈS 500 MAD AU MAROC",
  announcement_2: "RETOURS GRATUITS SOUS 30 JOURS",
  announcement_3: "PAIEMENT À LA LIVRAISON DISPONIBLE",
  seo_title: "",
  seo_description: "",
  // image settings — pre-filled with current site defaults
  favicon_image: "/favicon.png",
  logo_image: "/images/lecomax logo.png",
  hero_image: "/images/hero secrtion/hero section web version.png",
  hero_image_mobile: "/images/hero secrtion/hero section mobile version.png",
  email_banner_image: "/images/email image/email image.png",
  og_image: "/images/lecomax logo.png",
};

const IMAGE_FIELDS = [
  {
    key: "favicon_image",
    label: "Favicon (icône du site)",
    hint: "Icône affichée dans l'onglet du navigateur. Recommandé : PNG carré 512×512px.",
    aspect: "aspect-square",
    small: true,
  },
  {
    key: "logo_image",
    label: "Logo de la boutique",
    hint: "Affiché dans le header. Recommandé : PNG transparent 400×120px.",
    aspect: "aspect-[10/3]",
  },
  {
    key: "hero_image",
    label: "Image Hero (Desktop)",
    hint: "Bannière principale de la page d'accueil. Recommandé : 1920×800px.",
    aspect: "aspect-[16/5]",
  },
  {
    key: "hero_image_mobile",
    label: "Image Hero (Mobile)",
    hint: "Version mobile de la bannière. Recommandé : 800×600px.",
    aspect: "aspect-[4/3]",
  },
  {
    key: "email_banner_image",
    label: "Bannière Email",
    hint: "Utilisée dans les emails de confirmation de commande. Recommandé : 600×200px.",
    aspect: "aspect-[3/1]",
  },
  {
    key: "og_image",
    label: "Image de partage (OG Image)",
    hint: "Image affichée lors du partage sur les réseaux sociaux. Recommandé : 1200×630px.",
    aspect: "aspect-[1200/630]",
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({ ...DEFAULT_SETTINGS });
  const savedSettingsRef = useRef<SettingsMap>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "images" | "shipping" | "social" | "advanced" | "security">("general");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: SettingsMap = { ...DEFAULT_SETTINGS };
          data.forEach((row: { key: string; value: string }) => {
            map[row.key] = String(row.value ?? "");
          });
          setSettings(map);
          savedSettingsRef.current = map;
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur inconnue");
      publishSettings(settings);
      savedSettingsRef.current = { ...settings };
      setMsg({ type: "ok", text: "Paramètres enregistrés et appliqués sur le site ✓" });
    } catch (error) {
      setMsg({ type: "err", text: error instanceof Error ? error.message : "Erreur réseau" });
    } finally {
      setSaving(false);
    }
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleImageUpload(key: string, file: File) {
    setUploadingKey(key);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingKey(null);
    if (data.url) {
      const updated = { ...settings, [key]: data.url };
      setSettings(updated);
      // Auto-save the new image URL
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      publishSettings(updated);
      savedSettingsRef.current = { ...updated };
      setMsg({ type: "ok", text: "Image mise à jour ✓" });
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ type: "err", text: data.error ?? "Échec de l'upload" });
    }
  }

  async function toggleMaintenance() {
    const newValue = settings.maintenance_mode === "true" ? "false" : "true";
    setSettings(s => ({ ...s, maintenance_mode: newValue }));
    setMaintenanceSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, maintenance_mode: newValue }),
      });
      if (res.ok) {
        const updated = { ...settings, maintenance_mode: newValue };
        publishSettings(updated);
        savedSettingsRef.current = updated;
        setMsg({ type: "ok", text: newValue === "true" ? "🔒 Mode maintenance activé — visiteurs redirigés" : "✓ Site en ligne — mode maintenance désactivé" });
      } else {
        // Revert on failure
        setSettings(s => ({ ...s, maintenance_mode: settings.maintenance_mode }));
        setMsg({ type: "err", text: "Erreur lors de la sauvegarde" });
      }
    } catch {
      setSettings(s => ({ ...s, maintenance_mode: settings.maintenance_mode }));
      setMsg({ type: "err", text: "Erreur réseau" });
    } finally {
      setMaintenanceSaving(false);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "G\u00e9n\u00e9ral", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
    { id: "images", label: "Images", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { id: "shipping", label: "Livraison", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { id: "social", label: "R\u00e9seaux sociaux", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
    { id: "advanced", label: "Avanc\u00e9", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },    { id: "security", label: "Sécurité", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },  ];

  const tabDescriptions: Record<typeof activeTab, string> = {
    general: "Identité, coordonnées et informations principales de votre boutique.",
    images: "Logo, favicon et visuels utilisés sur le site et dans les emails.",
    shipping: "Tarifs, seuil de gratuité et règles appliquées aux commandes.",
    social: "Liens officiels vers vos profils et réseaux sociaux.",
    advanced: "Fonctionnalités, annonces, maintenance et référencement.",
    security: "Protection du compte administrateur et mot de passe.",
  };
  const activeTabInfo = tabs.find((tab) => tab.id === activeTab)!;
  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettingsRef.current);

  return (
    <div className="mx-auto w-full max-w-7xl pb-24 lg:pb-12">

      {/* Page header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-52 w-52 rounded-full bg-[#3ecf4c]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-[#3ecf4c] shadow-lg shadow-black/10">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .6 1.7 1.7 0 00-.4 1.1V21a2 2 0 01-4 0v-.09A1.7 1.7 0 008.6 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-.6-1 1.7 1.7 0 00-1.1-.4H3a2 2 0 010-4h.09A1.7 1.7 0 004.6 8.6a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 012.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-.6 1.7 1.7 0 00.4-1.1V3a2 2 0 014 0v.09A1.7 1.7 0 0015.4 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 012.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.14.37.35.7.6 1 .3.3.7.4 1.1.4H21a2 2 0 010 4h-.09c-.4 0-.8.2-1.1.4-.2.1-.3.2-.4.2z"/></svg>
          </div>
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight sm:text-[28px]">Paramètres</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${settings.maintenance_mode === "true" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}><span className={`h-1.5 w-1.5 rounded-full ${settings.maintenance_mode === "true" ? "bg-red-500" : "bg-emerald-500"}`}/>{settings.maintenance_mode === "true" ? "Maintenance" : "Site en ligne"}</span>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-neutral-500">Pilotez votre boutique depuis un espace unique. Les changements enregistrés sont appliqués automatiquement.</p>
          </div>
        </div>
        <button
          onClick={() => handleSave()}
          disabled={saving || !isDirty}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-neutral-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none"
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Enregistrer</>}
        </button>
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div className={`fixed right-4 top-20 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl sm:right-7 ${msg.type === "ok" ? "bg-neutral-950 text-white" : "border border-red-200 bg-red-50 text-red-700"}`}>
          {msg.type === "ok" ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {msg.text}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Navigation */}
      <aside className="sticky top-4 z-20 -mx-1 overflow-x-auto px-1 lg:mx-0 lg:overflow-visible lg:px-0">
      <div className="flex min-w-max gap-2 rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,.03)] lg:min-w-0 lg:flex-col">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`group flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-3 text-left text-[12px] font-bold transition-all lg:w-full ${activeTab === t.id ? "bg-black text-white shadow-md shadow-black/10" : "text-neutral-500 hover:bg-neutral-50 hover:text-black"}`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeTab === t.id ? "bg-white/10 text-[#3ecf4c]" : "bg-neutral-100 text-neutral-500 group-hover:bg-white"}`}>{t.icon}</span>
            {t.label}
            {activeTab === t.id && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-[#3ecf4c] lg:block" />}
          </button>
        ))}
      </div>
      <div className="mt-4 hidden rounded-2xl bg-neutral-950 p-4 text-white lg:block">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#3ecf4c]/15 text-[#3ecf4c]"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>
        <p className="text-xs font-black">Synchronisation active</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">Vos réglages sont sécurisés et partagés avec toute la boutique.</p>
      </div>
      </aside>

      <main className="min-w-0">
        <div className="mb-5 flex items-start justify-between gap-4 px-1">
          <div>
            <div className="mb-1 flex items-center gap-2 text-neutral-400">{activeTabInfo.icon}<span className="text-[10px] font-black uppercase tracking-[.18em]">Configuration</span></div>
            <h2 className="text-xl font-black tracking-tight">{activeTabInfo.label}</h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-neutral-500">{tabDescriptions[activeTab]}</p>
          </div>
          <div className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider sm:flex ${isDirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isDirty ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`} />
            {isDirty ? "Non enregistré" : "À jour"}
          </div>
        </div>

      {/* â”€â”€ GENERAL â”€â”€ */}
      {activeTab === "general" && (
        <form onSubmit={handleSave} className="space-y-4">
          <Section title="Informations de la boutique" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nom de la boutique" value={settings.store_name} onChange={v => setSettings(s => ({ ...s, store_name: v }))} />
              <Field label="Email de contact" value={settings.store_email} type="email" onChange={v => setSettings(s => ({ ...s, store_email: v }))} />
              <Field label="Téléphone" value={settings.store_phone} placeholder="+212 6XX XXX XXX" onChange={v => setSettings(s => ({ ...s, store_phone: v }))} />
              <Field label="Devise" value={settings.currency} onChange={v => setSettings(s => ({ ...s, currency: v }))} />
              <Field label="Ville" value={settings.store_city} onChange={v => setSettings(s => ({ ...s, store_city: v }))} />
              <Field label="Adresse" value={settings.store_address} onChange={v => setSettings(s => ({ ...s, store_address: v }))} />
            </div>
          </Section>

          <Section title="Contact & WhatsApp" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>}>
            <Field label="Numéro WhatsApp (avec indicatif)" value={settings.whatsapp_number} placeholder="+212 6XX XXX XXX" onChange={v => setSettings(s => ({ ...s, whatsapp_number: v }))} />
          </Section>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-black text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {/* â”€â”€ IMAGES â”€â”€ */}
      {activeTab === "images" && (
        <div className="space-y-4">
          <Section title="Images de la boutique" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}>
            <p className="text-[12px] text-neutral-400 mb-5">Cliquez sur une image ou le bouton pour remplacer. Les images sont automatiquement sauvegardées.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {IMAGE_FIELDS.map(f => (
                <div key={f.key} className={f.small ? "max-w-[200px]" : ""}>
                <ImageUploadField
                  label={f.label}
                  hint={f.hint}
                  aspect={f.aspect}
                  small={f.small}
                  value={settings[f.key] || ""}
                  uploading={uploadingKey === f.key}
                  onFile={file => handleImageUpload(f.key, file)}
                  onUrlChange={url => {
                    setSettings(s => ({ ...s, [f.key]: url }));
                  }}
                  onClear={() => {
                    const updated = { ...settings, [f.key]: "" };
                    setSettings(updated);
                  }}
                />
                </div>
              ))}
            </div>
          </Section>
          <div className="flex justify-end pt-2">
            <button type="button" onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-50">
              {saving ? "Enregistrement…" : "Enregistrer les images"}
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ SHIPPING â”€â”€ */}
      {activeTab === "shipping" && (
        <form onSubmit={handleSave} className="space-y-4">
          <Section title="Règles de livraison" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Frais de livraison (MAD)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={settings.shipping_cost ?? "35"}
                    onChange={e => setSettings(s => ({ ...s, shipping_cost: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black pr-14"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-bold">MAD</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Livraison gratuite dès (MAD)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={settings.free_shipping_threshold ?? "500"}
                    onChange={e => setSettings(s => ({ ...s, free_shipping_threshold: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black pr-14"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-bold">MAD</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Tarif standard</p>
                <p className="mt-2 text-2xl font-black tracking-tight">{settings.shipping_cost || "0"}<span className="ml-1 text-xs text-neutral-400">MAD</span></p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Gratuite dès</p>
                <p className="mt-2 text-2xl font-black tracking-tight">{settings.free_shipping_threshold || "0"}<span className="ml-1 text-xs text-neutral-400">MAD</span></p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Couverture</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-black text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Tout le Maroc</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-[12px] text-emerald-700 flex items-start gap-2 mt-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
              Ces valeurs sont lues en temps réel par le panier, le checkout, la validation des commandes, le footer et la bannière héro. Enregistrez pour appliquer immédiatement sur tout le site.
            </div>
          </Section>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-black text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              {saving ? "Enregistrement\u2026" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {/* â”€â”€ SOCIAL â”€â”€ */}
      {activeTab === "social" && (
        <form onSubmit={handleSave} className="space-y-4">
          <Section title="Réseaux sociaux" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}>
            <div className="space-y-4">
              {[
                { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/lecomax", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" },
                { key: "facebook_url", label: "Facebook", placeholder: "https://facebook.com/lecomax", icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                { key: "tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/@lecomax", icon: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" },
              ].map(s => (
                <div key={s.key}>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d={s.icon}/></svg>
                    {s.label}
                  </label>
                  <input
                    value={settings[s.key] ?? ""}
                    onChange={e => setSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                    placeholder={s.placeholder}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              ))}
            </div>
          </Section>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-black text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              {saving ? "Enregistrement\u2026" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {/* â”€â”€ ADVANCED â”€â”€ */}
      {activeTab === "advanced" && (
        <form onSubmit={handleSave} className="space-y-4">
          <Section title="Mode maintenance" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>}>
            {settings.maintenance_mode === "true" && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" className="shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <p className="text-[12px] text-red-700 font-bold">⚠️ Votre boutique est en mode maintenance — les visiteurs voient une page d&apos;attente.</p>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div>
                <p className="font-bold text-sm">Mode maintenance</p>
                <p className="text-[12px] text-neutral-500 mt-0.5">
                  {settings.maintenance_mode === "true"
                    ? "🔴 Actif — le site est hors ligne pour les visiteurs"
                    : "🟢 Inactif — le site est en ligne"}
                </p>
              </div>
              <button
                type="button"
                disabled={maintenanceSaving}
                onClick={toggleMaintenance}
                className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-60 ${settings.maintenance_mode === "true" ? "bg-red-500" : "bg-neutral-300"}`}
              >
                {maintenanceSaving
                  ? <span className="absolute inset-0 flex items-center justify-center"><span className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin" /></span>
                  : <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode === "true" ? "translate-x-7" : "translate-x-1"}`} />
                }
              </button>
            </div>
          </Section>

          <Section title="Fonctionnalités" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>}>
            {[
              { key: "enable_reviews", label: "Avis clients", desc: "Permettre aux clients de laisser des avis sur les produits" },
              { key: "enable_coupons", label: "Codes promo", desc: "Activer l'utilisation des codes de réduction" },
              { key: "enable_newsletter", label: "Newsletter", desc: "Afficher le formulaire d'inscription à la newsletter" },
              { key: "enable_wishlist", label: "Liste de souhaits", desc: "Permettre aux clients de sauvegarder leurs favoris" },
              { key: "enable_ecoclub", label: "ecoClub (fidélité)", desc: "Programme de points et récompenses pour les clients" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                <div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(s => ({ ...s, [item.key]: s[item.key] === "false" ? "true" : "false" }))}
                  className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${settings[item.key] !== "false" ? "bg-[#3ecf4c]" : "bg-neutral-300"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[item.key] !== "false" ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </Section>

          <Section title="Barre d'annonce" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6zM1 9l3 6"/><path d="M5 3l4 6M9 3l-4 6M15 3l4 6M19 3l-4 6"/></svg>}>
            <Field label="Texte de l'annonce 1" value={settings.announcement_1 ?? "LIVRAISON GRATUITE DÈS 500 MAD AU MAROC"} onChange={v => setSettings(s => ({ ...s, announcement_1: v }))} />
            <Field label="Texte de l'annonce 2" value={settings.announcement_2 ?? "RETOURS GRATUITS SOUS 30 JOURS"} onChange={v => setSettings(s => ({ ...s, announcement_2: v }))} />
            <Field label="Texte de l'annonce 3" value={settings.announcement_3 ?? "PAIEMENT À LA LIVRAISON DISPONIBLE"} onChange={v => setSettings(s => ({ ...s, announcement_3: v }))} />
          </Section>

          <Section title="SEO & Métadonnées" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}>
            <Field label="Titre SEO" value={settings.seo_title ?? ""} placeholder="L'ecomax — Chaussures, Vêtements & Tech au Maroc" onChange={v => setSettings(s => ({ ...s, seo_title: v }))} />
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Description SEO</label>
              <textarea
                value={settings.seo_description ?? ""}
                onChange={e => setSettings(s => ({ ...s, seo_description: e.target.value }))}
                placeholder="Boutique en ligne au Maroc..."
                rows={3}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
              />
            </div>
          </Section>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-black text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              {saving ? "Enregistrement\u2026" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {/* ── SECURITY ── */}
      {activeTab === "security" && (
        <SecurityTab />
      )}
      </main>
      </div>

      {activeTab !== "security" && isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(0,0,0,.08)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1 pl-1">
              <p className="truncate text-xs font-black">Modifications non enregistrées</p>
              <p className="text-[10px] text-neutral-400">Enregistrez pour publier sur le site.</p>
            </div>
            <button type="button" onClick={() => handleSave()} disabled={saving} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-xs font-black text-white disabled:opacity-50">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>}
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€ Sub-components â”€â”€â”€ */

function SecurityTab() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setMsg({ type: "err", text: "Les nouveaux mots de passe ne correspondent pas." }); return; }
    if (newPw.length < 8) { setMsg({ type: "err", text: "Le nouveau mot de passe doit contenir au moins 8 caractères." }); return; }
    setSaving(true); setMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setMsg({ type: "err", text: "Session expirée. Reconnectez-vous." }); setSaving(false); return; }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw });
    if (signInErr) { setMsg({ type: "err", text: "Mot de passe actuel incorrect." }); setSaving(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) { setMsg({ type: "err", text: error.message }); }
    else { setMsg({ type: "ok", text: "Mot de passe mis à jour avec succès ✓" }); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    setTimeout(() => setMsg(null), 5000);
  }

  const inputCls = "w-full border border-neutral-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white";
  const EyeIcon = ({ open }: { open: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
    </svg>
  );

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <Section title="Changer le mot de passe" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}>
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Mot de passe actuel</label>
          <div className="relative">
            <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              required className={inputCls} placeholder="••••••••" autoComplete="current-password" />
            <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-600 transition-colors">
              <EyeIcon open={showCurrent} />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Nouveau mot de passe</label>
          <div className="relative">
            <input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
              required minLength={8} className={inputCls} placeholder="Min. 8 caractères" autoComplete="new-password" />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-600 transition-colors">
              <EyeIcon open={showNew} />
            </button>
          </div>
          {newPw && (
            <div className="mt-1.5 flex items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  newPw.length < 8 ? (i < 1 ? "bg-red-400" : "bg-neutral-200") :
                  newPw.length < 12 ? (i < 2 ? "bg-yellow-400" : "bg-neutral-200") :
                  newPw.length < 16 ? (i < 3 ? "bg-blue-400" : "bg-neutral-200") : "bg-[#3ecf4c]"
                }`} />
              ))}
              <span className="text-[10px] text-neutral-400 ml-1 shrink-0">
                {newPw.length < 8 ? "Trop court" : newPw.length < 12 ? "Faible" : newPw.length < 16 ? "Moyen" : "Fort"}
              </span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Confirmer le nouveau mot de passe</label>
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            required className={`${inputCls} pr-4 ${
              confirmPw && confirmPw !== newPw ? "border-red-300 focus:border-red-400" :
              confirmPw && confirmPw === newPw ? "border-green-300 focus:border-green-400" : ""
            }`} placeholder="Répétez le nouveau mot de passe" autoComplete="new-password" />
          {confirmPw && confirmPw !== newPw && (
            <p className="text-[11px] text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
          )}
        </div>
        {msg && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            msg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            <span>{msg.type === "ok" ? "✓" : "✕"}</span>
            {msg.text}
          </div>
        )}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving || (!!confirmPw && confirmPw !== newPw)}
            className="flex items-center gap-2 bg-black text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            {saving ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </button>
        </div>
      </Section>
    </form>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.025)]">
      <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/60 px-5 py-4 sm:px-6">
        {icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm">{icon}</span>}
        <h2 className="text-[11px] font-black uppercase tracking-[.16em] text-neutral-700">{title}</h2>
      </div>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[.12em] text-neutral-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-300 hover:border-neutral-300 focus:border-black focus:bg-white focus:ring-4 focus:ring-black/[.04]"
      />
    </div>
  );
}

function ImageUploadField({
  label, hint, aspect, value, uploading, onFile, onClear, onUrlChange, small,
}: {
  label: string; hint: string; aspect: string; value: string; small?: boolean;
  uploading: boolean; onFile: (f: File) => void; onClear: () => void; onUrlChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-neutral-100 bg-neutral-50/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-sm">{label}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">{hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50"
            >
              Supprimer
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {uploading
              ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Upload…</>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Changer</>}
          </button>
        </div>
      </div>

      {/* Preview / Drop zone */}
      <div
        className={`relative w-full ${aspect} bg-neutral-50 cursor-pointer group`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        {value ? (
          <>
            <Image src={value} alt={label} fill className="object-cover" sizes="700px" unoptimized={value.startsWith("/") || value.startsWith("http")} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Remplacer l'image
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-300 border-2 border-dashed border-neutral-200 m-3 rounded-xl group-hover:border-neutral-400 transition-colors">
            {uploading ? (
              <span className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p className="text-[12px] font-bold text-center px-4">Glissez une image ici<br/><span className="text-neutral-400 font-normal">ou cliquez pour choisir</span></p>
              </>
            )}
          </div>
        )}
      </div>

      {/* URL input */}
      <div className="px-4 py-3 border-t border-neutral-100">
        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">URL directe</label>
        <input
          type="url"
          value={value}
          onChange={e => onUrlChange(e.target.value)}
          placeholder="https://..."
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-black transition-colors text-neutral-700"
        />
        {value && (
          <p className="text-[10px] text-neutral-400 mt-1 truncate">{value}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
