"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type SettingRow = { key: string; value: string };
type Audience = "all" | "android" | "ios" | "users" | "new_customers" | "active_buyers" | "vip" | "lapsed" | "no_orders";
type NotificationCategory = "general" | "promotions" | "new_products" | "loyalty" | "price_drops" | "back_in_stock" | "service";
type Campaign = {
  id: string;
  title: string;
  body: string;
  deep_link: string;
  audience: Audience;
  category: NotificationCategory;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled" | "failed";
  scheduled_at: string | null;
  sent_at: string | null;
  target_count: number;
  delivered_count: number;
  failed_count: number;
  error_message: string | null;
  created_at: string;
};
type CampaignResponse = {
  campaigns: Campaign[];
  subscribers: { total: number; android: number; ios: number };
};

const toggleControls = [
  { key: "maintenance_mode", label: "Mode maintenance", detail: "Bloque temporairement l’application avec un écran sécurisé.", danger: true },
  { key: "app_notifications_enabled", label: "Notifications mobiles", detail: "Autorise l’inscription et les campagnes push Expo." },
  { key: "app_home_promotions", label: "Promotions accueil", detail: "Affiche les offres actives sur la page d’accueil." },
  { key: "app_home_new_arrivals", label: "Nouveautés accueil", detail: "Affiche la sélection des nouveaux produits." },
  { key: "app_home_products", label: "Catalogue accueil", detail: "Affiche la grille principale de produits." },
  { key: "app_home_welcome_offer", label: "Offre de bienvenue", detail: "Active le bloc d’acquisition de bienvenue." },
  { key: "app_onboarding_enabled", label: "Onboarding", detail: "Présente l’introduction aux nouveaux clients." },
  { key: "announcement_mobile_enabled", label: "Bandeau d’annonce", detail: "Diffuse les annonces configurées dans l’application." },
  { key: "app_force_update", label: "Mise à jour obligatoire", detail: "Bloque les versions inférieures à la version minimale.", danger: true },
] as const;

const modules = [
  ["/admin/app-releases", "Versions Android", "APK, publication, SHA-256 et mises à jour obligatoires."],
  ["/admin/banners", "Bannières et merchandising", "Visuels mobiles, campagnes d’accueil et ordre d’affichage."],
  ["/admin/promotions", "Promotions", "Offres, remises, dates et produits éligibles."],
  ["/admin/shipping", "Livraison", "Zones, délais, seuil gratuit et paiement à la livraison."],
  ["/admin/analytics", "Analytics", "Acquisition, recherche, panier, checkout et conversion."],
  ["/admin/settings?tab=advanced", "Configuration avancée", "Paiement, contenu, support et réglages généraux."],
] as const;

function friendlyAudience(value: Campaign["audience"]) {
  return { all: "Tous", android: "Android", ios: "iOS", users: "Clients ciblés", new_customers: "Nouveaux clients (30 j)", active_buyers: "Acheteurs actifs (90 j)", vip: "VIP", lapsed: "Clients inactifs (+90 j)", no_orders: "Clients sans commande" }[value];
}

const campaignTemplates = [
  { label: "VENTE FLASH", title: "Vente flash L’ECOMAX", body: "Profitez de notre offre limitée avant qu’elle ne disparaisse.", category: "promotions" as const, deepLink: "/catalog" },
  { label: "NOUVEAUTÉS", title: "Les nouveautés sont arrivées", body: "Découvrez notre nouvelle sélection dès maintenant dans l’application.", category: "new_products" as const, deepLink: "/catalog" },
  { label: "FIDÉLITÉ", title: "Un avantage vous attend", body: "Consultez vos avantages L’ECOMAX et profitez-en dès aujourd’hui.", category: "loyalty" as const, deepLink: "/account" },
  { label: "PANIER", title: "Votre sélection vous attend", body: "Retrouvez les articles que vous aviez choisis et finalisez votre commande.", category: "general" as const, deepLink: "/cart" },
];

function friendlyStatus(value: Campaign["status"]) {
  return {
    draft: "Brouillon",
    scheduled: "Programmée",
    sending: "En cours",
    sent: "Envoyée",
    cancelled: "Annulée",
    failed: "Échec",
  }[value];
}

