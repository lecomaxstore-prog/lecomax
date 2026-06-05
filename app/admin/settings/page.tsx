"use client";
import { useEffect, useState } from "react";

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
  free_shipping_threshold: "300",
};

const FIELDS = [
  { key: "store_name", label: "Nom de la boutique" },
  { key: "store_email", label: "Email de contact" },
  { key: "store_phone", label: "Téléphone" },
  { key: "store_address", label: "Adresse" },
  { key: "store_city", label: "Ville" },
  { key: "currency", label: "Devise" },
  { key: "free_shipping_threshold", label: "Livraison gratuite à partir de (MAD)" },
  { key: "whatsapp_number", label: "Numéro WhatsApp" },
  { key: "instagram_url", label: "URL Instagram" },
  { key: "facebook_url", label: "URL Facebook" },
  { key: "tiktok_url", label: "URL TikTok" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (Array.isArray(data)) {
        const map: SettingsMap = { ...DEFAULT_SETTINGS };
        data.forEach((row: { key: string; value: string }) => { map[row.key] = String(row.value ?? ""); });
        setSettings(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
    else setMsg({ type: "ok", text: "Paramètres enregistrés ✓" });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black mb-1">Paramètres</h1>
      <p className="text-neutral-500 text-sm mb-6">Informations générales de la boutique.</p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Boutique */}
        <Section title="Informations de la boutique">
          {FIELDS.slice(0, 6).map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{f.label}</label>
              <input value={settings[f.key] ?? ""} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </div>
          ))}
        </Section>

        {/* Livraison */}
        <Section title="Livraison">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Livraison gratuite à partir de (MAD)</label>
            <input type="number" value={settings.free_shipping_threshold ?? ""} onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
          </div>
        </Section>

        {/* Réseaux sociaux */}
        <Section title="Réseaux sociaux">
          {FIELDS.slice(7).map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{f.label}</label>
              <input value={settings[f.key] ?? ""} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                placeholder="https://..." className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </div>
          ))}
        </Section>

        {msg && (
          <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="bg-black text-white font-bold px-8 py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
          {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer les paramètres"}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6">
      <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
