"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CartItem } from "@/components/CartContext";
import { formatMAD } from "@/lib/products";
import { useSettings, getWhatsAppHref } from "@/lib/use-settings";

type Order = {
  number: string;
  items: CartItem[];
  total: number;
  shipping: number;
  customer: { prenom: string; nom: string; email: string; ville: string };
  payment: string;
  date: string;
};

type Particle = {
  id: number; color: string; left: number; size: number;
  delay: number; duration: number; shape: "square" | "circle" | "diamond";
};

const CONFETTI_COLORS = [
  "#FFD700", "#FF4500", "#00C49F", "#7C3AED", "#2563EB",
  "#F97316", "#10B981", "#EC4899", "#FACC15", "#06B6D4",
  "#A855F7", "#EF4444", "#84CC16", "#F59E0B", "#3B82F6",
  "#000000", "#1a1a1a", "#FF69B4", "#FF1493", "#00BFFF",
];

const SPARKLES = ["✦", "✧", "★", "✦", "✧", "✦"];

const STEPS = [
  { label: "Commande reçue",   icon: "✓", color: "#10B981" },
  { label: "En préparation",   icon: "📦", color: "#F59E0B" },
  { label: "En livraison",     icon: "🚚", color: "#3B82F6" },
  { label: "Livraison prévue", icon: "📍", color: "#A855F7" },
];

