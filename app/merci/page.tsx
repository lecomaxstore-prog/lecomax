"use client";
import { RETURN_POLICY } from "@/lib/return-policy";
import { safeLocalStorage } from "@/lib/browser-storage";
import PreorderNotice from "@/components/PreorderNotice";
import { preorderCopy } from "@/lib/preorder-copy";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/components/CartContext";
import { formatMAD } from "@/lib/products";
import { resolveProductVariantImage } from "@/lib/product-variant-image";
import { getWhatsAppHref, useSettings } from "@/lib/use-settings";
import { shippingConfigFromSettings } from "@/lib/shipping-config";

type Order = {
  number: string;
  items: CartItem[];
  total: number;
  shipping: number;
  estimatedDays?: string;
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

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function MerciPage() {
  const siteSettings = useSettings();
  const shippingConfig = shippingConfigFromSettings(siteSettings);
  const [order, setOrder] = useState<Order | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [journeyVisible, setJourneyVisible] = useState(false);
  const journeyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      const raw = safeLocalStorage.getItem("lecomax_last_order");
      if (raw) setOrder(JSON.parse(raw) as Order);
    } catch {
      setOrder(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !order) return;
    const journey = journeyRef.current;
    if (!journey || typeof IntersectionObserver === "undefined") {
      setJourneyVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setJourneyVisible(entry.isIntersecting),
      { threshold: 0.22, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(journey);
    return () => observer.disconnect();
  }, [loaded, order]);

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

  const deliveryDate = order?.estimatedDays || shippingConfig.estimatedDays;

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
      <main className="relative flex min-h-[72vh] items-center justify-center overflow-hidden bg-[#f5f7f4] px-4 py-16 sm:py-20">
        <style>{`
          @keyframes lecomax-empty-enter {
            from { opacity: 0; transform: translateY(22px) scale(.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes lecomax-empty-icon {
            0% { opacity: 0; transform: translateY(8px) rotate(-7deg) scale(.75); }
            65% { opacity: 1; transform: translateY(-2px) rotate(2deg) scale(1.04); }
            100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
          }
          @keyframes lecomax-empty-pulse {
            0%, 100% { opacity: .35; transform: scale(.9); }
            50% { opacity: .65; transform: scale(1.08); }
          }
          @media (prefers-reduced-motion: reduce) {
            .lecomax-empty-motion { animation: none !important; }
          }
        `}</style>

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.10),transparent_66%)]" />

        <section className="lecomax-empty-motion relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-black/[0.07] bg-white shadow-[0_28px_90px_rgba(18,32,22,0.10)] [animation:lecomax-empty-enter_.65s_cubic-bezier(.22,1,.36,1)_both]">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-300 via-emerald-500 to-lime-300" />
          <div className="px-7 py-10 text-center sm:px-14 sm:py-14">
            <div className="relative mx-auto h-20 w-20">
              <div className="lecomax-empty-motion absolute inset-0 rounded-[25px] bg-emerald-200 [animation:lecomax-empty-pulse_3s_ease-in-out_infinite]" />
              <div className="lecomax-empty-motion relative flex h-20 w-20 items-center justify-center rounded-[25px] border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_12px_28px_rgba(16,185,129,0.14)] [animation:lecomax-empty-icon_.7s_.15s_cubic-bezier(.22,1,.36,1)_both]">
                <svg width="31" height="31" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-black text-white">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </span>
              </div>
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Espace commande
            </div>
            <h1 className="mx-auto mt-4 max-w-md text-[28px] font-black leading-[1.08] tracking-[-0.045em] text-neutral-950 sm:text-4xl">
              Retrouvez votre commande
            </h1>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-neutral-500">
              Aucune commande n’est liée à cet appareil. Saisissez simplement votre numéro de commande et l’adresse e-mail utilisée lors de l’achat.
            </p>

            <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
              <Link href="/suivre-commande" className="group flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-xs font-black uppercase tracking-[0.09em] text-white shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_16px_32px_rgba(5,150,105,0.22)]">
                Suivre ma commande
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/boutique" className="group flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 text-xs font-black uppercase tracking-[0.09em] text-neutral-900 transition duration-300 hover:-translate-y-0.5 hover:border-neutral-400 hover:bg-neutral-50">
                Voir la boutique
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-neutral-200 border-t border-neutral-200 bg-neutral-50/80 px-4 py-4 text-center text-[10px] font-bold uppercase tracking-[0.11em] text-neutral-500 sm:grid-cols-3">
            <span className="flex items-center justify-center gap-2"><span className="text-emerald-600">✓</span> Suivi sécurisé</span>
            <span className="flex items-center justify-center gap-2"><span className="text-emerald-600">✓</span> Données protégées</span>
            <span className="hidden items-center justify-center gap-2 sm:flex"><span className="text-emerald-600">✓</span> Assistance disponible</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-neutral-950">
      <style>{`
        @keyframes lecomax-success-pop {
          0% { opacity: 0; transform: translateY(12px) scale(.72) rotate(-4deg); }
          62% { opacity: 1; transform: translateY(-3px) scale(1.06) rotate(1deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
        }
        @keyframes lecomax-check-draw {
          from { stroke-dashoffset: 28; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes lecomax-success-ring {
          0% { opacity: .65; transform: scale(.7); }
          100% { opacity: 0; transform: scale(1.75); }
        }
        @keyframes lecomax-hero-rise {
          from { opacity: 0; transform: translateY(16px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes lecomax-panel-rise {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lecomax-glow-bloom {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(.5); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes lecomax-spark {
          0% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(0) scale(.4); }
          45% { opacity: .9; }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(-76px) scale(1); }
        }
        @keyframes lecomax-shine {
          0% { transform: translateX(-160%) rotate(20deg); }
          100% { transform: translateX(220%) rotate(20deg); }
        }
        @keyframes lecomax-badge-glow {
          0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,.22), 0 0 0 0 rgba(117,229,132,.18); }
          50% { box-shadow: 0 8px 28px rgba(0,0,0,.26), 0 0 0 5px rgba(117,229,132,0); }
        }
        @keyframes lecomax-badge-sweep {
          0%, 55% { transform: translateX(-220%) skewX(-18deg); opacity: 0; }
          65% { opacity: .5; }
          88%, 100% { transform: translateX(520%) skewX(-18deg); opacity: 0; }
        }
        @keyframes journey-card-in {
          0% { opacity: 0; transform: translateY(18px) scale(.975); }
          70% { opacity: 1; transform: translateY(-2px) scale(1.004); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes journey-header-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes journey-truck-drive {
          0%, 100% { transform: translateX(0) rotate(0); }
          40% { transform: translateX(3px) rotate(-2deg); }
          58% { transform: translateX(4px) rotate(1deg); }
          72% { transform: translateX(-1px) rotate(0); }
        }
        @keyframes journey-header-sweep {
          0%, 60% { transform: translateX(-160%) skewX(-18deg); opacity: 0; }
          70% { opacity: .5; }
          90%, 100% { transform: translateX(500%) skewX(-18deg); opacity: 0; }
        }
        @keyframes journey-step-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes journey-line-draw {
          from { transform: scaleY(0); opacity: .2; }
          to { transform: scaleY(1); opacity: 1; }
        }
        @keyframes journey-active-pulse {
          0%, 100% { box-shadow: 0 0 0 5px rgba(62,207,76,.12); transform: scale(1); }
          50% { box-shadow: 0 0 0 9px rgba(62,207,76,0); transform: scale(1.04); }
        }
        @keyframes journey-badge-breathe {
          0%, 100% { box-shadow: 0 4px 12px rgba(5,150,105,.08); transform: translateY(0); }
          50% { box-shadow: 0 7px 18px rgba(5,150,105,.16); transform: translateY(-1px); }
        }
        .journey-card, .journey-header, .journey-step { opacity: 0; }
        .journey-line { opacity: 0; transform: scaleY(0); transform-origin: top; }
        .journey-card.journey-visible { animation: journey-card-in .68s cubic-bezier(.2,.85,.25,1) both; }
        .journey-visible .journey-header { animation: journey-header-in .5s .16s ease-out both; }
        .journey-visible .journey-truck { animation: journey-truck-drive 3.2s .82s ease-in-out infinite; }
        .journey-visible .journey-sweep { animation: journey-header-sweep 5s 1.05s ease-in-out infinite; }
        .journey-visible .journey-badge { animation: journey-badge-breathe 2.6s .8s ease-in-out infinite; }
        .journey-visible .journey-step { animation: journey-step-in .5s cubic-bezier(.2,.8,.2,1) both; }
        .journey-visible .journey-line { animation: journey-line-draw .52s ease-out both; }
        .journey-visible .journey-active { animation: journey-active-pulse 2.6s 1.05s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lecomax-success-motion, .lecomax-success-motion * {
            animation-duration: .01ms !important;
            animation-delay: 0ms !important;
            animation-iteration-count: 1 !important;
          }
          .journey-card, .journey-card *, .journey-card *::before, .journey-card *::after {
            animation-duration: .01ms !important;
            animation-delay: 0ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
      <section className="relative flex min-h-[820px] items-start overflow-hidden bg-[#050a07] px-4 pb-48 pt-8 text-white sm:min-h-[590px] sm:pb-48 sm:pt-20 lg:min-h-[640px]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Image
            src="/images/merci.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-[center_42%] sm:block"
          />
          <Image
            src="/images/merci vr mobile.png"
            alt=""
            fill
            priority
            sizes="(max-width: 639px) 100vw, 1px"
            className="object-cover object-center [transform:translateY(145px)_scale(1.04)] sm:hidden"
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-x-0 top-0 h-[430px] bg-gradient-to-b from-[#050a07] via-[#050a07]/95 to-transparent sm:hidden" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_16%,rgba(4,12,7,0.30)_0%,rgba(4,12,7,0.62)_34%,rgba(0,0,0,0.04)_70%)] sm:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.50)_0%,rgba(0,0,0,0.30)_34%,rgba(0,0,0,0.04)_72%)]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#07110a] via-[#07110a]/55 to-transparent sm:h-56" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
          <div className="absolute left-1/2 top-[21%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3ecf4c]/10 blur-[80px] animate-[lecomax-glow-bloom_1.2s_.05s_ease-out_both] sm:top-[34%] sm:h-72 sm:w-72" />
        </div>

        <div className="lecomax-success-motion relative mx-auto w-full max-w-5xl text-center drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)]">
          <div className="relative mx-auto h-[72px] w-[72px] sm:h-24 sm:w-24" aria-hidden="true">
            <span className="absolute inset-2 rounded-[26px] border border-[#75e584]/45 animate-[lecomax-success-ring_1.25s_.35s_ease-out_both]" />
            <span className="absolute inset-2 rounded-[26px] border border-[#75e584]/25 animate-[lecomax-success-ring_1.4s_.55s_ease-out_both]" />
            {Array.from({ length: 8 }, (_, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[#9cf3a8] animate-[lecomax-spark_.8s_.38s_ease-out_both]"
                style={{ "--spark-angle": `${index * 45}deg` } as React.CSSProperties}
              />
            ))}
            <div className="absolute inset-2 flex items-center justify-center overflow-hidden rounded-[24px] border border-[#9cf3a8]/40 bg-[#3ecf4c] text-[#07110a] shadow-[0_16px_45px_rgba(62,207,76,0.32)] animate-[lecomax-success-pop_.72s_.12s_cubic-bezier(.2,.9,.2,1.25)_both]">
              <span className="absolute -left-8 top-[-20%] h-[140%] w-7 bg-white/35 blur-sm animate-[lecomax-shine_.8s_.8s_ease-in-out_both]" />
              <svg className="h-8 w-8 sm:h-11 sm:w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 4 4L19 6" strokeDasharray="28" strokeDashoffset="28" className="animate-[lecomax-check-draw_.55s_.48s_ease-out_forwards]" />
              </svg>
            </div>
          </div>
          <div className="relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#75e584]/35 bg-[linear-gradient(135deg,rgba(20,45,28,.94),rgba(7,22,13,.90))] py-1.5 pl-1.5 pr-3.5 backdrop-blur-md opacity-0 animate-[lecomax-hero-rise_.55s_.68s_ease-out_forwards,lecomax-badge-glow_2.8s_1.3s_ease-in-out_infinite] sm:mt-5">
            <span className="pointer-events-none absolute inset-y-[-35%] left-0 w-8 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-[1px] animate-[lecomax-badge-sweep_4.2s_1.4s_ease-in-out_infinite]" />
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#b7f8c0]/50 bg-[#3ecf4c] text-[#061009] shadow-[0_4px_12px_rgba(62,207,76,.30)]">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </span>
            <span className="relative text-[9px] font-black uppercase tracking-[0.17em] text-[#b7f8c0] sm:text-[10px]">Commande confirmée</span>
          </div>
          <h1 className="mx-auto mt-4 max-w-3xl text-[38px] font-black leading-[0.98] tracking-[-0.05em] opacity-0 animate-[lecomax-hero-rise_.7s_.82s_cubic-bezier(.2,.8,.2,1)_forwards] sm:mt-5 sm:text-6xl">
            Merci, {order.customer.prenom || "votre commande est confirmée"}.
          </h1>
          <p className="mx-auto mt-4 max-w-[340px] text-[13px] leading-5 text-white/70 opacity-0 animate-[lecomax-hero-rise_.7s_1s_ease-out_forwards] sm:mt-5 sm:max-w-xl sm:text-base sm:leading-6">
            Nous avons bien reçu votre commande. Un récapitulatif a été envoyé à <span className="mt-1 block break-all font-bold text-[#75e584] sm:mt-0 sm:inline sm:text-white/90">{order.customer.email}.</span>
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-28 max-w-6xl px-3 pb-20 opacity-0 animate-[lecomax-panel-rise_.75s_1.12s_ease-out_forwards] sm:-mt-28 sm:px-6 lg:-mt-32">
        <div className="grid items-start gap-5 lg:grid-cols-[1.12fr_.88fr] lg:gap-6">
          <div className="overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white shadow-[0_24px_70px_rgba(5,18,10,0.16)] sm:rounded-[28px]">
            <div className="h-1 bg-gradient-to-r from-[#3ecf4c] via-emerald-400 to-lime-300" />
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-5 sm:px-7 sm:py-6">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Numéro de commande</p>
                <p className="mt-1.5 truncate font-mono text-[20px] font-black tracking-[0.06em] sm:text-[26px] sm:tracking-[0.08em]">{order.number}</p>
              </div>
              <button
                type="button"
                onClick={copyOrderNumber}
                className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3.5 text-[9px] font-black uppercase tracking-[0.1em] transition focus:outline-none focus:ring-4 sm:px-4 sm:text-[10px] ${copied ? "bg-emerald-100 text-emerald-800 focus:ring-emerald-100" : "bg-neutral-950 text-white shadow-[0_8px_18px_rgba(0,0,0,0.14)] hover:bg-neutral-800 focus:ring-neutral-200"}`}
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
                  <li key={`${item.slug}-${item.size}-${item.color}`} className="group grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[78px_minmax(0,1fr)_auto] sm:gap-4 sm:py-5">
                    <div className="relative h-[78px] w-[72px] overflow-visible sm:h-[84px] sm:w-[78px]">
                      <div className="relative h-full w-full overflow-hidden rounded-[16px] border border-black/[0.07] bg-[linear-gradient(145deg,#fafafa,#f1f2f0)] shadow-[0_8px_20px_rgba(0,0,0,.07)]">
                        <Image src={resolveProductVariantImage({ slug: item.slug, color: item.color, fallback: item.image })} alt={`${item.name}${item.color ? ` — ${item.color}` : ""}`} fill sizes="78px" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                      </div>
                      <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-neutral-950 px-1 text-[9px] font-black text-white shadow-[0_5px_12px_rgba(0,0,0,.24)]" aria-label={`Quantité ${item.quantity}`}>×{item.quantity}</span>
                    </div>
                    <div className="min-w-0 self-center">
                      <p className="line-clamp-2 text-[13px] font-black leading-[1.35] tracking-[-0.018em] text-neutral-950 sm:text-[14px]">{item.name}</p><PreorderNotice item={item} />
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-bold">
                        {item.size && (
                          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-neutral-600">
                            <span className="mr-1 text-[8px] font-black uppercase tracking-[0.08em] text-neutral-400">Taille</span>
                            {item.size.replace(/^taille\s*:?\s*/i, "")}
                          </span>
                        )}
                        {item.color && (
                          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-neutral-600">
                            <span className="mr-1 text-[8px] font-black uppercase tracking-[0.08em] text-neutral-400">Couleur</span>
                            {item.color}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 self-center pl-1 text-right">
                      <p className="mb-1 text-[8px] font-black uppercase tracking-[0.13em] text-neutral-300">Total</p>
                      <p className="whitespace-nowrap text-[13px] font-black tracking-[-0.02em] text-neutral-950 tabular-nums sm:text-[14px]">{formatMAD(item.price * item.quantity)}</p>
                    </div>
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
            <div ref={journeyRef} className={`journey-card overflow-hidden rounded-[24px] border border-emerald-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)] ${journeyVisible ? "journey-visible" : ""}`}>
              <div className="journey-header relative flex items-center gap-4 overflow-hidden bg-gradient-to-br from-emerald-50 to-[#effff1] px-5 py-5 sm:px-6">
                <span className="journey-sweep pointer-events-none absolute inset-y-[-35%] left-0 w-12 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[1px]" aria-hidden="true" />
                <div className="journey-truck relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3ecf4c] text-[#07110a] shadow-[0_8px_20px_rgba(62,207,76,0.28)]">
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>
                </div>
                <div className="relative z-10 min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.17em] text-emerald-600">Livraison estimée</p>
                  <p className="mt-1 capitalize text-[17px] font-black tracking-[-0.02em]">{order.items.some(item => item.fulfillment_type === "PREORDER") ? preorderCopy.fr.delivery : deliveryDate}</p>
                </div>
                <span className="journey-badge relative z-10 shrink-0 rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700 shadow-sm">{order.items.some(item => item.fulfillment_type === "PREORDER") ? preorderCopy.fr.badge : deliveryDate}</span>
              </div>

              <div className="px-5 py-6 sm:px-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">Parcours de votre commande</h2>
                <ol className="mt-5">
                  {ORDER_STEPS.map((step, index) => (
                    <li key={step.title} className="journey-step relative flex gap-4 pb-6 last:pb-0" style={{ animationDelay: `${0.38 + index * 0.15}s` }}>
                      {index < ORDER_STEPS.length - 1 && <span className="journey-line absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-neutral-200" style={{ animationDelay: `${0.56 + index * 0.15}s` }} aria-hidden="true" />}
                      <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${step.active ? "journey-active border-[#3ecf4c] bg-[#3ecf4c] text-[#07110a]" : "border-neutral-200 bg-white text-neutral-400"}`}>
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

            <div className="relative overflow-hidden rounded-[26px] border border-neutral-200/90 bg-[linear-gradient(145deg,#ffffff_0%,#ffffff_62%,#f5fff6_100%)] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#3ecf4c]/10 blur-3xl" aria-hidden="true" />
              <div className="relative flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_7px_18px_rgba(16,185,129,.10)]">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-5"/>
                  </svg>
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">Votre commande est enregistrée</p>
                  <h2 className="mt-1 text-[18px] font-black leading-tight tracking-[-0.035em] text-neutral-950">Et maintenant ?</h2>
                  <p className="mt-1.5 text-[11px] leading-[1.6] text-neutral-500">Suivez chaque étape de la livraison ou continuez à découvrir la boutique.</p>
                </div>
              </div>

              <div className="relative mt-5 grid gap-2.5">
                <Link href={`/suivre-commande?order=${encodeURIComponent(order.number)}`} className="group relative flex min-h-[58px] items-center justify-between overflow-hidden rounded-[16px] bg-neutral-950 px-3.5 text-white shadow-[0_12px_26px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-neutral-900 active:translate-y-0 active:scale-[0.99]">
                  <span className="pointer-events-none absolute inset-y-[-40%] -left-12 w-10 -skew-x-12 bg-white/20 blur-sm transition-transform duration-700 group-hover:translate-x-[390px]" aria-hidden="true" />
                  <span className="relative flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[#75e584]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-[11px] font-black uppercase tracking-[0.1em]">Suivre ma commande</span>
                      <span className="mt-0.5 block truncate text-[9px] font-medium text-white/50">N° {order.number}</span>
                    </span>
                  </span>
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3ecf4c] text-[#07110a] transition-transform duration-300 group-hover:translate-x-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </span>
                </Link>

                <Link href="/boutique" className="group flex min-h-[54px] items-center justify-between rounded-[16px] border border-neutral-200 bg-white px-3.5 text-neutral-900 shadow-[0_6px_18px_rgba(0,0,0,.035)] transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_10px_24px_rgba(0,0,0,.06)] active:translate-y-0 active:scale-[0.99]">
                  <span className="flex items-center gap-3">
                    <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[13px] border border-emerald-200 bg-[linear-gradient(145deg,#ecfdf3,#dff8e5)] text-emerald-700 shadow-[0_6px_16px_rgba(16,185,129,.10)] transition duration-300 group-hover:scale-105 group-hover:bg-emerald-100">
                      <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[#3ecf4c]/20" aria-hidden="true" />
                      <svg className="relative" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m4 9 1.5-5h13L20 9" />
                        <path d="M5 11v9h14v-9" />
                        <path d="M9 20v-5h6v5" />
                        <path d="M4 9c0 1.2 1 2 2.2 2S8.5 10.2 8.5 9c0 1.2 1 2 2.3 2S13 10.2 13 9c0 1.2 1 2 2.3 2s2.2-.8 2.2-2c0 1.2 1 2 2.5 2" />
                      </svg>
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-[0.09em]">Continuer mes achats</span>
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-neutral-300 transition duration-300 group-hover:translate-x-0.5 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                  </span>
                </Link>

                <a href={getWhatsAppHref(siteSettings, whatsappMessage)} target="_blank" rel="noopener noreferrer" className="group mt-1 flex min-h-[58px] items-center gap-3 rounded-[16px] border border-emerald-100 bg-emerald-50/70 px-3.5 transition duration-300 hover:border-emerald-200 hover:bg-emerald-50 active:scale-[0.99]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#20b75a] text-white shadow-[0_6px_14px_rgba(32,183,90,.20)]">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88Z"/></svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-black text-emerald-900">Besoin d&apos;aide ?</span>
                    <span className="mt-0.5 block text-[9px] font-medium text-emerald-700/70">Notre équipe vous répond sur WhatsApp</span>
                  </span>
                  <svg className="shrink-0 text-emerald-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[26px] border border-neutral-200/90 bg-white shadow-[0_18px_55px_rgba(15,23,42,.055)]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-emerald-100/70 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4 sm:px-6 sm:py-5">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-700">Les garanties L&apos;ecomax</p>
              <h2 className="mt-1 text-[16px] font-black tracking-[-0.03em] text-neutral-950 sm:text-[18px]">Achetez en toute confiance</h2>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
              <IconCheck className="h-3 w-3" /> Vérifié
            </span>
          </div>

          <div className="relative grid gap-2.5 p-3 sm:grid-cols-3 sm:p-4">
            {[
              {
                title: "Paiement sécurisé",
                detail: "Transactions et données personnelles protégées",
                label: "Protection SSL",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/></svg>,
              },
              {
                title: RETURN_POLICY.summary,
                detail: "Une procédure claire, rapide et sans complication",
                label: "Retour simplifié",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7v6h6"/><path d="M5.6 17A8 8 0 1 0 5 7l-2 6"/></svg>,
              },
              {
                title: "Service client",
                detail: "Une équipe disponible pour vous accompagner",
                label: "À votre écoute",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 1-2ZM20 14h-3v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-2Z"/><path d="M17 19c0 1.1-.9 2-2 2h-3"/></svg>,
              },
            ].map((item) => (
              <div key={item.title} className="group flex min-h-[82px] items-center gap-3 rounded-[18px] border border-neutral-100 bg-[linear-gradient(145deg,#ffffff,#fafbf9)] px-3.5 py-3 shadow-[0_5px_18px_rgba(0,0,0,.03)] transition duration-300 hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-[0_10px_24px_rgba(16,120,65,.07)] sm:min-h-[132px] sm:flex-col sm:items-start sm:justify-between sm:px-4 sm:py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-[0_6px_16px_rgba(16,185,129,.08)] transition duration-300 group-hover:scale-105 group-hover:bg-emerald-100">
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1 sm:flex-none">
                  <p className="text-[11px] font-black tracking-[-0.01em] text-neutral-950 sm:text-[12px]">{item.title}</p>
                  <p className="mt-1 text-[9px] leading-[1.5] text-neutral-400">{item.detail}</p>
                  <span className="mt-2 hidden items-center gap-1 text-[8px] font-black uppercase tracking-[0.08em] text-emerald-700 sm:inline-flex"><IconCheck className="h-3 w-3" /> {item.label}</span>
                </div>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 sm:hidden"><IconCheck className="h-3.5 w-3.5" /></span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.24em] text-neutral-300">L&apos;ecomax · Merci pour votre confiance</p>
      </section>
    </main>
  );
}
