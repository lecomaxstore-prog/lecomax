"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const nav = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Analytiques",
    href: "/admin/analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    label: "Produits",
    href: "/admin/products",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    label: "Commandes",
    href: "/admin/orders",
    badge: "orders",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    label: "Clients",
    href: "/admin/customers",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: "Stock",
    href: "/admin/stock",
    badge: "stock",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    label: "Avis",
    href: "/admin/reviews",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: "Catégories",
    href: "/admin/categories",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Livraison",
    href: "/admin/shipping",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    label: "Guide tailles",
    href: "/admin/size-guide",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 3h18v4H3z"/><path d="M3 9h10v12H3z"/><path d="M13 9h8v6h-8z"/><path d="M13 17h4v4h-4z"/>
      </svg>
    ),
  },
  {
    label: "Annonce",
    href: "/admin/announcement",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    label: "Promotions",
    href: "/admin/promotions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    label: "Codes promo",
    href: "/admin/coupons",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/admin/messages",
    badge: "messages",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    label: "Retours",
    href: "/admin/returns",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
      </svg>
    ),
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

const navSections: { title: string; hrefs: string[] }[] = [
  { title: "VENTES",     hrefs: ["/admin/dashboard", "/admin/analytics", "/admin/orders", "/admin/customers"] },
  { title: "CATALOGUE",  hrefs: ["/admin/products", "/admin/categories", "/admin/stock"] },
  { title: "MARKETING",  hrefs: ["/admin/promotions", "/admin/newsletter", "/admin/coupons", "/admin/announcement"] },
  { title: "SAV",        hrefs: ["/admin/messages", "/admin/reviews", "/admin/returns"] },
  { title: "LOGISTIQUE", hrefs: ["/admin/shipping", "/admin/size-guide"] },
  { title: "CONFIG",     hrefs: ["/admin/settings"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({ orders: 0, stock: 0, messages: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && pathname !== "/admin") {
        router.replace("/admin");
      }
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/admin") router.replace("/admin");
    });
    return () => listener.subscription.unsubscribe();
  }, [pathname, router]);

  // Load badge counts (pending orders + low stock)
  useEffect(() => {
    if (pathname === "/admin") return;
    Promise.all([fetch("/api/orders"), fetch("/api/products"), fetch("/api/messages?unread=true")]).then(async ([oRes, pRes, mRes]) => {
      const orders = oRes.ok ? await oRes.json() : [];
      const products = pRes.ok ? await pRes.json() : [];
      const msgs = mRes.ok ? await mRes.json() : [];
      const pending = Array.isArray(orders) ? orders.filter((o: { status: string }) => o.status === "pending").length : 0;
      const lowStock = Array.isArray(products) ? products.filter((p: { stock: number }) => p.stock <= 3).length : 0;
      const unread = Array.isArray(msgs) ? msgs.length : 0;
      setBadges({ orders: pending, stock: lowStock, messages: unread });
    }).catch(() => {});
  }, [pathname]);

  // login page — no shell
  if (pathname === "/admin") return <>{children}</>;
  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  async function logout() {
    await supabase.auth.signOut();
    document.cookie = "admin_session=; path=/; max-age=0; SameSite=Strict";
    router.replace("/admin");
  }

  return (
    <div className="min-h-screen flex bg-[#f6f6f4]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-black text-white flex flex-col transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        {/* Brand */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-black font-black text-[11px]">E</span>
          </div>
          <div>
            <p className="font-black text-sm tracking-wide">L&apos;ECOMAX</p>
            <p className="text-white/40 text-[10px]">Panel Admin</p>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-white/50 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto py-2">
          {navSections.map((section) => {
            const items = section.hrefs.map((href) => nav.find((n) => n.href === href)).filter((x): x is typeof nav[0] => !!x);
            return (
              <div key={section.title} className="mb-1">
                <p className="px-3 pt-3 pb-1 text-[9px] font-bold text-white/25 uppercase tracking-[0.15em]">{section.title}</p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const badgeCount = item.badge ? (badges[item.badge] ?? 0) : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
                          ${active ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                      >
                        <span className={active ? "text-black" : "text-white/50"}>{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight
                            ${item.badge === "stock" ? "bg-yellow-400 text-yellow-900" : item.badge === "messages" ? "bg-blue-500 text-white" : "bg-orange-500 text-white"}`}>
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="lg:hidden p-1 text-neutral-500 hover:text-black">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <nav className="text-sm text-neutral-400 hidden md:flex items-center gap-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-black font-medium capitalize">{pathname.split("/admin/")[1] || "Dashboard"}</span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs text-neutral-500 hover:text-black flex items-center gap-1.5 border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-black transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Voir le site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
