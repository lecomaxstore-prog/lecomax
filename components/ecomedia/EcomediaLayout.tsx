"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EcomediaNotifButton from "./EcomediaNotifButton";
import EcomediaWordmark from "./EcomediaWordmark";

export default function EcomediaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? u.email?.split("@")[0], email: u.email });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(u ? { name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? u.email?.split("@")[0], email: u.email } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-[470px] mx-auto px-4 py-0 h-14 flex items-center justify-between gap-3">

          {/* ── Left: back to site ── */}
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-600 hover:text-black transition-colors active:scale-95 group shrink-0"
            title="Retour au site"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:-translate-x-0.5 transition-transform">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </div>
            <span className="hidden md:block text-[12px] font-bold text-neutral-500 group-hover:text-black transition-colors">L&apos;ecomax</span>
          </Link>

          {/* ── Center: Ecomedia branding ── */}
          <Link href="/ecomedia" className="active:opacity-80 transition-opacity">
            <EcomediaWordmark size="md" />
          </Link>

          {/* ── Right: actions ── */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Notification bell */}
            <EcomediaNotifButton />

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center active:scale-95 transition-transform ml-0.5"
                  title={user.name ?? "Mon compte"}
                >
                  {/* Avatar with green ring */}
                  <div className="p-[2px] rounded-full bg-gradient-to-br from-[#3ecf4c] to-[#16b277]">
                    <div className="bg-white p-[1.5px] rounded-full">
                      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-[11px] font-black text-[#3ecf4c]">
                        {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 bg-white border border-neutral-100 rounded-2xl shadow-2xl shadow-black/10 p-2 w-56 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User pill */}
                      <div className="flex items-center gap-3 px-3 py-2.5 mb-1 border-b border-neutral-100">
                        <div className="p-[2px] rounded-full bg-gradient-to-br from-[#3ecf4c] to-[#16b277] shrink-0">
                          <div className="bg-white p-[1px] rounded-full">
                            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[12px] font-black text-[#3ecf4c]">
                              {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[13px] text-black truncate">{user.name ?? "Membre"}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      <Link href="/compte" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        Mon profil
                      </Link>

                      <Link href="/boutique" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                        </div>
                        Boutique
                      </Link>

                      <Link href="/" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        </div>
                        Retour au site
                      </Link>

                      <div className="h-px bg-neutral-100 my-1.5" />

                      <button
                        onClick={async () => { setMenuOpen(false); await supabase.auth.signOut(); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
                      >
                        <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        </div>
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href={`/connexion?redirect=${encodeURIComponent(pathname ?? "/ecomedia")}`}
                className="ml-1 flex items-center gap-1.5 bg-black text-white text-[11px] font-black px-3.5 py-2 rounded-xl hover:bg-neutral-800 active:scale-95 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                Connexion
              </Link>
            )}
          </div>
        </div>

        {/* Green accent line under active state */}
        <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#3ecf4c]/30 to-transparent" />
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