export default function MerciPage() {
  const siteSettings = useSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stage, setStage] = useState(0);
  const [waOpened, setWaOpened] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyTracking = useCallback((num: string) => {
    navigator.clipboard?.writeText(num).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    let parsed: Order | null = null;
    try {
      const raw = localStorage.getItem("lecomax_last_order");
      if (raw) { parsed = JSON.parse(raw); setOrder(parsed); }
    } catch {}

    setParticles(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: (i * 1.25) % 105 - 2,
        size: 5 + ((i * 11) % 9),
        delay: (i * 0.033) % 2.8,
        duration: 2.0 + ((i * 17) % 2.0),
        shape: (["square", "circle", "diamond"] as const)[i % 3],
      }))
    );

    const timers = [
      setTimeout(() => setStage(1), 80),
      setTimeout(() => setStage(2), 450),
      setTimeout(() => setStage(3), 950),
      setTimeout(() => setStage(4), 1350),
      setTimeout(() => setStage(5), 1750),
      // Auto-open WhatsApp on mobile after the animation settles
      setTimeout(() => {
        if (parsed && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          const name = `${parsed.customer.prenom} ${parsed.customer.nom}`;
          const msg = encodeURIComponent(
            `Bonjour L'ECOMAX,\n\nJe viens de passer la commande *${parsed.number}*.\n\nNom : ${name}\nVille : ${parsed.customer.ville}\nTotal : ${parsed.total} MAD\nPaiement : ${parsed.payment === "livraison" ? "A la livraison" : "Carte bancaire"}\n\nMerci de confirmer ma commande.`
          );
          window.location.href = getWhatsAppHref(siteSettings, `Bonjour L'ECOMAX,\n\nJe viens de passer la commande *${parsed.number}*.\n\nNom : ${name}\nVille : ${parsed.customer.ville}\nTotal : ${parsed.total} MAD\nPaiement : ${parsed.payment === "livraison" ? "A la livraison" : "Carte bancaire"}\n\nMerci de confirmer ma commande.`);
          setWaOpened(true);
        }
      }, 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const deliveryDate = useMemo(() => {
    const d = new Date();
    let daysAdded = 0;
    while (daysAdded < 3) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) daysAdded++; // skip Sundays (0)
    }
    // If the final date lands on Sunday, push one more day
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("fr-MA", { weekday: "long", day: "numeric", month: "long" });
  }, []);

  const rays = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({ id: i, angle: i * 45 })), []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden">

      {/* ── Confetti ── */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        {stage >= 2 && particles.map((p) => (
          <span
            key={p.id}
            className="absolute top-0"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "50%" : "1px",
              transform: p.shape === "diamond" ? "rotate(45deg)" : undefined,
              animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(.23,.4,.22,1) both`,
            }}
          />
        ))}
      </div>

      {/* ── Ambient blobs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(255,215,0,0.18) 0%, transparent 65%)", animation: "glow-breathe 4s ease-in-out infinite" }} />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px]"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px]"
          style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-20 flex flex-col items-center px-4 py-14 pb-28">

        {/* ── Hero: Checkmark ── */}
        <div className="relative flex items-center justify-center mb-10" style={{ width: 200, height: 200 }}>

          {/* Pulsing rings */}
          {stage >= 1 && (
            <>
              {[160, 178, 196].map((size, i) => (
                <span key={size} className="absolute rounded-full border border-neutral-200"
                  style={{ width: size, height: size, animation: `ring-pulse 2.4s ${i * 0.5}s ease-out infinite` }} />
              ))}
            </>
          )}

          {/* Rotating gradient ring */}
          {stage >= 2 && (
            <div className="absolute w-[154px] h-[154px] rounded-full"
              style={{
                animation: "rotate-cw 4s linear infinite", padding: 2,
                background: "conic-gradient(from 0deg, #FFD700, #FF4500, #A855F7, #06B6D4, #10B981, #FFD700)",
              }}>
              <div className="w-full h-full rounded-full bg-white" />
            </div>
          )}

          {/* Counter-rotating shimmer */}
          {stage >= 2 && (
            <div className="absolute w-[140px] h-[140px] rounded-full"
              style={{
                animation: "rotate-ccw 6s linear infinite", padding: 1,
                background: "conic-gradient(from 180deg, transparent 60%, rgba(255,165,0,0.5) 80%, transparent 100%)",
              }}>
              <div className="w-full h-full rounded-full bg-transparent" />
            </div>
          )}

          {/* Burst rays */}
          {stage >= 2 && rays.map((ray) => (
            <span
              key={ray.id}
              className="absolute bottom-1/2 left-1/2 origin-bottom"
              style={{
                width: 3, height: 28, marginLeft: -1.5, borderRadius: 99,
                background: "linear-gradient(to top, #FFD700, transparent)",
                transform: `rotate(${ray.angle}deg)`,
                animation: `ray-burst 0.9s ${0.85 + ray.id * 0.04}s ease-out both`,
              }}
            />
          ))}

          {/* Sparkles */}
          {stage >= 2 && SPARKLES.map((s, i) => (
            <span
              key={i}
              className="absolute font-bold select-none"
              style={{
                fontSize: 10 + (i % 3) * 4,
                color: ["#FFD700", "#A855F7", "#10B981", "#3B82F6", "#F97316", "#EC4899"][i],
                top: `${20 + ((i * 31) % 60)}%`,
                left: `${10 + ((i * 47) % 80)}%`,
                animation: `sparkle-blink ${1.2 + i * 0.3}s ${i * 0.2}s ease-in-out infinite`,
              }}
            >
              {s}
            </span>
          ))}

          {/* Main circle */}
          <div
            className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center bg-white"
            style={{
              boxShadow: stage >= 2
                ? "0 0 0 1px rgba(0,0,0,0.06), 0 8px 40px rgba(255,215,0,0.25), 0 2px 12px rgba(0,0,0,0.08)"
                : "0 0 0 1px rgba(0,0,0,0.06)",
              animation: stage >= 2 ? "pop-scale 0.7s cubic-bezier(.34,1.56,.64,1) both" : "none",
            }}
          >
            <svg width="58" height="58" viewBox="0 0 58 58" fill="none">
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FF8C00" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <circle cx="29" cy="29" r="26" stroke="url(#cg)" strokeWidth="2" fill="none"
                strokeDasharray="163.4" strokeDashoffset={stage >= 2 ? "0" : "163.4"}
                style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1) 0.1s" }} />
              <path d="M16 29 L24 37 L42 19" stroke="#111" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none"
                strokeDasharray="42" strokeDashoffset={stage >= 2 ? "0" : "42"}
                style={{ transition: "stroke-dashoffset 0.55s cubic-bezier(.4,0,.2,1) 0.75s" }} />
            </svg>
          </div>
        </div>

        {/* ── Heading ── */}
        {stage >= 3 && (
          <div className="text-center mb-8" style={{ animation: "fade-up 0.6s ease both" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" style={{ animation: "glow-breathe 1.5s ease-in-out infinite" }} />
              <span className="text-emerald-700 text-[10px] font-black uppercase tracking-[0.14em]">Commande confirmée</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight leading-none mb-3 text-neutral-900">
              Merci pour<br />votre commande
            </h1>
            <p className="text-4xl">🎉</p>
            {order && (
              <p className="text-neutral-500 text-sm mt-2 font-medium">
                Bonjour <span className="text-neutral-900 font-bold">{order.customer.prenom} {order.customer.nom}</span>,<br />
                votre commande a bien été enregistrée.
              </p>
            )}
          </div>
        )}

        {/* ── Order card ── */}
        {stage >= 4 && order && (
          <div className="w-full max-w-md mb-5" style={{ animation: "fade-up 0.6s 0.05s ease both" }}>
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 24px rgba(62,207,76,0.13), 0 1px 4px rgba(0,0,0,0.07)", border: "1.5px solid #d1fae5" }}>

              {/* ── Green header band: tracking number ── */}
              <div className="px-5 pt-5 pb-4" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)" }}>
                {/* Label row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Numéro de suivi</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#3ecf4c18", color: "#3ecf4c" }}>Confirmé ✓</span>
                </div>

                {/* Tracking number + copy */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-xl px-4 py-3.5 flex items-center justify-between bg-white" style={{ border: "1.5px solid #86efac", boxShadow: "0 1px 6px rgba(62,207,76,0.1)" }}>
                    <span className="font-black text-[22px] tracking-[0.18em] text-neutral-900" style={{ animation: "count-up-reveal 0.5s 0.3s ease both", opacity: 0, letterSpacing: "0.18em" }}>
                      {order.number}
                    </span>
                    <button
                      onClick={() => copyTracking(order.number)}
                      className="ml-3 shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all duration-200 active:scale-95"
                      style={{ background: copied ? "#3ecf4c" : "#111", color: copied ? "#000" : "#fff", boxShadow: copied ? "0 2px 8px rgba(62,207,76,0.4)" : "none" }}
                    >
                      {copied ? (
                        <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copié!</>
                      ) : (
                        <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copier</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Barcode decoration */}
                <div className="mt-3 flex items-end gap-[2px] h-5" style={{ opacity: 0.12 }}>
                  {Array.from({ length: 40 }, (_, i) => (
                    <div key={i} className="bg-neutral-800 rounded-sm" style={{ width: i % 4 === 0 ? 3 : i % 7 === 0 ? 2 : 1.5, height: `${35 + ((i * 23) % 65)}%` }} />
                  ))}
                </div>
              </div>

              {/* ── White body: items + totals ── */}
              <div className="bg-white">
                {/* Items */}
                <ul className="divide-y divide-neutral-50">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={item.slug + item.size} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="relative w-12 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "#f5f5f5", border: "1px solid #f0f0f0" }}>
                        <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                        {item.quantity > 1 && (
                          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-black flex items-center justify-center leading-none">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold leading-tight truncate text-neutral-900">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md font-medium">Taille {item.size}</span>
                          {item.quantity > 1 && <span className="text-[10px] text-neutral-400">×{item.quantity}</span>}
                        </div>
                      </div>
                      <span className="text-[13px] font-black text-neutral-800 shrink-0 tabular-nums">{formatMAD(item.price * item.quantity)}</span>
                    </li>
                  ))}
                  {order.items.length > 3 && (
                    <li className="px-5 py-2.5 text-center text-[11px] text-neutral-400 bg-neutral-50">
                      +{order.items.length - 3} autre{order.items.length - 3 > 1 ? "s" : ""} article{order.items.length - 3 > 1 ? "s" : ""}
                    </li>
                  )}
                </ul>

                {/* Totals */}
                <div className="mx-5 mt-1 pt-3 pb-3 border-t border-dashed border-neutral-200 space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-neutral-400">Sous-total</span>
                    <span className="text-neutral-500 font-medium tabular-nums">{formatMAD(order.total - (order.shipping ?? 0))}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-neutral-400">Livraison</span>
                    {order.shipping === 0
                      ? <span className="text-emerald-600 font-bold">Gratuite ✓</span>
                      : <span className="text-neutral-500 font-medium tabular-nums">{formatMAD(order.shipping)}</span>
                    }
                  </div>
                  {/* Total row with green accent */}
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-neutral-100">
                    <span className="text-[13px] font-black uppercase tracking-wide text-neutral-900">Total</span>
                    <span className="font-black text-[18px] tabular-nums" style={{ color: "#3ecf4c" }}>{formatMAD(order.total)}</span>
                  </div>
                </div>

                {/* Payment footer */}
                <div className="px-4 py-3 flex items-center gap-2.5 border-t border-neutral-100 mx-0" style={{ background: "linear-gradient(135deg, #f9fafb 0%, #f5f5f5 100%)" }}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base" style={{ background: order.payment === "livraison" ? "#f0fdf4" : "#eff6ff", border: `1.5px solid ${order.payment === "livraison" ? "#86efac" : "#bfdbfe"}` }}>
                      {order.payment === "livraison" ? "💵" : "💳"}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-neutral-700 leading-tight">{order.payment === "livraison" ? "Paiement à la livraison" : "Carte bancaire"}</p>
                      <p className="text-[9px] text-neutral-400 mt-0.5 uppercase tracking-wide">Mode de paiement</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-neutral-400 uppercase tracking-wide">Date</p>
                    <p className="text-[11px] font-bold text-neutral-500 tabular-nums font-mono">{new Date(order.date).toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit", year: "2-digit" })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Timeline ── */}
        {stage >= 5 && (
          <div className="w-full max-w-md mb-5" style={{ animation: "fade-up 0.6s 0.05s ease both" }}>

            {/* Delivery date banner */}
            <div className="rounded-2xl mb-3 px-5 py-4 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)", border: "1.5px solid #86efac" }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl"
                style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                🚚
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600 mb-0.5">Livraison estimée</p>
                <p className="font-black text-[15px] text-neutral-900 capitalize leading-tight">{deliveryDate}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-emerald-500 bg-emerald-100 px-2 py-1 rounded-full">2–5 jours</p>
              </div>
            </div>

            {/* Vertical step list */}
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
              <div className="px-5 pt-4 pb-1">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400">Suivi de commande</p>
              </div>
              <div className="px-5 py-4 space-y-0">
                {STEPS.map((step, i) => {
                  const isActive = i === 0;
                  const isDone = i === 0;
                  const isLast = i === STEPS.length - 1;
                  return (
                    <div key={i} className="flex gap-4">
                      {/* Left: icon + connector line */}
                      <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10"
                          style={{
                            background: isDone
                              ? `linear-gradient(135deg, ${step.color} 0%, ${step.color}cc 100%)`
                              : "#f5f5f5",
                            border: isActive ? `2px solid ${step.color}` : "2px solid #e5e7eb",
                            boxShadow: isActive ? `0 0 0 4px ${step.color}18, 0 4px 12px ${step.color}30` : "none",
                            color: isDone ? "#fff" : "#d1d5db",
                            animation: isActive ? "glow-breathe 2s ease-in-out infinite" : "none",
                            fontSize: isDone ? 14 : 18,
                          }}
                        >
                          {isDone ? "✓" : step.icon}
                        </div>
                        {!isLast && (
                          <div className="flex-1 w-[2px] my-1 rounded-full"
                            style={{
                              background: isDone ? `linear-gradient(to bottom, ${step.color}60, #e5e7eb)` : "#e5e7eb",
                              minHeight: 20,
                            }} />
                        )}
                      </div>
                      {/* Right: text */}
                      <div className={`flex-1 flex items-start justify-between pb-${isLast ? "0" : "4"}`}
                        style={{ paddingBottom: isLast ? 0 : 16 }}>
                        <div>
                          <p className="font-bold text-[13px] leading-tight"
                            style={{ color: isActive ? "#111" : "#9ca3af" }}>
                            {step.label}
                          </p>
                          <p className="text-[11px] mt-0.5"
                            style={{ color: isActive ? step.color : "#d1d5db" }}>
                            {i === 0 && "Votre commande est confirmée"}
                            {i === 1 && "En attente de traitement"}
                            {i === 2 && "Votre colis sera envoyé"}
                            {i === 3 && <span className="capitalize font-semibold">{deliveryDate}</span>}
                          </p>
                        </div>
                        {isActive && (
                          <span className="text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-full shrink-0"
                            style={{ background: `${step.color}15`, color: step.color }}>
                            En cours
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Info grid ── */}
        {stage >= 5 && order && (
          <div className="w-full max-w-md mb-8 grid grid-cols-2 gap-3" style={{ animation: "fade-up 0.6s 0.1s ease both" }}>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-neutral-400 mb-1">Destination</p>
              <p className="text-sm font-bold text-neutral-900 capitalize">{order.customer.ville || "—"}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Maroc 🇲🇦</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-neutral-400 mb-1">Confirmation</p>
              <p className="text-[11px] font-semibold text-neutral-900 truncate">{order.customer.email || "—"}</p>
              {order.customer.email && (
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Email envoyé ✓</p>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp notice removed — absorbed into button below */}

        {/* ── CTAs ── */}
        {stage >= 5 && (
          <div className="w-full max-w-md flex flex-col gap-3" style={{ animation: "fade-up 0.6s 0.15s ease both" }}>

            {/* Primary: Track order */}
            <Link
              href={order ? `/suivre-commande?order=${order.number}` : "/suivre-commande"}
              className="w-full py-4 rounded-2xl font-black uppercase text-sm tracking-[0.1em] text-center flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.97]"
              style={{ background: "#3ecf4c", color: "#000", boxShadow: "0 6px 20px rgba(62,207,76,0.45)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Suivre ma commande
            </Link>

            {/* Secondary: WhatsApp */}
            {order && (
              <a
                href={getWhatsAppHref(siteSettings, `Bonjour L'ECOMAX,\n\nJe viens de passer la commande *${order.number}*.\n\nNom : ${order.customer.prenom} ${order.customer.nom}\nVille : ${order.customer.ville}\nTotal : ${order.total} MAD\nPaiement : ${order.payment === "livraison" ? "A la livraison" : "Carte bancaire"}\n\nMerci de confirmer ma commande.`)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWaOpened(true)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-[0.06em] text-center flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: waOpened ? "linear-gradient(135deg, #128C7E 0%, #075E54 100%)" : "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                  boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
                  color: "#fff",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {waOpened ? "WhatsApp ouvert — appuyez sur Envoyer" : "Confirmer sur WhatsApp"}
              </a>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-neutral-100" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">ou</span>
              <div className="flex-1 h-px bg-neutral-100" />
            </div>

            {/* Tertiary: Continue shopping */}
            <Link
              href="/"
              className="w-full py-3 rounded-2xl font-bold text-sm tracking-[0.06em] text-center text-neutral-500 border border-neutral-200 hover:border-neutral-400 hover:text-neutral-800 transition-all duration-200 active:scale-[0.97]"
            >
              Continuer mes achats →
            </Link>
          </div>
        )}

        {stage >= 5 && (
          <p className="mt-10 text-[10px] text-neutral-300 font-black uppercase tracking-[0.25em]"
            style={{ animation: "fade-up 0.6s 0.2s ease both" }}>
            L&apos;ecomax · Maroc
          </p>
        )}
      </div>
    </div>
  );
}