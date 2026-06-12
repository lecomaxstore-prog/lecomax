"use client";

import Link from "next/link";

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TABS = ["Toutes", "En cours", "Livrées", "Annulées"] as const;
type Tab = typeof TABS[number];

const TAB_STATUS: Record<Tab, string | null> = {
  "Toutes": null,
  "En cours": "pending",
  "Livrées": "delivered",
  "Annulées": "cancelled",
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: "En attente",   color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmée",    color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped:   { label: "Expédiée",     color: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered: { label: "Livrée",       color: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Annulée",      color: "bg-red-50 text-red-700 border-red-200" },
};

type Order = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  items: { name: string; image: string; qty: number; price: number }[];
  customer: { name: string; email: string };
};

export default function CommandesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Toutes");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      const userEmail = session.user.email ?? "";
      setEmail(userEmail);
      fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`)
        .then(r => r.json())
        .then((data: Order[]) => {
          setOrders(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  const filtered = orders.filter(o => {
    if (activeTab === "Toutes") return true;
    const wanted = TAB_STATUS[activeTab];
    if (activeTab === "En cours") return o.status === "pending" || o.status === "confirmed" || o.status === "shipped";
    return o.status === wanted;
  });

  const tabCount = (tab: Tab) => {
    if (tab === "Toutes") return orders.length;
    if (tab === "En cours") return orders.filter(o => o.status === "pending" || o.status === "confirmed" || o.status === "shipped").length;
    const wanted = TAB_STATUS[tab];
    return orders.filter(o => o.status === wanted).length;
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400 mb-1">Mon compte</p>
          <h1 className="font-black text-[26px] uppercase tracking-tight">Mes commandes</h1>
        </div>
        <Link
          href="/suivre-commande"
          className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-neutral-200 px-4 py-2.5 hover:border-black hover:bg-black hover:text-white transition-colors mb-1"
        >
          Suivre un colis →
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-neutral-200 overflow-x-auto">
        {TABS.map((tab) => {
          const count = tabCount(tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-black text-black"
                  : "border-transparent text-neutral-400 hover:text-black"
              }`}
            >
              {tab}
              {!loading && count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full ${activeTab === tab ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="bg-white border border-neutral-100 px-8 py-16 flex flex-col items-center gap-3">
          <span className="w-6 h-6 border-2 border-neutral-200 border-t-black rounded-full animate-spin" />
          <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-100 px-8 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 border-2 border-dashed border-neutral-200 flex items-center justify-center mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-300 mb-2">Aucune commande</p>
          <p className="text-[12px] text-neutral-400 max-w-[240px] leading-relaxed mb-7">
            {activeTab === "Toutes"
              ? "Vous n'avez passé aucune commande pour l'instant."
              : `Aucune commande dans la catégorie « ${activeTab} ».`}
          </p>
          {activeTab === "Toutes" && (
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-black text-white font-black text-[11px] uppercase tracking-widest px-6 py-3.5 hover:bg-neutral-800 transition-colors"
            >
              Découvrir la boutique
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const st = STATUS_LABEL[order.status] ?? { label: order.status, color: "bg-neutral-100 text-neutral-600 border-neutral-200" };
            const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(order.created_at));
            const total = `${order.total?.toLocaleString("fr-MA")} DH`;
            return (
              <div key={order.id} className="bg-white border border-neutral-100 overflow-hidden">
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-50 bg-neutral-50/50">
                  <div className="flex items-center gap-3">
                    <p className="font-black text-[13px] tracking-wide">{order.order_number}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">{date}</p>
                </div>

                {/* Items */}
                <div className="divide-y divide-neutral-50">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-12 h-12 bg-neutral-100 shrink-0 overflow-hidden">
                        <Image src={item.image || "/images/placeholder.png"} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[12px] leading-snug line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Qté : {item.qty}</p>
                      </div>
                      <p className="font-black text-[13px] shrink-0">{item.price ? `${item.price} DH` : ""}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-100">
                  <p className="text-[11px] text-neutral-500">
                    {order.items.length} article{order.items.length > 1 ? "s" : ""} · Total <span className="font-black text-black">{total}</span>
                  </p>
                  <Link
                    href={`/suivre-commande?order_number=${order.order_number}`}
                    className="text-[10px] font-black uppercase tracking-widest border border-neutral-200 px-4 py-2 hover:border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    Suivre →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info strip */}
      <div className="border border-neutral-100 bg-white px-6 py-5 flex items-start gap-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400 shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-[12px] text-neutral-500 leading-relaxed">
          Les commandes passées avant la création de votre compte ne sont pas affichées ici.
          Pour les retrouver, utilisez votre numéro de commande dans le{" "}
          <a href="/suivre-commande" className="font-bold text-black underline underline-offset-2 hover:no-underline">
            suivi de commande
          </a>.
        </p>
      </div>

    </div>
  );
}