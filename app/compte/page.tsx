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

const recommended = products.filter(p => p.active !== false).slice(0, 2);

export default function ComptePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [tierName, setTierName] = useState("Bronze");

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
            if (typeof d.points === "number") { setPoints(d.points); setTierName(d.tier ?? "Bronze"); }
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
    <div className="flex flex-col gap-5">

      {/* â”€â”€â”€ Hero welcome banner â”€â”€â”€ */}
      <div className="relative bg-black text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }} />
        <div className="relative px-6 sm:px-10 py-10 sm:py-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 mb-3">
              {today.charAt(0).toUpperCase() + today.slice(1)}
            </p>
            <h1 className="font-black text-[32px] sm:text-[40px] uppercase tracking-tighter leading-[0.95] mb-4">
              Bonjour,<br />
              <span style={{ color: "#3ecf4c" }}>{firstName}</span>
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {memberSince && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Membre depuis {memberSince}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-[10px] font-black uppercase tracking-widest">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                EcoClub Bronze
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 self-start sm:self-auto">
            <Link href="/nouveautes" className="inline-flex items-center gap-2.5 bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] px-7 py-4 hover:bg-neutral-100 active:bg-neutral-200 transition-colors whitespace-nowrap group">
              Nos nouveautÃ©s
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
            <button onClick={handleSignOut} className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors text-center py-1">
              Se dÃ©connecter
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ Profile completion nudge â”€â”€â”€ */}
      {!hasFullName && (
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <p className="font-black text-[12px] uppercase tracking-widest text-amber-800">ComplÃ©tez votre profil</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Ajoutez votre nom pour personnaliser votre expÃ©rience.</p>
            </div>
          </div>
          <Link href="/compte/profil" className="shrink-0 text-[10px] font-black uppercase tracking-widest border border-amber-400 text-amber-800 px-4 py-2 hover:bg-amber-400 hover:text-white transition-colors whitespace-nowrap">
            ComplÃ©ter â†’
          </Link>
        </div>
      )}

      {/* â”€â”€â”€ Stats row â”€â”€â”€ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Commandes", value: ordersLoading ? "â€¦" : String(orders.length > 0 ? orders.length : "0"), sub: "Total passÃ©es", href: "/compte/commandes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>, accent: "#3ecf4c" },
          { label: "Adresses", value: "â€”", sub: "SauvegardÃ©es", href: "/compte/adresses", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>, accent: "#000" },
          { label: "EcoClub", value: tierName, sub: `${points.toLocaleString("fr-MA")} pts`, href: "/ecoclub", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, accent: tierName === "Gold" ? "#fbbf24" : tierName === "Silver" ? "#a8a9ad" : "#f59e0b" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="group bg-white border border-neutral-100 hover:border-neutral-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 p-4 sm:p-5">
            <div className="text-neutral-300 group-hover:text-black transition-colors mb-3">{s.icon}</div>
            <p className="font-black text-[22px] sm:text-[28px] leading-none tracking-tight mb-1.5" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* â”€â”€â”€ Recent orders â”€â”€â”€ */}
      <div className="bg-white border border-neutral-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
            <p className="font-black text-[13px] uppercase tracking-wide">Commandes rÃ©centes</p>
          </div>
          <Link href="/compte/commandes" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">Tout voir â†’</Link>
        </div>

        {ordersLoading ? (
          <div className="px-6 py-10 flex items-center justify-center gap-2 text-neutral-400">
            <span className="w-4 h-4 border-2 border-neutral-200 border-t-neutral-400 rounded-full animate-spin" />
            <span className="text-[12px] font-bold uppercase tracking-widest">Chargementâ€¦</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-neutral-50 border border-dashed border-neutral-200 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-300 mb-2">Aucune commande</p>
            <p className="text-[12px] text-neutral-400 leading-relaxed max-w-[200px] mb-5">Vos commandes apparaÃ®tront ici aprÃ¨s votre premier achat.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-neutral-800 transition-colors">
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
                  {/* Thumbnails */}
                  <div className="flex -space-x-2 shrink-0">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="w-10 h-10 border-2 border-white rounded-sm overflow-hidden bg-neutral-100">
                        <Image src={item.image || "/images/placeholder.png"} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="w-10 h-10 border-2 border-white rounded-sm bg-neutral-100 flex items-center justify-center text-[10px] font-black text-neutral-500">
                        +{order.items.length - 2}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-[13px] tracking-wide">{order.order_number}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">{date} Â· {order.items.length} article{order.items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-[14px]">{formatMAD(order.total)}</p>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto mt-1 text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 transition-all"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* â”€â”€â”€ Quick actions â”€â”€â”€ */}
      <div>
        <p className="font-black text-[13px] uppercase tracking-widest mb-3">AccÃ¨s rapide</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/compte/profil", label: "Mon profil", sub: "Informations personnelles", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
            { href: "/compte/adresses", label: "Mes adresses", sub: "Adresses de livraison", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
            { href: "/suivre-commande", label: "Suivre un colis", sub: "Localiser ma commande", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { href: "/retours", label: "Retours & Ã©changes", sub: "Initier un retour", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="group bg-white border border-neutral-100 hover:border-black hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-200 p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 bg-neutral-50 group-hover:bg-black group-hover:text-white text-neutral-400 flex items-center justify-center transition-all duration-200 shrink-0">{action.icon}</div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </div>
              <div>
                <p className="font-black text-[11px] uppercase tracking-widest leading-tight mb-1">{action.label}</p>
                <p className="text-[11px] text-neutral-400 leading-snug">{action.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* â”€â”€â”€ Recommended products â”€â”€â”€ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-[13px] uppercase tracking-widest">SÃ©lection pour vous</p>
          <Link href="/nouveautes" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">Voir tout â†’</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recommended.map((p) => (
            <Link key={p.slug} href={`/produit/${p.slug}`} className="group bg-white border border-neutral-100 hover:border-neutral-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden">
              <div className="relative aspect-square bg-neutral-50 overflow-hidden">
                <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 300px" />
                {p.badge && <span className="absolute top-2.5 right-2.5 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-1">{p.badge}</span>}
              </div>
              <div className="px-3.5 py-3">
                <p className="font-bold text-[12px] leading-snug line-clamp-2 mb-2 group-hover:underline underline-offset-2">{p.name}</p>
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