"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { key: "pending",   label: "Commande reÃ§ue",  sub: "Votre commande a bien Ã©tÃ© enregistrÃ©e.", icon: "âœ“", color: "#10B981" },
  { key: "confirmed", label: "En prÃ©paration",   sub: "Notre Ã©quipe prÃ©pare votre colis.",       icon: "ðŸ“¦", color: "#F59E0B" },
  { key: "shipped",   label: "En livraison",     sub: "Votre colis est en route.",               icon: "ðŸšš", color: "#3B82F6" },
  { key: "delivered", label: "LivrÃ©e",           sub: "Votre commande a Ã©tÃ© livrÃ©e.",            icon: "ðŸ ", color: "#A855F7" },
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>}>
      <SuivreCommandeInner />
    </Suspense>
  );
}

function SuivreCommandeInner() {
  const searchParams = useSearchParams();
  const [orderNum, setOrderNum] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

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
      setApiError("Erreur rÃ©seau. Veuillez rÃ©essayer.");
    } finally {
      setLoading(false);
    }
  }

  const activeIdx = order ? order.step : -1;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <div className="border-b border-neutral-100" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #f9fafb 60%, #fff 100%)" }}>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/" className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 hover:text-neutral-600 transition-colors">Accueil</Link>
            <span className="text-neutral-300 text-[10px]">â€º</span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Suivi</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none text-neutral-900">
                Suivre ma<br /><span style={{ color: "#3ecf4c" }}>commande</span>
              </h1>
              <p className="mt-3 text-neutral-500 text-[14px] max-w-sm leading-relaxed">
                Entrez votre numÃ©ro de commande et votre e-mail pour consulter l&apos;Ã©tat de votre livraison.
              </p>
            </div>
            <div className="hidden md:flex w-14 h-14 rounded-2xl items-center justify-center shrink-0 mt-1 text-2xl"
              style={{ background: "#3ecf4c18", border: "1.5px solid #86efac" }}>
              ðŸ“¦
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {!order ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Order number input */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-neutral-500 mb-2">
                NumÃ©ro de commande
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={focused === "order" ? "#3ecf4c" : "#d4d4d4"} strokeWidth="2" strokeLinecap="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ECO-XXXXXX"
                  value={orderNum}
                  onChange={(e) => setOrderNum(e.target.value.toUpperCase())}
                  onFocus={() => setFocused("order")}
                  onBlur={() => setFocused(null)}
                  className="w-full pl-10 pr-4 py-3.5 text-[14px] font-mono rounded-2xl outline-none transition-all duration-200"
                  style={{
                    border: focused === "order" ? "1.5px solid #3ecf4c" : "1.5px solid #e5e7eb",
                    boxShadow: focused === "order" ? "0 0 0 3px rgba(62,207,76,0.1)" : "none",
                    background: focused === "order" ? "#f0fdf4" : "#fafafa",
                  }}
                  required
                />
              </div>
            </div>

            {/* Email input */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={focused === "email" ? "#3ecf4c" : "#d4d4d4"} strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  className="w-full pl-10 pr-4 py-3.5 text-[14px] rounded-2xl outline-none transition-all duration-200"
                  style={{
                    border: focused === "email" ? "1.5px solid #3ecf4c" : "1.5px solid #e5e7eb",
                    boxShadow: focused === "email" ? "0 0 0 3px rgba(62,207,76,0.1)" : "none",
                    background: focused === "email" ? "#f0fdf4" : "#fafafa",
                  }}
                  required
                />
              </div>
            </div>

            {/* Error */}
            {apiError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-black uppercase text-sm tracking-[0.1em] flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#000", color: "#fff", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }}
            >
              {loading ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              )}
              {loading ? "Recherche en cours..." : "Rechercher ma commande"}
            </button>
          </form>
        ) : (
          <div>
            {/* Header badge */}
            <div className="rounded-2xl p-4 mb-5 flex items-center justify-between" style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-0.5">NÂ° de commande</p>
                <p className="font-black text-[18px] tracking-wider text-neutral-900 font-mono">{order.order_number}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">{new Date(order.created_at).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <span
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full"
                style={{
                  background: order.status === "delivered" ? "#ecfdf5" : order.status === "shipped" ? "#eff6ff" : order.status === "cancelled" ? "#fef2f2" : "#fffbeb",
                  color: order.status === "delivered" ? "#065f46" : order.status === "shipped" ? "#1e40af" : order.status === "cancelled" ? "#991b1b" : "#d97706",
                }}
              >
                {order.status_label}
              </span>
            </div>

            {/* Steps tracker */}
            {order.status !== "cancelled" && (
              <div className="rounded-2xl border border-neutral-100 bg-white overflow-hidden mb-4">
                <div className="px-5 pt-4 pb-2 border-b border-neutral-50">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">Progression</p>
                </div>
                <div className="px-5 py-4">
                  {STEPS.map((step, i) => {
                    const isDone = i < activeIdx;
                    const isActive = i === activeIdx;
                    const isLast = i === STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10"
                            style={{
                              background: isDone ? step.color : isActive ? "#fff" : "#f5f5f5",
                              border: isActive ? `2px solid ${step.color}` : isDone ? `2px solid ${step.color}` : "2px solid #e5e7eb",
                              boxShadow: isActive ? `0 0 0 4px ${step.color}18, 0 4px 12px ${step.color}30` : "none",
                              color: isDone ? "#fff" : isActive ? step.color : "#d1d5db",
                              fontSize: isDone ? 13 : 16,
                            }}
                          >
                            {isDone ? "âœ“" : step.icon}
                          </div>
                          {!isLast && (
                            <div className="flex-1 w-[2px] my-1 rounded-full min-h-[20px]"
                              style={{ background: isDone ? `${step.color}60` : "#f0f0f0" }} />
                          )}
                        </div>
                        <div className="flex-1 flex items-start justify-between" style={{ paddingBottom: isLast ? 0 : 16 }}>
                          <div>
                            <p className="font-bold text-[13px] leading-tight" style={{ color: isActive ? "#111" : isDone ? "#6b7280" : "#d1d5db" }}>
                              {step.label}
                            </p>
                            {(isActive || isDone) && (
                              <p className="text-[11px] mt-0.5" style={{ color: isActive ? step.color : "#9ca3af" }}>
                                {step.sub}
                              </p>
                            )}
                          </div>
                          {isActive && (
                            <span className="text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ml-2"
                              style={{ background: `${step.color}15`, color: step.color }}>En cours</span>
                          )}
                          {isDone && (
                            <span className="text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ml-2"
                              style={{ background: "#f0fdf4", color: "#10B981" }}>âœ“ Fait</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tracking number if available */}
            {order.tracking_number && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 mb-4 flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">NÂ° de suivi transporteur</p>
                  <p className="font-mono font-bold text-[14px] text-blue-800">{order.tracking_number}</p>
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="rounded-2xl border border-neutral-100 bg-white overflow-hidden mb-4">
              <div className="px-5 pt-4 pb-2 border-b border-neutral-50">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">RÃ©sumÃ© de la commande</p>
              </div>
              <div className="divide-y divide-neutral-50">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0 flex items-center justify-center text-[18px]">ðŸ›</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-400">{[item.size, item.color].filter(Boolean).join(" Â· ")} Ã— {item.qty}</p>
                    </div>
                    <p className="text-[13px] font-black shrink-0">{(item.price * item.qty).toFixed(2)} MAD</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[12px] text-neutral-500">Livraison</span>
                <span className="text-[12px] font-semibold">{order.shipping === 0 ? "Gratuite" : `${order.shipping} MAD`}</span>
              </div>
              <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[13px] font-black">Total</span>
                <span className="text-[15px] font-black">{order.total.toFixed(2)} MAD</span>
              </div>
            </div>

            {/* Delivery info */}
            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 mb-5 text-[13px] text-neutral-600 space-y-1">
              <p><span className="font-black text-black">Livraison Ã  :</span> {order.customer.address}, {order.customer.city}</p>
              <p><span className="font-black text-black">Paiement :</span> {order.payment_method}</p>
            </div>

            <button
              onClick={() => { setOrder(null); setApiError(null); setOrderNum(""); setEmail(""); }}
              className="w-full py-3 rounded-2xl text-[12px] font-bold text-neutral-500 border border-neutral-200 hover:border-neutral-400 hover:text-neutral-800 transition-all duration-200 mb-6"
            >
              â† Rechercher une autre commande
            </button>
          </div>
        )}

        {/* WhatsApp help card */}
        <a
          href="https://wa.me/212699289568"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl flex items-center gap-4 px-5 py-4 transition-all duration-200 active:scale-[0.98] group block"
          style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1.5px solid #86efac", boxShadow: "0 2px 12px rgba(37,211,102,0.1)" }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", boxShadow: "0 4px 12px rgba(37,211,102,0.35)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[13px] text-neutral-900 leading-tight">Un problÃ¨me avec votre commande ?</p>
            <p className="text-emerald-700 text-[12px] mt-0.5 font-medium">Notre Ã©quipe rÃ©pond en quelques minutes Â· 7j/7</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 group-hover:translate-x-0.5 transition-transform">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
