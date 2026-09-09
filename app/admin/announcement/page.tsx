"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { publishSettings } from "@/lib/use-settings";

type SettingsMap = Record<string, string>;

const DEFAULTS: SettingsMap = {
  announcement_enabled: "true",
  announcement_1: "LIVRAISON GRATUITE DÈS 500 MAD AU MAROC",
  announcement_2: "RETOURS GRATUITS SOUS 30 JOURS",
  announcement_3: "PAIEMENT À LA LIVRAISON DISPONIBLE",
  announcement_4: "",
  announcement_5: "",
  announcement_background: "#09090b",
  announcement_accent: "#3ecf4c",
  announcement_text_color: "#ffffff",
  announcement_speed: "36",
  announcement_pause_hover: "true",
  announcement_show_icons: "true",
  announcement_uppercase: "true",
  announcement_mobile_enabled: "true",
  free_shipping_threshold: "500",
};

const BOOL_OPTIONS = [
  { key: "announcement_show_icons", title: "Icônes éclair", detail: "Ajoute un repère visuel entre les messages." },
  { key: "announcement_pause_hover", title: "Pause au survol", detail: "Le défilement s'arrête quand le client le survole." },
  { key: "announcement_uppercase", title: "Texte en majuscules", detail: "Renforce la visibilité des annonces." },
  { key: "announcement_mobile_enabled", title: "Afficher sur mobile", detail: "Conserve la barre sur les petits écrans." },
];