export default function MobileApplicationPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [campaignData, setCampaignData] = useState<CampaignResponse>({ campaigns: [], subscribers: { total: 0, android: 0, ios: 0 } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState<{ count: number; android: number; ios: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    deepLink: "/catalog",
    imageUrl: "",
    audience: "all" as Campaign["audience"],
    category: "general" as NotificationCategory,
    audienceUserIds: "",
    scheduledAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResponse, campaignsResponse] = await Promise.all([
        fetch("/api/settings", { cache: "no-store" }),
        fetch("/api/admin/mobile-campaigns", { cache: "no-store" }),
      ]);
      const [settingRows, campaigns] = await Promise.all([settingsResponse.json(), campaignsResponse.json()]);
      if (!settingsResponse.ok) throw new Error(settingRows.error ?? "Configuration indisponible.");
      if (!campaignsResponse.ok) throw new Error(campaigns.error ?? "Campagnes indisponibles.");
      setSettings(Object.fromEntries((settingRows as SettingRow[]).map((row) => [row.key, String(row.value ?? "")])));
      setCampaignData(campaigns as CampaignResponse);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Impossible de charger le centre de contrôle." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      const params = new URLSearchParams({ audience: form.audience, category: form.category });
      if (form.audience === "users") params.set("userIds", form.audienceUserIds.split(/[\s,;]+/).filter(Boolean).join(","));
      try {
        const response = await fetch(`/api/admin/mobile-audience?${params}`, { cache: "no-store" });
        const payload = await response.json();
        setAudiencePreview(response.ok ? payload : null);
      } catch { setAudiencePreview(null); }
      finally { setPreviewLoading(false); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [form.audience, form.audienceUserIds, form.category]);

  const sentCampaigns = useMemo(() => campaignData.campaigns.filter((item) => item.status === "sent"), [campaignData.campaigns]);
  const totalDelivered = useMemo(() => sentCampaigns.reduce((sum, item) => sum + item.delivered_count, 0), [sentCampaigns]);

  function toggle(key: string) {
    if (key === "maintenance_mode" && settings[key] !== "true" && !window.confirm("Activer la maintenance bloquera immédiatement l’accès à l’application. Continuer ?")) return;
    setSettings((current) => ({ ...current, [key]: current[key] === "true" ? "false" : "true" }));
  }

  async function saveControls() {
    setSaving(true);
    setNotice(null);
    const keys = [
      ...toggleControls.map((item) => item.key),
      "app_minimum_version", "app_latest_version", "app_store_url", "app_support_contact", "app_popular_searches",
    ];
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(keys.map((key) => [key, settings[key] ?? ""]))),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Enregistrement impossible.");
      setNotice({ type: "ok", text: "Configuration mobile enregistrée et diffusée." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Enregistrement impossible." });
    } finally {
      setSaving(false);
    }
  }

  async function submitCampaign(action: "draft" | "send" | "schedule") {
    if (action === "send" && !window.confirm(`Envoyer cette notification maintenant à l’audience « ${friendlyAudience(form.audience)} » ?`)) return;
    setSending(true);
    setNotice(null);
    try {
      const scheduledAt = action === "schedule" && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null;
      const response = await fetch("/api/admin/mobile-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          action: action === "send" ? "send" : "draft",
          scheduledAt,
          audienceUserIds: form.audienceUserIds.split(/[\s,;]+/).filter(Boolean),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Campagne impossible.");
      setNotice({
        type: "ok",
        text: action === "send"
          ? `Campagne envoyée : ${payload.result?.delivered ?? 0} remise(s), ${payload.result?.failed ?? 0} échec(s).`
          : action === "schedule" ? "Campagne programmée." : "Brouillon enregistré.",
      });
      setForm((current) => ({ ...current, title: "", body: "", imageUrl: "", scheduledAt: "" }));
      await load();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Campagne impossible." });
    } finally {
      setSending(false);
    }
  }

  async function campaignAction(id: string, action: "send" | "cancel") {
    if (!window.confirm(action === "send" ? "Envoyer cette campagne maintenant ?" : "Annuler cette campagne ?")) return;
    setSending(true);
    try {
      const response = await fetch(`/api/admin/mobile-campaigns/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Action impossible.");
      setNotice({ type: "ok", text: action === "send" ? "Campagne envoyée." : "Campagne annulée." });
      await load();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Action impossible." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-16">
      <header className="overflow-hidden rounded-[28px] bg-[#080808] p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#42df68]">Mobile operations</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">Centre de contrôle application</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">Campagnes push natives, ciblage, programmation, expérience d’accueil, maintenance, versions et merchandising depuis une seule console.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/app-releases" className="inline-flex min-h-11 items-center bg-[#42df68] px-4 text-xs font-black text-black">PUBLIER UNE VERSION</Link>
            <button type="button" onClick={() => void load()} disabled={loading} className="min-h-11 border border-white/20 px-4 text-xs font-black disabled:opacity-50">{loading ? "CHARGEMENT…" : "ACTUALISER"}</button>
          </div>
        </div>
      </header>

      {notice && <div role="alert" className={`border p-4 text-sm font-bold ${notice.type === "ok" ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.text}</div>}

      <section aria-label="Indicateurs mobiles" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Appareils actifs", campaignData.subscribers.total],
          ["Android", campaignData.subscribers.android],
          ["iOS", campaignData.subscribers.ios],
          ["Campagnes envoyées", sentCampaigns.length],
          ["Messages remis", totalDelivered],
        ].map(([label, value]) => (
          <article key={String(label)} className="border border-neutral-200 bg-white p-5">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-400">{label}</p>
            <p className="mt-3 text-3xl font-black">{loading ? "…" : Number(value).toLocaleString("fr-FR")}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.08fr_.92fr]">
        <section className="border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#0b8f32]">Campagnes natives</p><h2 className="mt-1 text-2xl font-black">Envoyer une notification mobile</h2></div>
            <span className="bg-neutral-100 px-3 py-2 text-[10px] font-black uppercase">Expo Push · Android & iOS</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {campaignTemplates.map((template) => <button key={template.label} type="button" onClick={() => setForm((current) => ({ ...current, title: template.title, body: template.body, category: template.category, deepLink: template.deepLink }))} className="min-h-9 border border-neutral-200 px-3 text-[10px] font-black hover:border-black">{template.label}</button>)}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-xs font-black">Titre <span className="text-neutral-400">{form.title.length}/80</span><input value={form.title} maxLength={80} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Une offre à ne pas manquer" className="mt-2 min-h-12 w-full border border-neutral-300 px-4 text-sm outline-none focus:border-black" /></label>
            <label className="sm:col-span-2 text-xs font-black">Message <span className="text-neutral-400">{form.body.length}/240</span><textarea value={form.body} maxLength={240} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Votre avantage, votre preuve et une action claire." rows={4} className="mt-2 w-full border border-neutral-300 p-4 text-sm outline-none focus:border-black" /></label>
            <label className="text-xs font-black">Audience<select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value as Campaign["audience"] })} className="mt-2 min-h-12 w-full border border-neutral-300 px-3 text-sm"><option value="all">Tous les appareils</option><option value="android">Android uniquement</option><option value="ios">iOS uniquement</option><option value="new_customers">Nouveaux clients (30 jours)</option><option value="active_buyers">Acheteurs actifs (90 jours)</option><option value="vip">Clients VIP</option><option value="lapsed">Clients inactifs (+90 jours)</option><option value="no_orders">Clients sans commande</option><option value="users">Clients spécifiques</option></select><span className="mt-2 block text-[11px] font-medium text-neutral-500">{previewLoading ? "Calcul de l’audience…" : audiencePreview ? `${audiencePreview.count} appareil(s) éligible(s) · ${audiencePreview.android} Android · ${audiencePreview.ios} iOS` : "Aperçu indisponible"}</span></label>
            <label className="text-xs font-black">Lien dans l’application<select value={form.deepLink} onChange={(event) => setForm({ ...form, deepLink: event.target.value })} className="mt-2 min-h-12 w-full border border-neutral-300 px-3 text-sm"><option value="/catalog">Catalogue</option><option value="/wishlist">Favoris</option><option value="/cart">Panier</option><option value="/orders">Commandes</option><option value="/notifications">Notifications</option><option value="/account">Compte</option><option value="/">Accueil</option></select></label>
            {form.audience === "users" && <label className="sm:col-span-2 text-xs font-black">Identifiants clients Supabase<textarea value={form.audienceUserIds} onChange={(event) => setForm({ ...form, audienceUserIds: event.target.value })} placeholder="UUID séparés par une virgule ou une nouvelle ligne" rows={3} className="mt-2 w-full border border-neutral-300 p-3 font-mono text-xs" /></label>}
            <label className="sm:col-span-2 text-xs font-black">Type de notification<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as NotificationCategory })} className="mt-2 min-h-12 w-full border border-neutral-300 px-3 text-sm"><option value="general">Actualités et recommandations</option><option value="promotions">Promotions et offres</option><option value="new_products">Nouveaux produits</option><option value="loyalty">Club et fidélité</option><option value="price_drops">Baisses de prix</option><option value="back_in_stock">Retours en stock</option><option value="service">Service essentiel</option></select><span className="mt-2 block text-[11px] font-medium text-neutral-500">Les préférences de chaque client sont automatiquement respectées. « Service essentiel » est réservé aux informations de compte ou de commande.</span></label>
            <label className="sm:col-span-2 text-xs font-black">Image enrichie HTTPS (optionnel)<input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://…/campagne.webp" className="mt-2 min-h-12 w-full border border-neutral-300 px-4 text-sm" /></label>
            <label className="sm:col-span-2 text-xs font-black">Programmer (optionnel)<input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className="mt-2 min-h-12 w-full border border-neutral-300 px-4 text-sm" /><span className="mt-2 block text-[11px] font-medium leading-4 text-amber-700">Plan Vercel Hobby : la file programmée est traitée chaque jour à 09 h 05 UTC (10 h 05 à Paris en hiver, 11 h 05 en été). Utilisez « Envoyer maintenant » pour une heure précise.</span></label>
          </div>
          <div className="mt-5 rounded-2xl bg-neutral-950 p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Aperçu client</p>
            <p className="mt-3 font-black">{form.title || "Titre de la notification"}</p><p className="mt-1 text-sm leading-5 text-white/65">{form.body || "Votre message apparaîtra ici sur Android, iOS et dans la boîte de réception de l’application."}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" disabled={sending} onClick={() => void submitCampaign("send")} className="min-h-12 bg-[#12B83F] px-5 text-xs font-black text-black disabled:opacity-40">ENVOYER MAINTENANT</button>
            <button type="button" disabled={sending || !form.scheduledAt} onClick={() => void submitCampaign("schedule")} className="min-h-12 border border-black px-5 text-xs font-black disabled:opacity-30">PROGRAMMER</button>
            <button type="button" disabled={sending} onClick={() => void submitCampaign("draft")} className="min-h-12 border border-neutral-200 px-5 text-xs font-black disabled:opacity-40">ENREGISTRER BROUILLON</button>
          </div>
        </section>

        <section className="border border-neutral-200 bg-white p-5 sm:p-6">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#0b8f32]">Pilotage instantané</p><h2 className="mt-1 text-2xl font-black">Expérience et opérations</h2></div>
          <div className="mt-5 space-y-2">
            {toggleControls.map((control) => {
              const enabled = settings[control.key] === "true";
              const dangerous = "danger" in control && control.danger === true;
              return <button key={control.key} type="button" onClick={() => toggle(control.key)} className="flex min-h-16 w-full items-center justify-between gap-4 border border-neutral-200 px-4 text-left hover:border-black"><span><span className="block text-sm font-black">{control.label}</span><span className="mt-1 block text-xs text-neutral-500">{control.detail}</span></span><span aria-label={enabled ? "Activé" : "Désactivé"} className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? dangerous ? "bg-red-600" : "bg-[#12B83F]" : "bg-neutral-200"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} /></span></button>;
            })}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-black">Version minimale<input value={settings.app_minimum_version ?? ""} onChange={(event) => setSettings({ ...settings, app_minimum_version: event.target.value })} placeholder="1.0.2" className="mt-2 min-h-11 w-full border border-neutral-300 px-3" /></label>
            <label className="text-xs font-black">Dernière version<input value={settings.app_latest_version ?? ""} onChange={(event) => setSettings({ ...settings, app_latest_version: event.target.value })} placeholder="1.0.2" className="mt-2 min-h-11 w-full border border-neutral-300 px-3" /></label>
            <label className="sm:col-span-2 text-xs font-black">URL officielle de mise à jour<input value={settings.app_store_url ?? ""} onChange={(event) => setSettings({ ...settings, app_store_url: event.target.value })} placeholder="https://lecomax.com/download" className="mt-2 min-h-11 w-full border border-neutral-300 px-3 text-sm" /></label>
            <label className="sm:col-span-2 text-xs font-black">Contact support<input value={settings.app_support_contact ?? ""} onChange={(event) => setSettings({ ...settings, app_support_contact: event.target.value })} placeholder="WhatsApp ou email" className="mt-2 min-h-11 w-full border border-neutral-300 px-3 text-sm" /></label>
            <label className="sm:col-span-2 text-xs font-black">Recherches populaires<input value={settings.app_popular_searches ?? ""} onChange={(event) => setSettings({ ...settings, app_popular_searches: event.target.value })} placeholder="écouteurs, sacs, baskets" className="mt-2 min-h-11 w-full border border-neutral-300 px-3 text-sm" /></label>
          </div>
          <button type="button" onClick={() => void saveControls()} disabled={saving} className="mt-5 min-h-12 w-full bg-black px-5 text-xs font-black text-white disabled:opacity-40">{saving ? "ENREGISTREMENT…" : "ENREGISTRER ET DIFFUSER"}</button>
        </section>
      </div>

      <section className="border border-neutral-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#0b8f32]">Historique et audit</p><h2 className="mt-1 text-2xl font-black">Campagnes mobiles</h2></div><p className="text-xs text-neutral-500">{campaignData.campaigns.length} campagne(s)</p></div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-sm"><thead className="border-b border-neutral-200 text-[10px] font-black uppercase tracking-wider text-neutral-400"><tr><th className="p-3">Campagne</th><th className="p-3">Audience</th><th className="p-3">État</th><th className="p-3">Programmation</th><th className="p-3">Résultat</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>
            {campaignData.campaigns.map((campaign) => <tr key={campaign.id} className="border-b border-neutral-100 align-top"><td className="p-3"><p className="font-black">{campaign.title}</p><p className="mt-1 max-w-md text-xs text-neutral-500">{campaign.body}</p></td><td className="p-3 font-bold">{friendlyAudience(campaign.audience)}</td><td className="p-3"><span className={`px-2 py-1 text-[10px] font-black uppercase ${campaign.status === "sent" ? "bg-green-100 text-green-800" : campaign.status === "failed" ? "bg-red-100 text-red-800" : "bg-neutral-100"}`}>{friendlyStatus(campaign.status)}</span>{campaign.error_message && <p className="mt-2 max-w-xs text-xs text-red-700">{campaign.error_message}</p>}</td><td className="p-3 text-xs">{new Date(campaign.scheduled_at ?? campaign.sent_at ?? campaign.created_at).toLocaleString("fr-FR")}</td><td className="p-3 text-xs font-bold">{campaign.status === "sent" ? `${campaign.delivered_count}/${campaign.target_count} remis · ${campaign.failed_count} échec(s)` : "—"}</td><td className="p-3 text-right">{["draft", "scheduled", "failed"].includes(campaign.status) && <button disabled={sending} onClick={() => void campaignAction(campaign.id, "send")} className="mr-2 min-h-10 border border-black px-3 text-[10px] font-black">ENVOYER</button>}{["draft", "scheduled"].includes(campaign.status) && <button disabled={sending} onClick={() => void campaignAction(campaign.id, "cancel")} className="min-h-10 border border-neutral-200 px-3 text-[10px] font-black">ANNULER</button>}</td></tr>)}
            {!loading && campaignData.campaigns.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-sm text-neutral-500">Aucune campagne mobile. Créez votre première notification ci-dessus.</td></tr>}
          </tbody></table>
        </div>
      </section>

      <section><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#0b8f32]">Écosystème connecté</p><h2 className="mt-1 text-2xl font-black">Autres leviers de l’application</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{modules.map(([href, title, description], index) => <Link key={href} href={href} className="group min-h-40 border border-neutral-200 bg-white p-5 hover:border-black"><span className="text-xs font-black text-[#12B83F]">0{index + 1}</span><h3 className="mt-4 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-5 text-neutral-500">{description}</p><span className="mt-4 block text-right font-black transition group-hover:translate-x-1">→</span></Link>)}</div></section>
    </div>
  );
}
