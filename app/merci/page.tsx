"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/components/CartContext";
import { formatMAD } from "@/lib/products";
import { getWhatsAppHref, useSettings } from "@/lib/use-settings";

type Order = {
  number: string;
  items: CartItem[];
  total: number;
  shipping: number;
  customer: { prenom: string; nom: string; email: string; ville: string };
  payment: string;
  date: string;
};

const ORDER_STEPS = [
  { title: "Commande confirmée", detail: "Votre commande est bien enregistrée", active: true },
  { title: "Préparation", detail: "Notre équipe prépare soigneusement vos articles", active: false },
  { title: "Expédition", detail: "Vous recevrez les informations de livraison", active: false },
  { title: "Livraison", detail: "Votre colis arrive à l’adresse indiquée", active: false },
];

function addBusinessDays(start: Date, businessDays: number) {
  const date = new Date(start);
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) added += 1;
  }
  return date;
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function MerciPage() {
  const siteSettings = useSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      const raw = localStorage.getItem("lecomax_last_order");
      if (raw) setOrder(JSON.parse(raw) as Order);
    } catch {
      setOrder(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  const copyOrderNumber = useCallback(async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [order]);

  const deliveryDate = useMemo(() => {
    const orderDate = order?.date ? new Date(order.date) : new Date();
    const safeDate = Number.isNaN(orderDate.getTime()) ? new Date() : orderDate;
    return addBusinessDays(safeDate, 3).toLocaleDateString("fr-MA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [order?.date]);

  const paymentLabel = order?.payment === "livraison" ? "Paiement à la livraison" : "PayPal";
  const itemCount = order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const subtotal = Math.max(0, (order?.total ?? 0) - (order?.shipping ?? 0));
  const whatsappMessage = order
    ? `Bonjour L'ECOMAX,\n\nJ'ai une question concernant ma commande ${order.number}.\n\nNom : ${order.customer.prenom} ${order.customer.nom}\nVille : ${order.customer.ville}\nTotal : ${order.total} MAD`
    : "Bonjour L'ECOMAX, j'ai une question concernant ma commande.";

  if (!loaded) {
    return (
      <div className="min-h-[70vh] bg-[#f6f7f5] px-4 py-16">
        <div className="mx-auto h-72 max-w-4xl animate-pulse rounded-[28px] bg-white" />
      </div>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f7f5] px-4 py-16">
        <div className="w-full max-w-lg rounded-[28px] border border-neutral-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <h1 className="mt-6 text-2xl font-black tracking-[-0.03em]">Aucune commande récente</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">Retrouvez une commande avec son numéro et l’adresse e-mail utilisée lors de l’achat.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link href="/suivre-commande" className="rounded-xl bg-black px-5 py-3.5 text-xs font-black uppercase tracking-[0.1em] text-white">Suivre une commande</Link>
            <Link href="/boutique" className="rounded-xl border border-neutral-200 px-5 py-3.5 text-xs font-black uppercase tracking-[0.1em] text-neutral-800">Voir la boutique</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-neutral-950">
      <section className="relative overflow-hidden bg-[#07110a] px-4 pb-24 pt-14 text-white sm:pb-28 sm:pt-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[#3ecf4c]/15 blur-3xl" />
          <div className="absolute -bottom-52 left-1/4 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#75e584]/30 bg-[#3ecf4c] text-[#07110a] shadow-[0_14px_40px_rgba(62,207,76,0.28)] sm:h-20 sm:w-20">
            <IconCheck className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#75e584]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9cf3a8]">Commande confirmée</span>
          </div>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
            Merci, {order.customer.prenom || "votre commande est confirmée"}.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
            Nous avons bien reçu votre commande. Un récapitulatif a été envoyé à <span className="font-semibold text-white/90">{order.customer.email}</span>.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 pb-20 sm:-mt-16 sm:px-6">
        <div className="grid items-start gap-5 lg:grid-cols-[1.12fr_.88fr] lg:gap-6">
          <div className="overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.09)] sm:rounded-[28px]">
            <div className="flex flex-col gap-5 border-b border-neutral-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Numéro de commande</p>
                <p className="mt-1.5 font-mono text-[22px] font-black tracking-[0.08em] sm:text-[26px]">{order.number}</p>
              </div>
              <button
                type="button"
                onClick={copyOrderNumber}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.1em] transition focus:outline-none focus:ring-4 ${copied ? "bg-emerald-100 text-emerald-800 focus:ring-emerald-100" : "bg-neutral-950 text-white hover:bg-neutral-800 focus:ring-neutral-200"}`}
              >
                {copied ? <IconCheck className="h-4 w-4" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                {copied ? "Numéro copié" : "Copier"}
              </button>
            </div>

            <div className="px-5 py-2 sm:px-7">
              <div className="flex items-center justify-between border-b border-neutral-100 py-4">
                <h2 className="text-xs font-black uppercase tracking-[0.14em]">Votre commande</h2>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-500">{itemCount} article{itemCount > 1 ? "s" : ""}</span>
              </div>
              <ul className="divide-y divide-neutral-100">
                {order.items.map((item) => (
                  <li key={`${item.slug}-${item.size}-${item.color}`} className="flex items-center gap-4 py-4">
                    <div className="relative h-[76px] w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100">
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                      <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[9px] font-black text-white">{item.quantity}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-bold leading-5">{item.name}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold text-neutral-400">
                        {item.size && <span className="rounded-md bg-neutral-100 px-2 py-1">Taille {item.size}</span>}
                        {item.color && <span className="rounded-md bg-neutral-100 px-2 py-1">{item.color}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] font-black tabular-nums">{formatMAD(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-5 sm:px-7">
              <div className="ml-auto max-w-sm space-y-2.5 text-[13px]">
                <div className="flex justify-between text-neutral-500"><span>Sous-total</span><span className="font-semibold text-neutral-800">{formatMAD(subtotal)}</span></div>
                <div className="flex justify-between text-neutral-500"><span>Livraison</span><span className={order.shipping === 0 ? "font-bold text-emerald-600" : "font-semibold text-neutral-800"}>{order.shipping === 0 ? "Gratuite" : formatMAD(order.shipping)}</span></div>
                <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-black"><span>Total TTC</span><span className="text-xl text-[#25b83a]">{formatMAD(order.total)}</span></div>
              </div>
            </div>

            <div className="grid border-t border-neutral-100 sm:grid-cols-3 sm:divide-x sm:divide-neutral-100">
              {[
                { label: "Paiement", value: paymentLabel },
                { label: "Destination", value: `${order.customer.ville || "Maroc"}, Maroc` },
                { label: "Date", value: new Date(order.date).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" }) },
              ].map((detail) => (
                <div key={detail.label} className="border-b border-neutral-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:px-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">{detail.label}</p>
                  <p className="mt-1.5 text-[12px] font-bold text-neutral-800">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[24px] border border-emerald-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-[#effff1] px-5 py-5 sm:px-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3ecf4c] text-[#07110a] shadow-[0_8px_20px_rgba(62,207,76,0.28)]">
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.17em] text-emerald-600">Livraison estimée</p>
                  <p className="mt-1 capitalize text-[17px] font-black tracking-[-0.02em]">{deliveryDate}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700 shadow-sm">2–5 jours</span>
              </div>

              <div className="px-5 py-6 sm:px-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">Parcours de votre commande</h2>
                <ol className="mt-5">
                  {ORDER_STEPS.map((step, index) => (
                    <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                      {index < ORDER_STEPS.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-neutral-200" aria-hidden="true" />}
                      <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${step.active ? "border-[#3ecf4c] bg-[#3ecf4c] text-[#07110a] shadow-[0_0_0_5px_rgba(62,207,76,0.12)]" : "border-neutral-200 bg-white text-neutral-400"}`}>
                        {step.active ? <IconCheck className="h-4 w-4" /> : index + 1}
                      </span>
                      <div className="pt-0.5">
                        <p className={`text-[13px] font-bold ${step.active ? "text-neutral-950" : "text-neutral-500"}`}>{step.title}</p>
                        <p className="mt-1 text-[10px] leading-4 text-neutral-400">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] sm:p-6">
              <h2 className="text-base font-black tracking-[-0.02em]">Que souhaitez-vous faire ?</h2>
              <p className="mt-1 text-[11px] leading-5 text-neutral-500">Gardez votre numéro de commande pour suivre sa progression.</p>
              <div className="mt-5 grid gap-2.5">
                <Link href={`/suivre-commande?order=${encodeURIComponent(order.number)}`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-[11px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-neutral-800 active:scale-[0.99]">
                  Suivre ma commande
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </Link>
                <Link href="/boutique" className="flex h-12 items-center justify-center rounded-xl border border-neutral-200 px-5 text-[11px] font-black uppercase tracking-[0.1em] text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]">Continuer mes achats</Link>
                <a href={getWhatsAppHref(siteSettings, whatsappMessage)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 text-[11px] font-bold text-neutral-500 transition hover:text-emerald-700">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88Z"/></svg>
                  Besoin d&apos;aide ? Contactez-nous
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 grid gap-3 rounded-[22px] border border-neutral-200 bg-white p-4 sm:grid-cols-3 sm:p-5">
          {[
            { title: "Paiement sécurisé", detail: "Vos données restent protégées" },
            { title: "Retours sous 30 jours", detail: "Une procédure simple et claire" },
            { title: "Service client", detail: "Une équipe disponible pour vous aider" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><IconCheck className="h-4 w-4" /></span>
              <div><p className="text-[11px] font-black">{item.title}</p><p className="mt-0.5 text-[9px] text-neutral-400">{item.detail}</p></div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.24em] text-neutral-300">L&apos;ecomax · Merci pour votre confiance</p>
      </section>
    </main>
  );
}
