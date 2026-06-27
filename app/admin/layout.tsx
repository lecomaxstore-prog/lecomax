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
    label: "Enregistrements",
    href: "/admin/recordings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
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
    label: "Données clients",
    href: "/admin/client-data",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
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
    label: "Paniers abandonnés",
    href: "/admin/abandoned-carts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/>
        <line x1="17" y1="11" x2="17" y2="17"/><line x1="14" y1="14" x2="20" y2="14"/>
      </svg>
    ),
  },
  {
    label: "Fidélité",
    href: "/admin/loyalty",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    label: "Broadcast",
    href: "/admin/broadcast",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.12 2.82 2 2 0 012.11 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
  },
  {
    label: "Notifications Push",
    href: "/admin/push",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        <line x1="12" y1="2" x2="12" y2="1"/>
      </svg>
    ),
  },
  {
    label: "Trustpilot",
    href: "/admin/trustpilot",
    icon: (
      <svg width="16" height="16" viewBox="0 0 127.1 117.5">
        <polygon fill="currentColor" points="63.6 0 82.9 55.7 141.4 55.7 96 90.1 113.5 143.8 68.1 109.4 22.7 143.8 40.2 90.1 -5.2 55.7 53.3 55.7" transform="scale(0.9)"/>
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
    label: "Pages",
    href: "/admin/pages",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label: "Bannières",
    href: "/admin/banners",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
  },
  {
    label: "Médiathèque",
    href: "/admin/media",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    label: "Studio",
    href: "/admin/studio",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M5.636 5.636a9 9 0 1 0 12.728 12.728A9 9 0 0 0 5.636 5.636"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
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
    label: "Publicités",
    href: "/admin/ads",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
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
  {
    label: "Rôles & Permissions",
    href: "/admin/roles",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    label: "Équipe & Accès",
    href: "/admin/staff",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: "Approbations",
    href: "/admin/approvals",
    badge: "approvals",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    label: "Comment c'est construit",
    href: "/admin/how-it-was-built",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
];

const navSections: { title: string; hrefs: string[] }[] = [
  { title: "VENTES",      hrefs: ["/admin/dashboard", "/admin/analytics", "/admin/recordings", "/admin/orders"] },
  { title: "DÉVELOPPEUR", hrefs: ["/admin/how-it-was-built"] },
  { title: "CATALOGUE",   hrefs: ["/admin/products", "/admin/categories", "/admin/stock", "/admin/pages", "/admin/banners", "/admin/media", "/admin/studio"] },
  { title: "CLIENTS",     hrefs: ["/admin/customers", "/admin/client-data", "/admin/loyalty", "/admin/abandoned-carts"] },
  { title: "MARKETING",   hrefs: ["/admin/promotions", "/admin/ads", "/admin/push", "/admin/newsletter", "/admin/coupons", "/admin/announcement", "/admin/broadcast"] },
  { title: "SAV",         hrefs: ["/admin/messages", "/admin/chat-kb", "/admin/reviews", "/admin/trustpilot", "/admin/returns"] },
  { title: "LOGISTIQUE",  hrefs: ["/admin/shipping", "/admin/size-guide"] },
  { title: "CONFIG",      hrefs: ["/admin/settings"] },
  { title: "ÉQUIPE",      hrefs: ["/admin/roles", "/admin/staff", "/admin/approvals"] },
];

// Permission required per nav href.
// null  → always visible (everyone)
// undefined → owner only (hidden from all staff)
// "slug" → visible if staff has that permission
const NAV_PERMISSIONS: Record<string, string | null | undefined> = {
  "/admin/dashboard":      null,
  "/admin/analytics":      "analytics.view",
  "/admin/recordings":     "recordings.view",
  "/admin/products":       "products.view",
  "/admin/orders":         "orders.view",
  "/admin/customers":      "customers.view",
  "/admin/client-data":    "customers.view",
  "/admin/stock":          "stock.edit",
  "/admin/abandoned-carts":"carts.view",
  "/admin/loyalty":        "loyalty.edit",
  "/admin/broadcast":      "broadcast.send",
  "/admin/push":           "push.send",
  "/admin/trustpilot":     "reviews.edit",
  "/admin/reviews":        "reviews.edit",
  "/admin/categories":     "categories.edit",
  "/admin/pages":          "pages.edit",
  "/admin/banners":        "banners.edit",
  "/admin/media":          "media.manage",
  "/admin/studio":         "studio.access",
  "/admin/shipping":       "shipping.edit",
  "/admin/size-guide":     "size-guide.edit",
  "/admin/announcement":   "announcement.edit",
  "/admin/promotions":     "promotions.edit",
  "/admin/ads":            "ads.edit",
  "/admin/newsletter":     "newsletter.edit",
  "/admin/coupons":        "promotions.edit",
  "/admin/messages":       "messages.view",
  "/admin/chat-kb":        "messages.view",
  "/admin/returns":        "returns.edit",
  "/admin/settings":       "settings.edit",
  "/admin/roles":          "roles.manage",
  "/admin/staff":          "staff.manage",
  "/admin/approvals":       undefined,
  "/admin/how-it-was-built": undefined,
};

// Page label map
const pageLabels: Record<string, string> = {
  dashboard: "Tableau de bord", analytics: "Analytiques", recordings: "Enregistrements", orders: "Commandes",
  customers: "Clients", products: "Produits", categories: "Catégories",
  stock: "Stock", promotions: "Promotions", newsletter: "Newsletter",
  coupons: "Codes promo", announcement: "Annonce", messages: "Messages",
  "chat-kb": "Base de connaissance bot",
  reviews: "Avis", returns: "Retours", trustpilot: "Trustpilot", shipping: "Livraison",
  "size-guide": "Guide tailles", settings: "Paramètres",
  "abandoned-carts": "Paniers abandonnés", loyalty: "Fidélité", broadcast: "Broadcast",
  pages: "Pages", banners: "Bannières", media: "Médiathèque",
  "client-data": "Données clients",
  ads: "Publicités", studio: "Studio Créatif", push: "Notifications Push",
  "how-it-was-built": "Comment c'est construit",
  "roles": "Rôles & Permissions",
  "staff": "Équipe & Accès",
  "approvals": "Approbations",
};

// ─── Scroll-to-top button (anchored inside the main scroll container) ─────────
function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("admin-main");
    if (!el) return;
    const onScroll = () => setVisible(el.scrollTop > 300);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => document.getElementById("admin-main")?.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-2xl bg-black text-white shadow-lg flex items-center justify-center hover:bg-neutral-800 transition-all hover:scale-110 active:scale-95"
      title="Retour en haut"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [badges, setBadges] = useState<Record<string, number>>({ orders: 0, stock: 0, messages: 0, approvals: 0 });
  const [now, setNow] = useState("");
  // null = owner (no restriction), string[] = staff permissions list
  const [staffPermissions, setStaffPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;
        const res = await fetch(`/api/admin/staff/permissions?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) return;
        const { isStaff, permissions } = await res.json();
        if (isStaff) {
          setStaffPermissions(permissions as string[]); // [] = dashboard only
        }
        // else: owner → stays null → sees everything
      } catch { /* silently keep null = owner mode */ }
    }
    loadPermissions();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setNow(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const t = setInterval(updateTime, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const isLoginPage = pathname === "/admin" || pathname === "/admin/";
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && !isLoginPage) {
        router.replace("/admin");
      }
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) router.replace("/admin");
    });
    return () => listener.subscription.unsubscribe();
  }, [pathname, router]);

  // Load badge counts (pending orders + low stock)
  useEffect(() => {
    if (pathname === "/admin" || pathname === "/admin/") return;
    Promise.all([
      fetch("/api/orders"),
      fetch("/api/products"),
      fetch("/api/messages?unread=true"),
      fetch("/api/admin/approvals?status=pending"),
    ]).then(async ([oRes, pRes, mRes, aRes]) => {
      const orders = oRes.ok ? await oRes.json() : [];
      const products = pRes.ok ? await pRes.json() : [];
      const msgs = mRes.ok ? await mRes.json() : [];
      const approvals = aRes.ok ? await aRes.json() : [];
      const pending = Array.isArray(orders) ? orders.filter((o: { status: string }) => o.status === "pending").length : 0;
      const lowStock = Array.isArray(products) ? products.filter((p: { stock: number }) => p.stock <= 3).length : 0;
      const unread = Array.isArray(msgs) ? msgs.length : 0;
      const pendingApprovals = Array.isArray(approvals) ? approvals.length : 0;
      setBadges({ orders: pending, stock: lowStock, messages: unread, approvals: pendingApprovals });
    }).catch(() => {});
  }, [pathname]);

  // login page — no shell (strip trailing slash before comparing)
  const isLoginPage = pathname.replace(/\/+$/, "") === "/admin" || pathname === "/admin";
  if (isLoginPage) return <>{children}</>;
  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f6f4]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-neutral-400 font-medium">Chargement…</p>
      </div>
    </div>
  );

  const pageKey = pathname.split("/admin/")[1]?.split("/")[0] ?? "dashboard";
  const pageLabel = pageLabels[pageKey] ?? pageKey;

  // Filtered nav for search
  const allNavItems = nav.filter(n =>
    canSee(n.href) &&
    (!search || n.label.toLowerCase().includes(search.toLowerCase()))
  );

  async function logout() {
    await supabase.auth.signOut();
    await fetch("/api/admin/auth/session", { method: "DELETE" });
    router.replace("/admin");
  }

  // Returns true if this nav href should be visible to the current user
  function canSee(href: string): boolean {
    if (staffPermissions === null) return true; // owner — see everything
    const perm = NAV_PERMISSIONS[href];
    if (perm === null) return true;       // always visible (dashboard)
    if (perm === undefined) return false; // owner-only section
    return staffPermissions.includes(perm);
  }

  const totalAlerts = (badges.orders || 0) + (badges.messages || 0);

  return (
    <div className="min-h-screen flex bg-[#f4f4f2]">
      {/* ──────────────── SIDEBAR ──────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-[#0d0d0d] text-white flex flex-col transition-transform duration-300 ease-out
        ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>

        {/* Brand header */}
        <div className="px-4 py-4 border-b border-white/[0.07] flex items-center gap-3 shrink-0">
          <img
            src="/favicon.png"
            alt="L'ecomax"
            width={36}
            height={36}
            className="rounded-xl shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-black text-[13px] tracking-wide truncate">L&apos;ECOMAX</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] animate-pulse" />
              <p className="text-white/30 text-[10px] font-medium">Panel Admin · {now}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-colors shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2 text-[12px] text-white/70 placeholder-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all"
            />
          </div>
        </div>

        {/* Quick actions */}
        {!search && (
          <div className="px-3 pb-2 shrink-0">
            <div className="grid grid-cols-2 gap-1.5">
              <Link href="/admin/orders" onClick={() => setOpen(false)}
                className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/10 border border-white/[0.07] rounded-xl px-3 py-2.5 transition-all group">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"><path d="M9 11l3 3L22 4"/></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/40 font-medium">Commandes</p>
                  {badges.orders > 0
                    ? <p className="text-[11px] font-black text-orange-400">{badges.orders} en attente</p>
                    : <p className="text-[11px] font-bold text-white/60">À jour</p>
                  }
                </div>
              </Link>
              <Link href="/admin/messages" onClick={() => setOpen(false)}
                className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/10 border border-white/[0.07] rounded-xl px-3 py-2.5 transition-all group">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/40 font-medium">Messages</p>
                  {badges.messages > 0
                    ? <p className="text-[11px] font-black text-blue-400">{badges.messages} non lus</p>
                    : <p className="text-[11px] font-bold text-white/60">Aucun</p>
                  }
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto py-1 space-y-0">
          {search ? (
            <div className="space-y-0.5 py-1">
              {allNavItems.length === 0 && (
                <p className="text-white/20 text-xs px-3 py-4 text-center">Aucun résultat</p>
              )}
              {allNavItems.map((item) => {
                const active = pathname.startsWith(item.href);
                const badgeCount = item.badge ? (badges[item.badge] ?? 0) : 0;
                return (
                  <Link key={item.href} href={item.href} onClick={() => { setOpen(false); setSearch(""); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
                      ${active ? "bg-white text-black" : "text-white/55 hover:text-white hover:bg-white/8"}`}>
                    <span className={`shrink-0 ${active ? "text-black" : "text-white/35"}`}>{item.icon}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight shrink-0
                        ${item.badge === "stock" ? "bg-amber-400 text-amber-950" : item.badge === "messages" ? "bg-blue-500 text-white" : item.badge === "approvals" ? "bg-amber-500 text-white animate-pulse" : "bg-orange-500 text-white"}`}>
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : navSections.map((section) => {
            const items = section.hrefs
              .map(href => nav.find(n => n.href === href))
              .filter((x): x is typeof nav[0] => !!x && canSee(x.href));
            if (items.length === 0) return null;
            return (
              <div key={section.title} className="mb-1">
                <p className="px-3 pt-3 pb-1 text-[9px] font-bold text-white/18 uppercase tracking-[0.2em]">{section.title}</p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const badgeCount = item.badge ? (badges[item.badge] ?? 0) : 0;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                          ${active ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white hover:bg-white/8"}`}>
                        <span className={`shrink-0 ${active ? "text-black" : "text-white/35"}`}>{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight shrink-0
                            ${item.badge === "stock" ? "bg-amber-400 text-amber-950" : item.badge === "messages" ? "bg-blue-500 text-white" : item.badge === "approvals" ? "bg-amber-500 text-white animate-pulse" : "bg-orange-500 text-white"}`}>
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

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.07] shrink-0 space-y-1">
          <Link href="/" target="_blank"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] text-white/35 hover:text-white hover:bg-white/8 transition-colors font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Voir le site
          </Link>
          <button onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[12px] text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-colors font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={() => setOpen(false)}
          style={{ backdropFilter: "blur(3px)" }} />
      )}

      {/* ──────────────── MAIN ──────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-neutral-100 flex items-center px-3 md:px-6 gap-3 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {/* Hamburger */}
          <button onClick={() => setOpen(true)}
            className="lg:hidden relative p-2 -ml-1 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-xl transition-colors shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            {totalAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[8px] font-black flex items-center justify-center">
                {totalAlerts > 9 ? "9+" : totalAlerts}
              </span>
            )}
          </button>

          {/* Logo on mobile */}
          <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
            <img src="/favicon.png" alt="L'ecomax" width={24} height={24} className="rounded-md shrink-0" />
            <span className="font-black text-[13px] truncate">{pageLabel}</span>
          </div>

          {/* Breadcrumb on desktop */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm flex-1 min-w-0">
            <span className="text-neutral-300 font-medium">Admin</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-200 shrink-0"><path d="M9 18l6-6-6-6"/></svg>
            <span className="font-bold text-neutral-800 truncate">{pageLabel}</span>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Alert pill — mobile */}
            {badges.orders > 0 && (
              <Link href="/admin/orders"
                className="flex items-center gap-1.5 text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">{badges.orders} en attente</span>
                <span className="sm:hidden">{badges.orders}</span>
              </Link>
            )}
            {/* View site — desktop */}
            <Link href="/" target="_blank"
              className="hidden md:flex text-xs text-neutral-500 hover:text-black items-center gap-1.5 border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-black transition-colors font-medium">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Voir le site
            </Link>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#3ecf4c]/15 border border-[#3ecf4c]/30 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="admin-main" className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto pb-24 lg:pb-8">
          {children}
          <ScrollToTop />
        </main>

        {/* ──────────────── MOBILE BOTTOM NAV ──────────────── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-100 shadow-[0_-2px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex items-center justify-around h-[60px] px-1">

            {/* Left pair */}
            {[
              {
                href: "/admin/dashboard", label: "Accueil",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              },
              {
                href: "/admin/orders", label: "Commandes", badge: "orders",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              },
            ].map((item) => {
              const active = pathname.startsWith(item.href);
              const badgeCount = item.badge ? (badges[item.badge as keyof typeof badges] ?? 0) : 0;
              return (
                <Link key={item.href} href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-150 active:scale-90
                    ${active ? "text-black" : "text-neutral-400"}`}>
                  {badgeCount > 0 && (
                    <span className="absolute top-1.5 right-[calc(50%-16px)] w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm z-10">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                  <span className={active ? "text-black" : "text-neutral-400"}>{item.icon}</span>
                  <span className={`text-[9px] font-bold tracking-wide ${active ? "text-black" : "text-neutral-400"}`}>{item.label}</span>
                  {active && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#3ecf4c] rounded-full" />}
                </Link>
              );
            })}

            {/* Centre FAB — Nouveau produit */}
            <div className="flex-1 flex items-center justify-center">
              <Link href="/admin/products?new=1"
                className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg hover:bg-neutral-800 active:scale-90 transition-all">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </Link>
            </div>

            {/* Right pair */}
            {[
              {
                href: "/admin/messages", label: "Messages", badge: "messages",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              },
              {
                href: "/admin/products", label: "Produits",
                icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              },
            ].map((item) => {
              const active = pathname.startsWith(item.href);
              const badgeCount = item.badge ? (badges[item.badge as keyof typeof badges] ?? 0) : 0;
              return (
                <Link key={item.href} href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-150 active:scale-90
                    ${active ? "text-black" : "text-neutral-400"}`}>
                  {badgeCount > 0 && (
                    <span className="absolute top-1.5 right-[calc(50%-16px)] w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm z-10">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                  <span className={active ? "text-black" : "text-neutral-400"}>{item.icon}</span>
                  <span className={`text-[9px] font-bold tracking-wide ${active ? "text-black" : "text-neutral-400"}`}>{item.label}</span>
                  {active && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#3ecf4c] rounded-full" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
