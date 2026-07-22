"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { publishSettings } from "@/lib/use-settings";

type Settings = Record<string, string>;
const DEFAULTS: Settings = {
  checkout_contact_title: "Vos coordonnées",
  checkout_contact_subtitle: "Pour vous contacter au sujet de votre commande",
  checkout_delivery_title: "Adresse de livraison",
  checkout_delivery_subtitle: "Indiquez précisément où recevoir votre colis",
  checkout_payment_title: "Mode de paiement",
  checkout_payment_subtitle: "Choisissez votre option de règlement",
  checkout_button_label: "Confirmer ma commande",
  checkout_notice: "",
  checkout_minimum_order: "0",
  checkout_trust_title: "Commande 100% sécurisée",
  checkout_trust_delivery: "Livraison rapide",
  checkout_trust_payment: "Paiement sûr",
  checkout_trust_returns: "Retours 30j",
  checkout_terms_note: "Paiement à la livraison disponible.",
  checkout_show_reassurance: "true",
  enable_cod: "true",
  enable_paypal: "true",
  enable_coupons: "true",
};

const input = "mt-1.5 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5";

function Field({ label, value, onChange, maxLength = 120, hint }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; hint?: string }) {
  return <label className="block text-[11px] font-black text-neutral-600">{label}<input value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className={input} />{hint && <span className="mt-1 block text-[10px] font-normal text-neutral-400">{hint}</span>}</label>;
}

function Toggle({ checked, onChange, title, description }: { checked: boolean; onChange: (checked: boolean) => void; title: string; description: string }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 border-b border-neutral-100 py-4 text-left last:border-0">
    <span><span className="block text-sm font-black">{title}</span><span className="mt-1 block text-xs leading-5 text-neutral-400">{description}</span></span>
    <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-emerald-500" : "bg-neutral-200"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} /></span>
  </button>;
}

