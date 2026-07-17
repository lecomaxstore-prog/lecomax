"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatMAD } from "@/lib/products";
import { useSettings } from "@/lib/use-settings";
import { calculateShipping, shippingConfigFromSettings } from "@/lib/shipping-config";
import { resolveProductVariantImage } from "@/lib/product-variant-image";

export default function CartPage() {
  const { items, total, count, setQty, remove, clear, inventoryNotice, dismissInventoryNotice } = useCart();
  const siteSettings = useSettings();
  const shippingConfig = shippingConfigFromSettings(siteSettings);
  const shippingCost = shippingConfig.cost;
  const freeShippingThreshold = shippingConfig.freeThreshold;
  const shipping = calculateShipping(total, shippingConfig);

  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<null | {
    code: string;
    type: "percent" | "fixed";
    value: number;
    label: string;
    discount: number;
    excludedItemsCount: number;
    excludedSubtotal: number;
  }>(null);
  const [promoError, setPromoError] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const discount = promoApplied?.discount ?? 0;

  const grandTotal = total + shipping - discount;

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/coupons/validate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Code invalide ou inactif");
        setPromoApplied(null);
      } else {
        const label = data.type === "percent" ? `-${data.value}%` : `-${data.value} MAD`;
        setPromoApplied({
          code: data.code,
          type: data.type,
          value: data.value,
          label,
          discount: data.discount,
          excludedItemsCount: data.excluded_items_count ?? 0,
          excludedSubtotal: data.excluded_subtotal ?? 0,
        });
        setPromoError("");
        setPromoInput("");
      }
    } catch {
      setPromoError("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setPromoApplied(null);
    setPromoError("");
    setPromoInput("");
  }

  // Keep an applied coupon accurate when quantities or cart lines change.
  useEffect(() => {
    if (!promoApplied) return;
    if (items.length === 0) {
      setPromoApplied(null);
      return;
    }

    const controller = new AbortController();
    fetch("/api/coupons/validate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        code: promoApplied.code,
        items: items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
      }),
    })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!response.ok) {
          setPromoApplied(null);
          setPromoError(data.error || "Le code promo n'est plus applicable.");
          return;
        }
        setPromoApplied((current) => current ? {
          ...current,
          discount: data.discount,
          excludedItemsCount: data.excluded_items_count ?? 0,
          excludedSubtotal: data.excluded_subtotal ?? 0,
        } : null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPromoError("Impossible de recalculer le code promo.");
      });

    return () => controller.abort();
  // Revalidate only when the cart itself changes; updating promoApplied is the result.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <div className="min-h-[60vh] bg-[#f7f7f8]">
      {inventoryNotice && (
        <div role="status" className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-xs text-amber-900 md:px-6">
            <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-black">!</span>
            <p className="flex-1 font-semibold leading-5">{inventoryNotice}</p>
            <button type="button" onClick={dismissInventoryNotice} aria-label="Fermer le message" className="min-h-8 px-2 font-black text-amber-700 hover:text-black">×</button>
          </div>
        </div>
      )}
      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 text-[12px] text-neutral-400 flex items-center gap-2">
          <Link href="/" className="hover:text-black transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-black font-semibold">Panier</span>
        </div>
      </div>

      {/* Checkout stepper */}
      <div className="bg-white border-b border-neutral-100 overflow-hidden">
        <style>{`
          @keyframes stepPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(62,207,76,0.5); }
            50%       { box-shadow: 0 0 0 10px rgba(62,207,76,0); }
          }
          @keyframes stepShine {
            0%   { transform: translateX(-100%) skewX(-20deg); opacity: 0; }
            40%  { opacity: 0.6; }
            100% { transform: translateX(250%) skewX(-20deg); opacity: 0; }
          }
          @keyframes lineGrow {
            from { transform: scaleX(0); }
            to   { transform: scaleX(1); }
          }
          @keyframes stepBounce {
            0%, 100% { transform: translateY(0); }
            40%      { transform: translateY(-4px); }
            60%      { transform: translateY(-2px); }
          }
          @keyframes deliveryCardIn {
            0%   { opacity: 0; transform: translateY(10px) scale(.975); }
            70%  { opacity: 1; transform: translateY(-1px) scale(1.005); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes deliveryTruckDrive {
            0%, 100% { transform: translateX(0) rotate(0); }
            38%      { transform: translateX(3px) rotate(-2deg); }
            52%      { transform: translateX(4px) rotate(1deg); }
            68%      { transform: translateX(-1px) rotate(0); }
          }
          @keyframes deliveryStatusPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(62, 207, 76, .38); }
            50%      { box-shadow: 0 0 0 5px rgba(62, 207, 76, 0); }
          }
          @keyframes deliverySweep {
            0%, 62%  { transform: translateX(-180%) skewX(-18deg); opacity: 0; }
            70%      { opacity: .45; }
            88%, 100% { transform: translateX(520%) skewX(-18deg); opacity: 0; }
          }
          @keyframes deliveryFeeFloat {
            0%   { opacity: 0; transform: translateX(6px) scale(.92); }
            100% { opacity: 1; transform: translateX(0) scale(1); }
          }
          .step-active-circle {
            animation: stepPulse 2s ease-in-out infinite, stepBounce 2.4s ease-in-out infinite;
          }
          .step-active-shine::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
            border-radius: 9999px;
            animation: stepShine 2.2s ease-in-out infinite;
          }
          .step-connector-fill {
            transform-origin: left;
            animation: lineGrow 0.6s ease-out forwards;
          }
          .delivery-mobile-card {
            animation: deliveryCardIn .58s cubic-bezier(.2,.85,.25,1) both;
          }
          .delivery-mobile-card::after {
            content: '';
            pointer-events: none;
            position: absolute;
            inset: -30% auto -30% -20%;
            width: 18%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,.8), transparent);
            filter: blur(1px);
            animation: deliverySweep 4.8s 1s ease-in-out infinite;
          }
          .delivery-mobile-truck {
            animation: deliveryTruckDrive 3s .65s ease-in-out infinite;
          }
          .delivery-mobile-status {
            animation: deliveryStatusPulse 2.2s .8s ease-out infinite;
          }
          .delivery-mobile-fee {
            animation: deliveryFeeFloat .45s .28s ease-out both;
          }
          @media (prefers-reduced-motion: reduce) {
            .step-active-circle,
            .step-active-shine::after,
            .step-connector-fill,
            .delivery-mobile-card,
            .delivery-mobile-card::after,
            .delivery-mobile-truck,
            .delivery-mobile-status,
            .delivery-mobile-fee {
              animation: none !important;
            }
          }
        `}</style>
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-center gap-0">
          {[
            { n: 1, label: "PANIER" },
            { n: 2, label: "PAIEMENT" },
            { n: 3, label: "CONFIRMATION" },
          ].map((step, idx) => (
            <div key={step.n} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black border-2 transition-all overflow-hidden ${
                    step.n === 1
                      ? "bg-[#3ecf4c] border-[#3ecf4c] text-white step-active-circle step-active-shine"
                      : "bg-white border-neutral-200 text-neutral-400"
                  }`}
                >
                  {step.n}
                </div>
                <span className={`text-[10px] tracking-[0.15em] font-black transition-colors ${step.n === 1 ? "text-[#3ecf4c]" : "text-neutral-300"}`}>
                  {step.label}
                </span>
              </div>
              {idx < 2 && (
                <div className="w-16 md:w-28 h-[2px] bg-neutral-100 mx-2 mb-5 relative overflow-hidden">
                  {step.n === 1 && (
                    <div className="absolute inset-0 step-connector-fill" style={{ background: "linear-gradient(90deg, #3ecf4c, #6bdd6b)" }} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {items.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
            </div>
            <h2 className="font-black text-2xl mb-2 uppercase tracking-wide">Panier vide</h2>
            <p className="text-neutral-400 text-sm mb-8 max-w-xs">Découvrez notre sélection et ajoutez vos articles préférés.</p>
            <Link
              href="/boutique"
              className="inline-flex items-center gap-2 px-8 py-4 font-black uppercase text-[12px] tracking-[0.12em] text-white hover:opacity-90 active:scale-95 transition-all"
              style={{ background: "#000", color: "#fff" }}
            >
              Découvrir la boutique
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
            {/* ── LEFT: Items ── */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              {/* Cart heading row */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-700">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                  </svg>
                  <span className="font-black text-[15px]">Mon panier</span>
                  <span className="ml-1 w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center" style={{ background: "#3ecf4c", color: "#000" }}>
                    {count}
                  </span>
                </div>
                <Link
                  href="/"
                  className="text-[12px] text-neutral-500 hover:text-black transition-colors font-semibold flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Continuer les achats
                </Link>
              </div>

              {/* Shipping info */}
              <div className="px-6 py-3 bg-[#f0fdf4] border-b border-[#3ecf4c]/20 flex items-center gap-2 text-[11px] font-black text-[#16a34a] uppercase tracking-wider">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  {shipping === 0
                    ? "Livraison gratuite 🎉"
                    : freeShippingThreshold > 0
                      ? `Livraison ${shippingCost} MAD — gratuite dès ${freeShippingThreshold} MAD`
                      : `Livraison ${shippingCost} MAD partout au Maroc`}
              </div>

              {/* Estimated delivery */}
              <div className="delivery-mobile-card relative isolate mx-4 my-3 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50 shadow-[0_10px_26px_rgba(5,150,105,0.09)] sm:hidden">
                <div className="relative z-10 flex items-center gap-3 px-3.5 py-3.5">
                  <span className="delivery-mobile-truck relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#087a49] text-white shadow-[0_7px_16px_rgba(8,122,73,0.22)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" />
                      <circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
                    </svg>
                    <span className="delivery-mobile-status absolute -right-1 -top-1 h-3 w-3 rounded-full border-[2.5px] border-white bg-[#3ecf4c]" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">Livraison estimée</p>
                    <p className="mt-0.5 text-[17px] font-black leading-none tracking-[-0.035em] text-neutral-950">Chez vous en {shippingConfig.estimatedDays}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[9px] font-semibold text-neutral-500">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>
                      Partout au Maroc · Suivi inclus
                    </p>
                  </div>

                  <span className="delivery-mobile-fee shrink-0 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[9px] font-black text-emerald-700 shadow-sm">
                    {shipping === 0 ? "GRATUITE" : `${shipping} MAD`}
                  </span>
                </div>
              </div>

              <div className="mx-6 my-4 hidden overflow-hidden rounded-[22px] border border-emerald-200 bg-white shadow-[0_16px_40px_rgba(5,150,105,0.10)] sm:block">
                <div className="relative overflow-hidden bg-[linear-gradient(135deg,#edfff3_0%,#f9fffa_52%,#f4ffe8_100%)] px-4 py-4 sm:px-5 sm:py-5">
                  <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#3ecf4c]/10 blur-2xl" />

                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#087a49] text-white shadow-[0_9px_22px_rgba(8,122,73,0.24)]">
                        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" />
                          <circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
                          <path d="M6 10h4" />
                        </svg>
                        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#3ecf4c]" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.19em] text-emerald-700">Livraison estimée</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">Délai estimé après confirmation</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700 shadow-sm">
                      {shipping === 0 ? "Gratuite" : `${shipping} MAD`}
                    </span>
                  </div>

                  <div className="relative mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm sm:max-w-md">
                    <div className="min-w-[72px] text-center">
                      <p className="text-[25px] font-black leading-none tracking-[-0.05em] text-neutral-950">24h</p>
                      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600">Au plus tôt</p>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2" aria-hidden="true">
                      <span className="h-px flex-1 bg-gradient-to-r from-emerald-300 to-[#3ecf4c]" />
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3ecf4c] text-black shadow-[0_5px_12px_rgba(62,207,76,0.28)]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-[#3ecf4c] to-emerald-300" />
                    </div>
                    <div className="min-w-[72px] text-center">
                      <p className="text-[18px] font-black leading-none tracking-[-0.05em] text-neutral-950">{shippingConfig.estimatedDays}</p>
                      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600">Au plus tard</p>
                    </div>
                  </div>

                  <div className="relative mt-3 flex items-center gap-2 text-[10px] font-semibold text-neutral-500">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="M12 6v6l4 2"/></svg>
                    Partout au Maroc · Suivi de colis inclus
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-neutral-100 border-t border-emerald-100 bg-white px-2 py-3.5" aria-label="Étapes de livraison">
                  {[
                    { title: "Confirmée", time: "Maintenant", done: true },
                    { title: "Préparation", time: "Sous 24h", done: false },
                    { title: "Chez vous", time: shippingConfig.estimatedDays, done: false },
                  ].map((step, index) => (
                    <div key={step.title} className="flex min-w-0 items-center justify-center gap-2 px-1.5 sm:px-3">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${step.done ? "bg-[#3ecf4c] text-black shadow-[0_0_0_4px_rgba(62,207,76,0.12)]" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                        {step.done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 4 4L19 6" /></svg> : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[9px] font-black text-neutral-800 sm:text-[10px]">{step.title}</span>
                        <span className="mt-0.5 block truncate text-[8px] font-semibold text-neutral-400 sm:text-[9px]">{step.time}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column headers */}
              <div className="hidden md:grid grid-cols-[1fr_100px_120px_100px] px-6 py-3 border-b border-neutral-100 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">
                <span>Produit</span>
                <span className="text-center">Prix</span>
                <span className="text-center">Quantité</span>
                <span className="text-right">Total</span>
              </div>

              {/* Items */}
              <ul className="divide-y divide-neutral-100">
                {items.map((i) => {
                  const displayImage = resolveProductVariantImage({ slug: i.slug, color: i.color, fallback: i.image });
                  return (
                  <li key={i.slug + i.size + i.color} className="px-6 py-5 grid grid-cols-[72px_1fr] md:grid-cols-[72px_1fr_100px_120px_100px] gap-4 items-center">
                    {/* Image */}
                    <Link href={`/produit/${i.slug}`} className="relative block w-[72px] h-[90px] bg-neutral-50 rounded-lg overflow-hidden group shrink-0">
                      <Image src={displayImage} alt={i.name} fill sizes="72px" className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                    </Link>
                    {/* Name + size */}
                    <div className="min-w-0">
                      <Link href={`/produit/${i.slug}`} className="font-bold text-[13px] leading-snug hover:text-neutral-600 transition-colors line-clamp-2">{i.name}</Link>
                      <p className="text-[11px] text-neutral-400 mt-0.5 uppercase tracking-wide">
                        {i.size && i.size !== "Taille unique" ? `Taille : ${i.size}` : ""}
                        {i.size && i.size !== "Taille unique" && i.color ? " · " : ""}
                        {i.color ? `Couleur : ${i.color}` : ""}
                        {(!i.color && i.size === "Taille unique") ? "Taille unique" : ""}
                      </p>
                      {/* Mobile: qty stepper + price + remove */}
                      <div className="flex items-center gap-3 mt-2.5 md:hidden">
                        <div className="inline-flex border border-neutral-200 rounded-lg overflow-hidden">
                          <button onClick={() => setQty(i.slug, i.size, i.color, i.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-base font-light hover:bg-neutral-50 transition-colors">−</button>
                          <span className="w-9 h-8 flex items-center justify-center text-[13px] font-black border-x border-neutral-200">{i.quantity}</span>
                          <button onClick={() => setQty(i.slug, i.size, i.color, i.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-base font-light hover:bg-neutral-50 transition-colors">+</button>
                        </div>
                        <span className="text-[13px] font-black">{formatMAD(i.price * i.quantity)}</span>
                        <button onClick={() => remove(i.slug, i.size, i.color)} className="ml-auto text-neutral-300 hover:text-red-400 transition-colors" aria-label="Retirer">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                    {/* Unit price (desktop) */}
                    <span className="hidden md:block text-center text-[13px] font-semibold text-neutral-700">{formatMAD(i.price)}</span>
                    {/* Qty stepper */}
                    <div className="hidden md:flex items-center justify-center">
                      <div className="inline-flex border border-neutral-200 rounded-lg overflow-hidden">
                        <button onClick={() => setQty(i.slug, i.size, i.color, i.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-base font-light hover:bg-neutral-50 transition-colors">−</button>
                        <span className="w-9 h-8 flex items-center justify-center text-[13px] font-black border-x border-neutral-200">{i.quantity}</span>
                        <button onClick={() => setQty(i.slug, i.size, i.color, i.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-base font-light hover:bg-neutral-50 transition-colors">+</button>
                      </div>
                    </div>
                    {/* Row total + remove (desktop) */}
                    <div className="hidden md:flex flex-col items-end gap-1.5">
                      <span className="text-[14px] font-black">{formatMAD(i.price * i.quantity)}</span>
                      <button onClick={() => remove(i.slug, i.size, i.color)} className="text-neutral-300 hover:text-red-400 transition-colors" aria-label="Retirer">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </li>
                  );
                })}
              </ul>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between min-h-[54px]">
                {confirmClear ? (
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full rounded-xl border border-red-100 bg-red-50/60 px-3 py-2">
                    <span className="flex items-center gap-2 text-[12px] text-neutral-700 font-bold flex-1 min-w-[150px]">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/></svg>
                      </span>
                      Vider tout le panier ?
                    </span>
                    <button
                      onClick={() => { clear(); setConfirmClear(false); }}
                      className="px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] border border-neutral-200 bg-white text-neutral-500 rounded-lg hover:border-neutral-400 hover:text-black active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[11px] text-neutral-300">{count} article{count !== 1 ? "s" : ""}</span>
                    <button
                      onClick={() => setConfirmClear(true)}
                      aria-label="Vider tous les articles du panier"
                      className="group inline-flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-px hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-[0_5px_16px_rgba(239,68,68,0.10)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors duration-200 group-hover:bg-red-100 group-hover:text-red-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </span>
                      Vider le panier
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── RIGHT: Summary ── */}
            <aside className="sticky top-24 space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h2 className="font-black text-[13px] uppercase tracking-[0.15em]">Récapitulatif</h2>
                  <span className="text-[11px] text-neutral-400">{count} article{count !== 1 ? "s" : ""}</span>
                </div>

                <div className="px-6 py-5 space-y-3">
                  {/* Sous-total */}
                  <div className="flex justify-between text-[13px] text-neutral-600">
                    <span>Sous-total</span>
                    <span className="font-bold text-black">{formatMAD(total)}</span>
                  </div>

                  {/* Livraison */}
                  <div className="flex justify-between text-[13px] text-neutral-600">
                    <span>Livraison</span>
                    <span className="font-bold">
                      {shipping === 0
                        ? <span className="text-[#16a34a] flex items-center gap-1">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                            Gratuite
                          </span>
                        : formatMAD(shipping)}
                    </span>
                  </div>

                  {/* Promo discount line */}
                  {siteSettings.enable_coupons !== "false" && promoApplied && (
                    <div className="flex justify-between text-[13px]">
                      <span className="flex items-center gap-1.5 text-[#16a34a] font-bold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                        Code {promoApplied.code}
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: "#f0fdf4", color: "#16a34a" }}>{promoApplied.label}</span>
                      </span>
                      <span className="font-bold text-[#16a34a]">−{formatMAD(discount)}</span>
                    </div>
                  )}

                  {/* ── Promo code input ── */}
                  {siteSettings.enable_coupons !== "false" && <div className="pt-1">
                    {!promoApplied ? (
                      <div>
                        <button
                          onClick={() => setPromoOpen(o => !o)}
                          className="flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-black transition-colors font-semibold w-full"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21.5 12.5l-9-9a2 2 0 00-1.4-.5H4a2 2 0 00-2 2v7.1a2 2 0 00.5 1.4l9 9a2 2 0 002.8 0l7.2-7.2a2 2 0 000-2.8z"/>
                            <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/>
                          </svg>
                          Vous avez un code promo ?
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`ml-auto transition-transform duration-200 ${promoOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6"/></svg>
                        </button>

                        {promoOpen && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={promoInput}
                              onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                              onKeyDown={e => e.key === "Enter" && applyPromo()}
                              placeholder="CODE PROMO"
                              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2.5 text-[12px] font-bold uppercase tracking-wider outline-none focus:border-[#3ecf4c] transition-colors placeholder:text-neutral-300"
                            />
                            <button
                              onClick={applyPromo}
                              disabled={promoLoading}
                              className="px-4 py-2.5 text-[12px] font-black uppercase tracking-wide rounded-lg transition-colors disabled:opacity-60"
                              style={{ background: "#000", color: "#fff" }}
                            >
                              {promoLoading ? "..." : "OK"}
                            </button>
                          </div>
                        )}
                        {promoOpen && (
                          <p className="mt-2 flex items-start gap-1.5 text-[10px] font-medium leading-relaxed text-neutral-400">
                            <svg className="mt-0.5 shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
                            Les codes promo s&apos;appliquent uniquement aux articles qui ne sont pas déjà en promotion.
                          </p>
                        )}
                        {promoError && (
                          <p className="mt-2 text-[11px] text-red-500 font-semibold flex items-center gap-1">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                            {promoError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg px-3 py-2.5" style={{ background: "#f0fdf4", border: "1px solid rgba(62,207,76,0.3)" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-black text-[#16a34a] flex items-center gap-1.5">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                            {promoApplied.code} appliqué
                          </span>
                          <button onClick={removePromo} aria-label="Retirer le code promo" className="text-neutral-400 hover:text-red-500 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                        {promoApplied.excludedItemsCount > 0 && (
                          <p className="mt-2 border-t border-emerald-200/70 pt-2 text-[10px] font-semibold leading-relaxed text-amber-700">
                            {promoApplied.excludedItemsCount} article{promoApplied.excludedItemsCount > 1 ? "s" : ""} déjà en promotion exclu{promoApplied.excludedItemsCount > 1 ? "s" : ""} du code ({formatMAD(promoApplied.excludedSubtotal)}).
                          </p>
                        )}
                      </div>
                    )}
                  </div>}

                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 mt-1 border-t border-neutral-100">
                    <span className="font-black text-[15px]">Total TTC</span>
                    <div className="text-right">
                      {discount > 0 && (
                        <div className="text-[12px] text-neutral-400 line-through">{formatMAD(total + shipping)}</div>
                      )}
                      <span className="font-black text-[22px]" style={{ color: "#3ecf4c" }}>{formatMAD(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <Link
                    href="/checkout"
                    className="w-full flex items-center justify-center gap-2 py-4 font-black uppercase text-[12px] tracking-[0.15em] rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                    style={{ background: "#000", color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                    Procéder au paiement
                  </Link>

                  <p className="text-center text-[11px] text-neutral-400 mt-3 flex items-center justify-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#3ecf4c]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Paiement sécurisé · {freeShippingThreshold > 0 ? `Livraison gratuite dès ${freeShippingThreshold} MAD` : `Livraison ${shippingCost} MAD`}
                  </p>
                </div>
              </div>

              {/* Trust badges card */}
              <div className="bg-white rounded-xl border border-neutral-200 px-5 py-4 space-y-3">
                {[
                  { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Retours gratuits sous 30 jours" },
                  { icon: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8z", label: `Livraison sous ${shippingConfig.estimatedDays}` },
                  { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Paiement 100% sécurisé" },
                ].map(t => (
                  <div key={t.label} className="flex items-center gap-2.5 text-[12px] text-neutral-600">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(62,207,76,0.12)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "#3ecf4c" }}><path d={t.icon}/></svg>
                    </span>
                    {t.label}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
