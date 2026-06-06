"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const nav = [
  {
    label: "Aperçu",
    href: "/compte",
    exact: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Mes commandes",
    href: "/compte/commandes",
    exact: false,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    label: "Mon profil",
    href: "/compte/profil",
    exact: false,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Mes adresses",
    href: "/compte/adresses",
    exact: false,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

function isActive(href: string, exact: boolean, pathname: string) {
  const clean = pathname.replace(/\/$/, "");
  const target = href.replace(/\/$/, "");
  return exact ? clean === target : clean.startsWith(target);
}

const TIER_COLORS: Record<string, string> = {
  Bronze: "#cd7f32",
  Silver: "#a8a9ad",
  Gold:   "#fbbf24",
};

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [tierName, setTierName] = useState("Bronze");
  const [tierNext, setTierNext] = useState<number | null>(500);
  const [tierNextLabel, setTierNextLabel] = useState<string | null>("Silver");

  useEffect(() => {
    // Read the persisted session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/connexion");
        return;
      }
      const email = session.user.email ?? "";
      setUser({
        email,
        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
      });
      setLoading(false);
      // Fetch points
      if (email) {
        fetch(`/api/points?email=${encodeURIComponent(email)}`)
          .then(r => r.json())
          .then(d => {
            if (typeof d.points === "number") {
              setPoints(d.points);
              setTierName(d.tier ?? "Bronze");
              setTierNext(d.next ?? null);
              setTierNextLabel(d.nextLabel ?? null);
            }
          })
          .catch(() => {});
      }
    });

    // Keep session in sync across tabs and on token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/connexion");
        return;
      }
      setUser({
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/connexion");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">Chargement…</p>
      </div>
    );
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "?";

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Mon compte";

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden bg-black text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center text-[10px] font-black shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 leading-none mb-0.5">Mon compte</p>
            <p className="text-[12px] font-black uppercase tracking-wide leading-none truncate max-w-[180px]">{displayName}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          aria-label="Déconnexion"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sortir
        </button>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6 lg:py-12 flex gap-0 lg:gap-10">

        {/* ─────────── Sidebar ─────────── */}
        <aside className="hidden lg:flex flex-col w-[260px] shrink-0 gap-5">

          {/* Identity card */}
          <div className="bg-black text-white p-6">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 bg-white text-black flex items-center justify-center text-sm font-black uppercase shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-black text-[13px] uppercase tracking-wide truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-neutral-400 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>
            {/* EcoClub tier */}
            <div className="bg-white/10 px-4 py-3 mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: TIER_COLORS[tierName] ?? "currentColor" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">EcoClub {tierName}</span>
                </div>
                <span className="text-[10px] font-bold text-neutral-400">
                  {points.toLocaleString("fr-MA")} {tierNext ? `/ ${tierNext.toLocaleString("fr-MA")}` : ""} pts
                </span>
              </div>
              <div className="w-full h-1 bg-white/20">
                <div
                  className="h-full bg-white transition-all duration-700"
                  style={{ width: tierNext ? `${Math.min(100, Math.round((points / tierNext) * 100))}%` : "100%" }}
                />
              </div>
              {tierNext && tierNextLabel ? (
                <p className="text-[10px] text-neutral-400 mt-1.5">
                  {(tierNext - points).toLocaleString("fr-MA")} pts pour atteindre {tierNextLabel}
                </p>
              ) : (
                <p className="text-[10px] text-neutral-400 mt-1.5">Niveau maximum atteint 🏆</p>
              )}
            </div>
            <div className="h-px bg-white/10 mb-4" />
            <nav className="flex flex-col gap-0.5">
              {nav.map((item) => {
                const active = isActive(item.href, item.exact, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                      active
                        ? "bg-white text-black"
                        : "text-neutral-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
              <div className="h-px bg-white/10 my-2" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-neutral-500 hover:text-red-400 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Déconnexion
              </button>
            </nav>
          </div>

          {/* Help card */}
          <div className="bg-white border border-neutral-100 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-1">Support</p>
            <p className="font-black text-[13px] uppercase tracking-wide mb-3">Besoin d&apos;aide ?</p>
            <p className="text-[11px] text-neutral-500 leading-relaxed mb-4">
              Notre équipe répond 7j/7 pour vous accompagner.
            </p>
            <Link
              href="/aide"
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-black hover:gap-3 transition-all"
            >
              Centre d&apos;aide
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
          </div>

          {/* Promo card */}
          <div className="bg-white border border-neutral-100 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-1">Livraison</p>
            <p className="font-black text-[13px] uppercase tracking-wide mb-2">35 MAD partout au Maroc</p>
            <p className="text-[11px] text-neutral-500 leading-relaxed">Livraison gratuite dès 500 MAD d'achats</p>
          </div>
        </aside>

        {/* ─────────── Main content ─────────── */}
        <main className="flex-1 min-w-0 lg:pl-2">

          {/* Mobile nav */}
          <div className="lg:hidden mb-5 overflow-x-auto bg-white border-b border-neutral-200">
            <div className="flex min-w-max">
              {nav.map((item) => {
                const active = isActive(item.href, item.exact, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1.5 px-5 py-3.5 shrink-0 border-b-2 transition-colors duration-150 ${
                      active
                        ? "border-black text-black"
                        : "border-transparent text-neutral-400 hover:text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    {item.icon}
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