export default function CheckoutAdminPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/checkout-settings", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les réglages.");
      setSettings({ ...DEFAULTS, ...(data.settings ?? {}) });
    }).catch(() => setError("Impossible de charger les réglages.")).finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: string) => { setSettings((current) => ({ ...current, [key]: value })); setSaved(false); };
  const enabled = (key: string) => settings[key] !== "false";

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const payload = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, settings[key] ?? DEFAULTS[key]]));
    const response = await fetch("/api/admin/checkout-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setError(data.error || "Enregistrement impossible."); return; }
    const accepted = { ...settings, ...(data.settings ?? {}) };
    setSettings(accepted); publishSettings(accepted); setSaved(true);
  }

  if (loading) return <div className="py-20 text-center text-sm text-neutral-400">Chargement du checkout…</div>;

  return <div className="mx-auto max-w-[1400px] pb-16">
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Commerce control</p><h1 className="mt-1 text-2xl font-black">Checkout</h1><p className="mt-1 max-w-2xl text-sm text-neutral-400">Pilotez l'expérience de commande, les paiements et les messages de confiance sans modifier le code.</p></div>
      <div className="flex gap-2"><Link href="/admin/shipping" className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-black hover:border-neutral-400">Zones de livraison</Link><Link href="/checkout" target="_blank" className="rounded-lg bg-black px-4 py-2.5 text-xs font-black text-white">Ouvrir le checkout</Link></div>
    </header>

    <div className="mb-5 grid gap-3 sm:grid-cols-4">
      {[{ label: "Paiement livraison", value: enabled("enable_cod") ? "Actif" : "Inactif", tone: enabled("enable_cod") }, { label: "PayPal", value: enabled("enable_paypal") ? "Actif" : "Inactif", tone: enabled("enable_paypal") }, { label: "Coupons", value: enabled("enable_coupons") ? "Actifs" : "Inactifs", tone: enabled("enable_coupons") }, { label: "Commande minimum", value: `${Number(settings.checkout_minimum_order) || 0} MAD`, tone: true }].map((item) => <div key={item.label} className="rounded-lg border border-neutral-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{item.label}</p><p className={`mt-2 text-lg font-black ${item.tone ? "text-neutral-950" : "text-neutral-400"}`}>{item.value}</p></div>)}
    </div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-5">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-black">Règles commerciales</h2><p className="mt-1 text-xs text-neutral-400">Ces règles sont vérifiées à nouveau par le serveur lors de chaque commande.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-[11px] font-black text-neutral-600">Commande minimum (MAD)<input type="number" min="0" max="1000000" value={settings.checkout_minimum_order} onChange={(e) => update("checkout_minimum_order", e.target.value)} className={input} /></label><Field label="Message commercial au checkout" value={settings.checkout_notice} onChange={(v) => update("checkout_notice", v)} maxLength={240} hint="Laissez vide pour ne rien afficher." /></div><div className="mt-3"><Toggle checked={enabled("enable_cod")} onChange={(v) => update("enable_cod", String(v))} title="Paiement à la livraison" description="Autoriser le client à payer au moment de la réception." /><Toggle checked={enabled("enable_paypal")} onChange={(v) => update("enable_paypal", String(v))} title="PayPal" description="Afficher le paiement en ligne lorsque PayPal est configuré." /><Toggle checked={enabled("enable_coupons")} onChange={(v) => update("enable_coupons", String(v))} title="Codes promotionnels" description="Permettre l'application des coupons actifs au checkout." /></div></section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6"><h2 className="text-base font-black">Étapes et libellés</h2><p className="mt-1 text-xs text-neutral-400">Modifiez les titres visibles sans toucher aux champs obligatoires.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Étape coordonnées" value={settings.checkout_contact_title} onChange={(v) => update("checkout_contact_title", v)} /><Field label="Sous-titre coordonnées" value={settings.checkout_contact_subtitle} onChange={(v) => update("checkout_contact_subtitle", v)} /><Field label="Étape livraison" value={settings.checkout_delivery_title} onChange={(v) => update("checkout_delivery_title", v)} /><Field label="Sous-titre livraison" value={settings.checkout_delivery_subtitle} onChange={(v) => update("checkout_delivery_subtitle", v)} /><Field label="Étape paiement" value={settings.checkout_payment_title} onChange={(v) => update("checkout_payment_title", v)} /><Field label="Sous-titre paiement" value={settings.checkout_payment_subtitle} onChange={(v) => update("checkout_payment_subtitle", v)} /><Field label="Bouton final" value={settings.checkout_button_label} onChange={(v) => update("checkout_button_label", v)} maxLength={40} /></div></section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6"><h2 className="text-base font-black">Confiance et réassurance</h2><div className="mt-3"><Toggle checked={enabled("checkout_show_reassurance")} onChange={(v) => update("checkout_show_reassurance", String(v))} title="Afficher le bloc de confiance" description="Présente livraison, sécurité du paiement et politique de retour." /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Titre du bloc" value={settings.checkout_trust_title} onChange={(v) => update("checkout_trust_title", v)} /><Field label="Livraison" value={settings.checkout_trust_delivery} onChange={(v) => update("checkout_trust_delivery", v)} /><Field label="Paiement" value={settings.checkout_trust_payment} onChange={(v) => update("checkout_trust_payment", v)} /><Field label="Retours" value={settings.checkout_trust_returns} onChange={(v) => update("checkout_trust_returns", v)} /><div className="sm:col-span-2"><Field label="Note sous la commande" value={settings.checkout_terms_note} onChange={(v) => update("checkout_terms_note", v)} maxLength={180} /></div></div></section>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
        <button onClick={save} disabled={saving} className="w-full rounded-lg bg-black px-5 py-4 text-sm font-black text-white shadow-lg shadow-black/10 disabled:opacity-50">{saving ? "Enregistrement…" : saved ? "Modifications enregistrées ✓" : "Enregistrer le checkout"}</button>
      </div>

      <aside><div className="sticky top-20 rounded-lg border border-neutral-200 bg-neutral-100 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Aperçu mobile</p><span className="text-[10px] text-neutral-400">Synchronisé</span></div><div className="mx-auto max-w-[360px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"><div className="border-b border-neutral-100 p-5"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">L'ECOMAX</p><h3 className="mt-1 text-xl font-black">Finaliser la commande</h3></div>{settings.checkout_notice && <div className="m-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">{settings.checkout_notice}</div>}{[["01", settings.checkout_contact_title, settings.checkout_contact_subtitle], ["02", settings.checkout_delivery_title, settings.checkout_delivery_subtitle], ["03", settings.checkout_payment_title, settings.checkout_payment_subtitle]].map(([number, title, subtitle]) => <div key={number} className="mx-4 mb-3 rounded-lg border border-neutral-200 p-3"><div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-black text-white">{number}</span><div><p className="text-xs font-black">{title}</p><p className="mt-0.5 text-[10px] leading-4 text-neutral-400">{subtitle}</p></div></div><div className="mt-3 h-9 rounded-md bg-neutral-100" /></div>)}{enabled("checkout_show_reassurance") && <div className="mx-4 mb-3 rounded-lg bg-neutral-50 p-3 text-center"><p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">{settings.checkout_trust_title}</p><div className="mt-3 grid grid-cols-3 gap-1 text-[9px] font-bold text-neutral-500"><span>{settings.checkout_trust_delivery}</span><span>{settings.checkout_trust_payment}</span><span>{settings.checkout_trust_returns}</span></div></div>}<div className="m-4 rounded-md bg-black py-3 text-center text-xs font-black text-white">{settings.checkout_button_label}</div></div></div></aside>
    </div>
  </div>;
}
