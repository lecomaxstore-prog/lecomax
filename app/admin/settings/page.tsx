"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type SettingsMap = Record<string, string>;

const DEFAULT_SETTINGS: SettingsMap = {
  store_name: "L'ECOMAX",
  store_email: "lecomaxstore@gmail.com",
  store_phone: "",
  store_address: "",
  store_city: "Casablanca",
  currency: "MAD",
  whatsapp_number: "",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  free_shipping_threshold: "500",
  maintenance_mode: "false",
  // image settings
  favicon_image: "",
  logo_image: "",
  hero_image: "",
  hero_image_mobile: "",
  email_banner_image: "",
  og_image: "",
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "images" | "shipping" | "social" | "advanced">("general");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: SettingsMap = { ...DEFAULT_SETTINGS };
          data.forEach((row: { key: string; value: string }) => { map[row.key] = String(row.value ?? ""); });
          setSettings(map);
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    setSaving(false);
    if (res.ok) {
      // Set bypass cookie so admin can still access site during maintenance
      document.cookie = "maintenance_bypass=admin; path=/; max-age=86400; SameSite=Strict";
      setMsg({ type: "ok", text: "Paramètres enregistrés ✓" });
    } else {
      setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
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
      setMsg({ type: "ok", text: "Image mise à jour ✓" });
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ type: "err", text: data.error ?? "Échec de l'upload" });
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
    { id: "advanced", label: "Avanc\u00e9", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },
  ];

  return (
    <div className="max-w-3xl">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Paramètres</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Configuration générale de la boutique.</p>
        </div>
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2 bg-black text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Enregistrer</>}
        </button>
      </div>

      {/* Status message */}
      {msg && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-xl flex items-center gap-2 ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.type === "ok" ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? "bg-white text-black shadow-sm" : "text-neutral-500 hover:text-black"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
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
            <div className="space-y-6">
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
                  onClear={() => {
                    const updated = { ...settings, [f.key]: "" };
                    setSettings(updated);
                  }}
                />
                </div>
              ))}
            </div>
          </Section>
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
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[12px] text-blue-700 flex items-start gap-2 mt-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Les frais de livraison sont actuellement codés dans le code source. Modifier ces valeurs dans la base de données ne les applique pas automatiquement — il faut aussi mettre à jour le code.
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
                <p className="text-[12px] text-red-700 font-bold">Votre boutique est actuellement en mode maintenance — les visiteurs voient une page d&apos;attente.</p>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div>
                <p className="font-bold text-sm">Mode maintenance</p>
                <p className="text-[12px] text-neutral-500 mt-0.5">Affiche une page de maintenance aux visiteurs. L&apos;admin reste accessible.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, maintenance_mode: s.maintenance_mode === "true" ? "false" : "true" }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenance_mode === "true" ? "bg-red-500" : "bg-neutral-300"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode === "true" ? "translate-x-7" : "translate-x-1"}`} />
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

    </div>
  );
}

/* â”€â”€â”€ Sub-components â”€â”€â”€ */

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        {icon && <span className="text-neutral-400">{icon}</span>}
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
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
      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
      />
    </div>
  );
}

function ImageUploadField({
  label, hint, aspect, value, uploading, onFile, onClear, small,
}: {
  label: string; hint: string; aspect: string; value: string; small?: boolean;
  uploading: boolean; onFile: (f: File) => void; onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
        <div>
          <p className="font-bold text-sm">{label}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
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
            <Image src={value} alt={label} fill className="object-cover" sizes="700px" />
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
          onChange={e => onClear()}
          placeholder="https://..."
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-black transition-colors text-neutral-500"
          readOnly
        />
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
