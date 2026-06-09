"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSettings, getWhatsAppHref } from "@/lib/use-settings";

const STEPS = [
  { key: "pending",   label: "Commande reçue",  sub: "Votre commande a bien été enregistrée." },
  { key: "confirmed", label: "En préparation",   sub: "Notre équipe prépare votre colis."       },
  { key: "shipped",   label: "En livraison",     sub: "Votre colis est en route."               },
  { key: "delivered", label: "Livrée",           sub: "Votre commande a été livrée."            },
];

type OrderResult = {
  order_number: string;
  status: string;
  status_label: string;
  step: number;
  tracking_number: string | null;
  total: number;
  shipping: number;
  payment_method: string;
  created_at: string;
  customer: { name: string; city: string; address: string };
  items: { name: string; price: number; qty: number; image?: string; size?: string; color?: string }[];
};

export default function SuivreCommandePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent" />
      </div>
    }>
      <SuivreCommandeInner />
    </Suspense>
  );
}

function SuivreCommandeInner() {
  const siteSettings = useSettings();
  const searchParams = useSearchParams();
  const [orderNum, setOrderNum] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const o = searchParams.get("order");
    if (o) setOrderNum(o.toUpperCase());
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setApiError(null);
    setOrder(null);
    try {
      const res = await fetch(
        `/api/tracking?order=${encodeURIComponent(orderNum.trim())}&email=${encodeURIComponent(email.trim())}`
      );
      const json = await res.json();
      if (!res.ok) { setApiError(json.error ?? "Commande introuvable."); }
      else { setOrder(json.order); }
    } catch {
      setApiError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const activeIdx = order ? order.step : -1;

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-neutral-950 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="text-[11px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-300 transition-colors">Accueil</Link>
            <span className="text-neutral-700 text-[10px]">›</span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Suivi de commande</span>
          </div>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#3ecf4c] mb-3">Suivi en temps réel</p>
              <h1 className="h-display text-[2.8rem] md:text-[3.6rem] text-white leading-[0.9]">
                Suivre ma<br />
                <span className="text-[#3ecf4c]">commande</span>
              </h1>
              <p className="mt-4 text-neutral-400 text-[13px] max-w-sm leading-relaxed">
                Entrez votre numéro de commande et votre e-mail pour consulter l&apos;état de votre livraison.
              </p>
            </div>
            <div className="hidden md:flex w-14 h-14 border border-[#3ecf4c]/25 bg-[#3ecf4c]/8 items-center justify-center shrink-0 mb-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="1.75" strokeLinecap="round">
                <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">

        {!order ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500 mb-2">
                Numéro de commande
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <input
                  type="text"
                  placeholder="ECO-XXXXXX"
                  value={orderNum}
                  onChange={(e) => setOrderNum(e.target.value.toUpperCase())}
                  required
                  className="w-full pl-10 pr-4 py-3.5 text-[14px] font-mono border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#3ecf4c] focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500 mb-2">
                Adresse e-mail
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>
                </svg>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 text-[14px] border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#3ecf4c] focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {apiError && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-black uppercase text-[11px] tracking-[0.18em] flex items-center justify-center gap-2.5 hover:bg-neutral-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              )}
              {loading ? "Recherche en cours…" : "Rechercher ma commande"}
            </button>
          </form>

        ) : (
          <div className="space-y-4">

            <div className="border border-neutral-900 bg-neutral-950 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3ecf4c] mb-1">N° de commande</p>
                <p className="font-mono font-black text-[20px] text-white tracking-wider">{order.order_number}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {new Date(order.created_at).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 border"
                style={{
                  background: order.status === "delivered" ? "rgba(62,207,76,0.1)" : order.status === "shipped" ? "rgba(59,130,246,0.1)" : order.status === "cancelled" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                  borderColor: order.status === "delivered" ? "#3ecf4c" : order.status === "shipped" ? "#3b82f6" : order.status === "cancelled" ? "#ef4444" : "#f59e0b",
                  color: order.status === "delivered" ? "#3ecf4c" : order.status === "shipped" ? "#60a5fa" : order.status === "cancelled" ? "#f87171" : "#fbbf24",
                }}
              >
                {order.status_label}
              </span>
            </div>

            {order.status !== "cancelled" && (
              <div className="border border-neutral-100">
                <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">Progression</p>
                </div>
                <div className="px-5 py-5">
                  {STEPS.map((step, i) => {
                    const isDone = i < activeIdx;
                    const isActive = i === activeIdx;
                    const isLast = i === STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center" style={{ width: 28 }}>
                          <div
                            className="w-7 h-7 flex items-center justify-center shrink-0 text-[11px] font-black"
                            style={{
                              background: isDone ? "#3ecf4c" : isActive ? "#000" : "#f5f5f5",
                              border: isActive ? "2px solid #000" : isDone ? "2px solid #3ecf4c" : "2px solid #e5e7eb",
                              color: isDone ? "#000" : isActive ? "#fff" : "#d1d5db",
                            }}
                          >
                            {isDone ? (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              <span>{i + 1}</span>
                            )}
                          </div>
                          {!isLast && (
                            <div className="w-[2px] my-1 flex-1 min-h-[18px]"
                              style={{ background: isDone ? "#3ecf4c" : "#e5e7eb" }} />
                          )}
                        </div>
                        <div className="flex-1 flex items-start justify-between pb-4 last:pb-0">
                          <div>
                            <p className="font-black text-[13px]" style={{ color: isActive ? "#111" : isDone ? "#6b7280" : "#d1d5db" }}>
                              {step.label}
                            </p>
                            {(isActive || isDone) && (
                              <p className="text-[11px] mt-0.5" style={{ color: isDone ? "#9ca3af" : "#3ecf4c" }}>
                                {step.sub}
                              </p>
                            )}
                          </div>
                          {isActive && (
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1 bg-black text-[#3ecf4c] shrink-0 ml-2">
                              En cours
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {order.tracking_number && (
              <div className="border border-blue-200 bg-blue-50 px-5 py-4 flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">N° de suivi transporteur</p>
                  <p className="font-mono font-bold text-[14px] text-blue-900 mt-0.5">{order.tracking_number}</p>
                </div>
              </div>
            )}

            <div className="border border-neutral-100">
              <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">Articles commandés</p>
              </div>
              <div className="divide-y divide-neutral-50">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-10 h-10 bg-neutral-100 shrink-0 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-400">{[item.size, item.color].filter(Boolean).join(" · ")} × {item.qty}</p>
                    </div>
                    <p className="text-[13px] font-black shrink-0">{(item.price * item.qty).toFixed(2)} MAD</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-2.5 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[12px] text-neutral-500">Livraison</span>
                <span className="text-[12px] font-semibold">{order.shipping === 0 ? "Gratuite" : `${order.shipping} MAD`}</span>
              </div>
              <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-[13px] font-black">Total</span>
                <span className="text-[16px] font-black">{order.total.toFixed(2)} MAD</span>
              </div>
            </div>

            <div className="border border-neutral-100 bg-neutral-50 px-5 py-4 space-y-1 text-[13px]">
              <p className="text-neutral-500"><span className="font-black text-black">Livraison à :</span> {order.customer.address}, {order.customer.city}</p>
              <p className="text-neutral-500"><span className="font-black text-black">Paiement :</span> {order.payment_method}</p>
            </div>

            <button
              onClick={() => { setOrder(null); setApiError(null); setOrderNum(""); setEmail(""); }}
              className="w-full py-3 text-[12px] font-bold text-neutral-500 border border-neutral-200 hover:border-neutral-400 hover:text-neutral-800 transition-all duration-200"
            >
              ← Rechercher une autre commande
            </button>
          </div>
        )}

        {/* WhatsApp help */}
        <a
          href={getWhatsAppHref(siteSettings)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-4 px-5 py-4 border border-[#3ecf4c]/30 bg-[#3ecf4c]/5 hover:bg-[#3ecf4c]/10 transition-colors group"
        >
          <div className="w-10 h-10 bg-[#25D366] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[13px] text-neutral-900 leading-tight">Un problème avec votre commande ?</p>
            <p className="text-[#3ecf4c] text-[12px] mt-0.5 font-medium">Notre équipe répond en quelques minutes · 7j/7</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 group-hover:translate-x-0.5 transition-transform">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </a>

      </div>
    </div>
  );
}