"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { products, formatMAD } from "@/lib/products";

type UserInfo = {
  email: string;
  full_name: string;
  created_at: string;
  prenom?: string;
};

type RecentOrder = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  items: { name: string; image: string; qty: number }[];
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: "En attente",   color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmée",    color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped:   { label: "Expédiée",     color: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered: { label: "Livrée",       color: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Annulée",      color: "bg-red-50 text-red-700 border-red-200" },
};

const recommended = products.slice(0, 2);

export default function ComptePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [tierName, setTierName] = useState("Bronze");
  const [tierNext, setTierNext] = useState<number | null>(500);
  const [tierNextLabel, setTierNextLabel] = useState<string | null>("Silver");
  const [addressCount, setAddressCount] = useState<number | null>(null);
  const [savedPosts, setSavedPosts] = useState<{ id: string; title: string; slug: string; image_url?: string; likes_count: number; comments_count: number }[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const u = session.user;
      const email = u.email ?? "";
      setUser({
        email,
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || "",
        created_at: u.created_at,
        prenom: u.user_metadata?.prenom,
      });
      // Load address count from user metadata
      const saved = u.user_metadata?.addresses;
      setAddressCount(Array.isArray(saved) ? saved.length : 0);
      // Fetch saved Ecomedia posts
      setSavedLoading(true);
      supabase.auth.getSession().then(({ data }) => fetch("/api/ecomedia/saved", { headers: data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {} }))
        .then(r => r.json())
        .then(d => { if (Array.isArray(d.posts)) setSavedPosts(d.posts); })
        .catch(() => {})
        .finally(() => setSavedLoading(false));
      // Fetch recent orders by email
      fetch(`/api/orders?email=${encodeURIComponent(email)}&limit=3`)
        .then(r => r.json())
        .then((data: RecentOrder[]) => {
          setOrders(Array.isArray(data) ? data : []);
          setOrdersLoading(false);
        })
        .catch(() => setOrdersLoading(false));
      // Fetch EcoClub points
      if (email) {
        fetch(`/api/points?email=${encodeURIComponent(email)}`)
          .then(r => r.json())
          .then(d => {
            if (typeof d.points === "number") { setPoints(d.points); setTierName(d.tier ?? "Bronze"); setTierNext(d.next ?? null); setTierNextLabel(d.nextLabel ?? null); }
          })
          .catch(() => {});
      }
    });
  }, []);

  const memberSince = user?.created_at
    ? new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(user.created_at))
    : "";

  const firstName = user?.prenom || user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "vous";
  const hasFullName = !!(user?.full_name?.trim());
  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ─── Hero welcome banner ─── */}
      <div className="relative bg-black text-white overflow-hidden rounded-2xl">
        {/* subtle grid pattern */}
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(62,207,76,0.08) 0%, transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 0, transparent 50%)", backgroundSize: "auto, 14px 14px" }} />
        <div className="relative px-6 sm:px-10 py-10 sm:py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.5em] text-neutral-500 mb-4">
              {today.charAt(0).toUpperCase() + today.slice(1)}
            </p>
            <h1 className="font-black text-[28px] sm:text-[36px] leading-none mb-5">
              Bonjour, <span className="text-[#3ecf4c]">{firstName} 👋</span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {memberSince && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-neutral-400 border border-white/10 rounded-full px-3 py-1">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Membre depuis {memberSince}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1" style={{ background: "rgba(205,127,50,0.15)", color: "#cd7f32", border: "1px solid rgba(205,127,50,0.25)" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                EcoClub {tierName}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link href="/nouveautes" className="inline-flex items-center justify-center gap-2 bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-[0.15em] px-6 py-3.5 rounded-xl hover:bg-[#2db83a] transition-colors whitespace-nowrap group">
              Découvrir
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <button onClick={handleSignOut} className="text-[10px] font-medium text-neutral-500 hover:text-white transition-colors text-center py-1">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {/* ─── Profile completion nudge ─── */}
      {!hasFullName && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="font-bold text-[12px] text-amber-800">Complétez votre profil</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Ajoutez votre nom pour personnaliser votre expérience.</p>
            </div>
          </div>
          <Link href="/compte/profil" className="shrink-0 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap">
            Compléter →
          </Link>
        </div>
      )}

      {/* ─── Stats cards ─── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Commandes",
            value: ordersLoading ? "—" : String(orders.length),
            sub: "total passées",
            href: "/compte/commandes",
            bg: "bg-white",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            ),
            color: "#3ecf4c",
          },
          {
            label: "Adresses",
            value: addressCount === null ? "—" : String(addressCount),
            sub: "sauvegardées",
            href: "/compte/adresses",
            bg: "bg-white",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ),
            color: "#000",
          },
          {
            label: "EcoClub",
            value: tierName,
            sub: `${points.toLocaleString("fr-MA")} pts`,
            href: "/ecoclub",
            bg: "bg-white",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ),
            color: tierName === "Gold" ? "#fbbf24" : tierName === "Silver" ? "#a8a9ad" : "#f59e0b",
          },
        ].map((s) => (
          <Link key={s.label} href={s.href} className={`group ${s.bg} border border-neutral-100 hover:border-neutral-300 hover:shadow-lg transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3`}>
            <div className="w-9 h-9 rounded-xl bg-neutral-50 group-hover:bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:text-black transition-all">
              {s.icon}
            </div>
            <div>
              <p className="font-black text-[24px] sm:text-[28px] leading-none tracking-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-semibold text-neutral-400 mt-1 uppercase tracking-wider">{s.label}</p>
              <p className="text-[10px] text-neutral-300 mt-0.5">{s.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── EcoClub progress ─── */}
      <div className="bg-gradient-to-r from-neutral-900 to-black rounded-2xl px-6 py-5 flex items-center gap-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(205,127,50,0.2)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cd7f32" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-white">EcoClub {tierName}</span>
            <span className="text-[10px] font-semibold text-neutral-400">
              {points.toLocaleString("fr-MA")} pts
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: tierNext ? `${Math.min(100, Math.round((points / tierNext) * 100))}%` : "100%",
                background: "linear-gradient(90deg, #cd7f32, #f59e0b)",
              }}
            />
          </div>
          {tierNext && tierNextLabel && (
            <p className="text-[10px] text-neutral-500 mt-1.5">
              {(tierNext - points).toLocaleString("fr-MA")} pts pour atteindre <span className="text-neutral-300 font-semibold">{tierNextLabel}</span>
            </p>
          )}
        </div>
        <Link href="/ecoclub" className="shrink-0 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
          Détails →
        </Link>
      </div>

      {/* ─── Recent orders ─── */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            <p className="font-black text-[13px] uppercase tracking-wide">Commandes récentes</p>
          </div>
          <Link href="/compte/commandes" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-1">
            Tout voir
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>

        {ordersLoading ? (
          <div className="px-6 py-10 flex items-center justify-center gap-2 text-neutral-400">
            <span className="w-4 h-4 border-2 border-neutral-200 border-t-neutral-400 rounded-full animate-spin" />
            <span className="text-[12px] font-bold uppercase tracking-widest">Chargement…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            </div>
            <p className="text-[12px] font-black uppercase tracking-[0.3em] text-neutral-300 mb-1.5">Aucune commande</p>
            <p className="text-[12px] text-neutral-400 leading-relaxed max-w-[200px] mb-5">Vos commandes apparaîtront ici après votre premier achat.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] px-6 py-3 rounded-xl hover:bg-neutral-800 transition-colors">
              Explorer la boutique
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {orders.map((order) => {
              const st = STATUS_LABEL[order.status] ?? { label: order.status, color: "bg-neutral-100 text-neutral-600 border-neutral-200" };
              const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(order.created_at));
              return (
                <Link key={order.id} href={`/suivre-commande?order_number=${order.order_number}`} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors group">
                  <div className="flex -space-x-2 shrink-0">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="w-10 h-10 border-2 border-white rounded-xl overflow-hidden bg-neutral-100">
                        <Image src={item.image || "/images/placeholder.png"} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="w-10 h-10 border-2 border-white rounded-xl bg-neutral-100 flex items-center justify-center text-[10px] font-black text-neutral-500">
                        +{order.items.length - 2}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-[13px] tracking-wide">{order.order_number}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">{date} · {order.items.length} article{order.items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-[14px]">{formatMAD(order.total)}</p>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto mt-1 text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 transition-all"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Saved Ecomedia posts ─── */}
      {(savedLoading || savedPosts.length > 0) && (
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-black"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              <p className="font-black text-[13px] uppercase tracking-wide">Posts enregistrés</p>
            </div>
            <Link href="/ecomedia" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-1">
              Ecomedia
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
          {savedLoading ? (
            <div className="px-6 py-8 flex items-center justify-center gap-2 text-neutral-400">
              <span className="w-4 h-4 border-2 border-neutral-200 border-t-neutral-400 rounded-full animate-spin" />
              <span className="text-[12px] font-bold uppercase tracking-widest">Chargement…</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-px bg-neutral-100">
              {savedPosts.slice(0, 9).map((p) => (
                <Link key={p.id} href={`/ecomedia/${p.slug}`} className="relative aspect-square bg-neutral-50 overflow-hidden group">
                  {p.image_url ? (
                    <Image src={p.image_url} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="160px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-2 text-white text-[10px] font-bold">
                      <span className="flex items-center gap-0.5"><svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>{p.likes_count}</span>
                      <span className="flex items-center gap-0.5"><svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>{p.comments_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Quick actions ─── */}
      <div>
        <p className="font-black text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">Accès rapide</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/compte/profil", label: "Mon profil", sub: "Infos personnelles", color: "bg-blue-50 text-blue-600", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            { href: "/compte/adresses", label: "Mes adresses", sub: "Livraison", color: "bg-emerald-50 text-emerald-600", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
            { href: "/suivre-commande", label: "Suivre un colis", sub: "Ma commande", color: "bg-purple-50 text-purple-600", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { href: "/retours", label: "Retours", sub: "Initier un retour", color: "bg-rose-50 text-rose-600", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="group bg-white border border-neutral-100 hover:border-neutral-300 hover:shadow-md transition-all duration-200 rounded-2xl p-4 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} transition-all duration-200`}>
                {action.icon}
              </div>
              <div>
                <p className="font-black text-[12px] leading-tight mb-0.5">{action.label}</p>
                <p className="text-[10px] text-neutral-400">{action.sub}</p>
              </div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 transition-all mt-auto self-end"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Recommended products ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-[11px] uppercase tracking-[0.3em] text-neutral-400">Sélection pour vous</p>
          <Link href="/nouveautes" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-1">
            Voir tout
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recommended.map((p) => (
            <Link key={p.slug} href={`/produit/${p.slug}`} className="group bg-white border border-neutral-100 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 overflow-hidden rounded-2xl">
              <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 300px" />
                {p.badge && <span className="absolute top-2.5 left-2.5 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">{p.badge}</span>}
              </div>
              <div className="px-4 py-3.5">
                <p className="font-semibold text-[12px] leading-snug line-clamp-2 mb-2 text-neutral-800 group-hover:text-black transition-colors">{p.name}</p>
                <div className="flex items-center gap-2">
                  <span className="font-black text-[15px]">{p.price} DH</span>
                  {p.oldPrice && <span className="text-[12px] text-neutral-400 line-through">{p.oldPrice} DH</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