export default function AnnouncementPage() {
  const [settings, setSettings] = useState<SettingsMap>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de charger les paramètres.");
        const next = { ...DEFAULTS };
        if (Array.isArray(data)) data.forEach((row: { key: string; value: unknown }) => { next[row.key] = String(row.value ?? ""); });
        setSettings(next);
      })
      .catch((error) => setMessage({ kind: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const messages = useMemo(
    () => [1, 2, 3, 4, 5].map((index) => settings[`announcement_${index}`]?.trim()).filter(Boolean) as string[],
    [settings]
  );

  function update(key: string, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  async function save() {
    if (!messages.length) {
      setMessage({ kind: "error", text: "Ajoutez au moins un message avant de publier." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const threshold = settings.free_shipping_threshold || "500";
    const first = settings.announcement_1.replace(
      /(LIVRAISON\s+GRATUITE\s+D[ÈE]S\s+)\d+(?:[.,]\d+)?(\s+MAD)/i,
      `$1${threshold}$2`
    );
    const payload = { ...settings, announcement_1: first };
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "La publication a échoué.");
      setSettings(payload);
      publishSettings(payload);
      setMessage({ kind: "ok", text: "Barre publiée. Les changements sont maintenant visibles sur la boutique." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-[#3ecf4c]" /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#24a936]">
            <span className="h-2 w-2 rounded-full bg-[#3ecf4c]" /> Communication boutique
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Barre d’annonce</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">Créez une annonce premium et pilotez son contenu, son style et sa vitesse depuis un seul endroit.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-6 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:translate-y-0 disabled:opacity-50">
          {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <span className="text-[#3ecf4c]">●</span>}
          {saving ? "Publication…" : "Publier les changements"}
        </button>
      </header>

      {message && <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sm:px-7">
          <div><p className="font-black">Aperçu en direct</p><p className="text-xs text-neutral-400">L&apos;apparence affichée sur votre boutique</p></div>
          <Toggle checked={settings.announcement_enabled !== "false"} onChange={(value) => update("announcement_enabled", String(value))} label={settings.announcement_enabled !== "false" ? "Active" : "Masquée"} />
        </div>
        <div className="bg-neutral-100 p-4 sm:p-7">
          <div className="overflow-hidden rounded-xl shadow-xl" style={{ backgroundColor: settings.announcement_background, color: settings.announcement_text_color }}>
            {settings.announcement_enabled === "false" ? (
              <div className="py-5 text-center text-xs font-bold text-neutral-400">La barre est actuellement masquée.</div>
            ) : (
              <div className="flex min-h-10 items-center justify-center gap-5 overflow-hidden whitespace-nowrap px-3 text-[10px] font-black tracking-[0.16em] sm:text-[11px]">
                {(messages.length ? messages.slice(0, 3) : ["AJOUTEZ UN MESSAGE"]).map((text, index) => <span key={index} className="inline-flex items-center gap-2">
                  {settings.announcement_show_icons !== "false" && <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ color: settings.announcement_accent, backgroundColor: `${settings.announcement_accent}22` }}>ϟ</span>}
                  <span className={settings.announcement_uppercase !== "false" ? "uppercase" : "normal-case"}>{text}</span>
                  <span style={{ color: settings.announcement_accent }}>◆</span>
                </span>)}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_.85fr]">
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="font-black">Messages</h2><p className="mt-1 text-xs text-neutral-400">Jusqu’à 5 messages. Les champs vides sont ignorés.</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-black text-neutral-500">{messages.length}/5 ACTIFS</span></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((index) => {
              const key = `announcement_${index}`;
              const value = settings[key] || "";
              return <label key={key} className="block rounded-2xl border border-neutral-200 p-3 transition focus-within:border-[#3ecf4c] focus-within:ring-4 focus-within:ring-green-50">
                <span className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-neutral-400"><span>Message {index}</span><span>{value.length}/160</span></span>
                <input value={value} maxLength={160} onChange={(event) => update(key, event.target.value)} placeholder={index > 3 ? "Message optionnel…" : "Saisissez votre annonce…"} className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-neutral-300" />
              </label>;
            })}
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs leading-5 text-emerald-800">Le montant de livraison gratuite est synchronisé avec le seuil global : <strong>{settings.free_shipping_threshold} MAD</strong>. <Link href="/admin/settings" className="font-black underline underline-offset-2">Modifier les frais de livraison</Link></div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-black">Identité visuelle</h2><p className="mb-5 mt-1 text-xs text-neutral-400">Adaptez la barre à votre marque.</p>
            <div className="space-y-4">
              <ColorField label="Arrière-plan" value={settings.announcement_background} onChange={(value) => update("announcement_background", value)} />
              <ColorField label="Couleur d'accent" value={settings.announcement_accent} onChange={(value) => update("announcement_accent", value)} />
              <ColorField label="Couleur du texte" value={settings.announcement_text_color} onChange={(value) => update("announcement_text_color", value)} />
            </div>
          </section>
          <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between"><h2 className="font-black">Vitesse</h2><span className="rounded-lg bg-black px-2.5 py-1 text-xs font-black text-white">{settings.announcement_speed}s</span></div>
            <input type="range" min="12" max="120" step="1" value={settings.announcement_speed} onChange={(event) => update("announcement_speed", event.target.value)} className="mt-5 w-full accent-[#3ecf4c]" />
            <div className="mt-1 flex justify-between text-[10px] font-bold text-neutral-400"><span>RAPIDE</span><span>LENT</span></div>
          </section>
          <section className="divide-y divide-neutral-100 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            {BOOL_OPTIONS.map((option) => <div key={option.key} className="flex items-center justify-between gap-4 p-4 sm:px-6"><div><p className="text-sm font-black">{option.title}</p><p className="mt-0.5 text-[11px] leading-4 text-neutral-400">{option.detail}</p></div><Toggle checked={settings[option.key] !== "false"} onChange={(value) => update(option.key, String(value))} /></div>)}
          </section>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label?: string }) {
  return <button type="button" onClick={() => onChange(!checked)} className="flex shrink-0 items-center gap-2" aria-pressed={checked}>
    {label && <span className={`text-xs font-black ${checked ? "text-emerald-600" : "text-neutral-400"}`}>{label}</span>}
    <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#3ecf4c]" : "bg-neutral-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} /></span>
  </button>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-neutral-500">{label}</span><span className="flex items-center gap-2 rounded-xl border border-neutral-200 p-1.5"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0" /><input value={value} maxLength={7} onChange={(event) => onChange(event.target.value)} className="w-20 bg-transparent text-xs font-black uppercase outline-none" /></span></label>;
}
