"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminPushNotifications from "@/components/AdminPushNotifications";
import AdminCommandPalette from "@/components/AdminCommandPalette";

const nav = [
  {
    label: "Ecomedia",
    href: "/admin/ecomedia",
    badge: "ecomedia",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
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
    label: "Application mobile",
    href: "/admin/mobile-app",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M10 18h4" />
      </svg>
    ),
  },
  {
    label: "Versions Android",
    href: "/admin/app-releases",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
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
    label: "Checkout",
    href: "/admin/checkout",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 5h18v14H3z"/><path d="M3 10h18"/><path d="M7 15h4"/>
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
    label: "Assistance mobile",
    href: "/admin/support",
    badge: "messages",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v5a2 2 0 0 0 2 2h2v-8H4v1z"/><path d="M20 13v5a2 2 0 0 1-2 2h-2v-8h4v1z"/><path d="M16 20h-4"/>
      </svg>
    ),
  },
  {
    label: "Base du chatbot",
    href: "/admin/chat-kb",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M9 7h6M9 11h6" />
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
  { title: "MARKETING",   hrefs: ["/admin/ecomedia", "/admin/promotions", "/admin/ads", "/admin/push", "/admin/newsletter", "/admin/coupons", "/admin/announcement", "/admin/broadcast"] },
  { title: "SAV",         hrefs: ["/admin/messages", "/admin/chat-kb", "/admin/reviews", "/admin/trustpilot", "/admin/returns"] },
  { title: "LOGISTIQUE",  hrefs: ["/admin/checkout", "/admin/shipping", "/admin/size-guide"] },
  { title: "CONFIG",      hrefs: ["/admin/mobile-app", "/admin/app-releases", "/admin/settings"] },
  { title: "ÉQUIPE",      hrefs: ["/admin/roles", "/admin/staff", "/admin/approvals"] },
];

// Permission required per nav href.
// null  → always visible (everyone)
// undefined → owner only (hidden from all staff)
// "slug" → visible if staff has that permission
const NAV_PERMISSIONS: Record<string, string | null | undefined> = {
  "/admin/dashboard":             null,
  "/admin/mobile-app":     "settings.edit",
  "/admin/app-releases":   "settings.edit",
  "/admin/ecomedia":              undefined, // owner-only (matches the route guard)
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
  "/admin/checkout":       "settings.edit",
  "/admin/size-guide":     "size-guide.edit",
  "/admin/announcement":   "announcement.edit",
  "/admin/promotions":     "promotions.edit",
  "/admin/ads":            "ads.edit",
  "/admin/newsletter":     "newsletter.edit",
  "/admin/coupons":        "promotions.edit",
  "/admin/messages":       "messages.view",
  "/admin/chat-kb":        undefined,
  "/admin/returns":        "returns.edit",
  "/admin/settings":       "settings.edit",
  "/admin/roles":          "roles.manage",
  "/admin/staff":          "staff.manage",
  "/admin/approvals":       undefined,
  "/admin/how-it-was-built": undefined,
};

// Page label map
const pageLabels: Record<string, string> = {
  "mobile-app": "Application mobile",
  "app-releases": "Versions Android",
  dashboard: "Tableau de bord", analytics: "Analytiques", recordings: "Enregistrements", orders: "Commandes",
  customers: "Clients", products: "Produits", categories: "Catégories",
  stock: "Stock", promotions: "Promotions", newsletter: "Newsletter",
  coupons: "Codes promo", announcement: "Annonce", messages: "Messages",
  "chat-kb": "Base de connaissance bot",
  reviews: "Avis", returns: "Retours", trustpilot: "Trustpilot", shipping: "Livraison", checkout: "Checkout",
  "size-guide": "Guide tailles", settings: "Paramètres",
  "abandoned-carts": "Paniers abandonnés", loyalty: "Fidélité", broadcast: "Broadcast",
  pages: "Pages", banners: "Bannières", media: "Médiathèque",
  "client-data": "Données clients",
  ads: "Publicités", studio: "Studio Créatif", push: "Notifications Push",
  "how-it-was-built": "Comment c'est construit",
  "ecomedia": "Ecomedia Manager",
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
      type="button"
      onClick={() => document.getElementById("admin-main")?.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Retour en haut de la page"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-20 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-lg transition-all hover:bg-neutral-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] focus-visible:ring-offset-2 lg:bottom-6 lg:right-6"
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
  const [badges, setBadges] = useState<Record<string, number>>({ orders: 0, stock: 0, messages: 0, approvals: 0, ecomedia: 0 });
  const [now, setNow] = useState("");
  const [permissionState, setPermissionState] = useState<
    | { status: "loading" }
    | { status: "owner" }
    | { status: "staff"; permissions: string[] }
    | { status: "error" }
  >({ status: "loading" });
  const [permissionRetry, setPermissionRetry] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const isLoginRoute = pathname.replace(/\/+$/, "") === "/admin";

  // ── Set admin-specific document title ──────────────────────────────────
  useEffect(() => {
    const PAGE_TITLES: Record<string, string> = {
      "/admin":                    "Connexion",
      "/admin/dashboard":          "Dashboard",
      "/admin/analytics":          "Analytiques",
      "/admin/products":           "Produits",
      "/admin/orders":             "Commandes",
      "/admin/customers":          "Clients",
      "/admin/messages":           "Messages",
      "/admin/reviews":            "Avis",
      "/admin/promotions":         "Promotions",
      "/admin/coupons":            "Coupons",
      "/admin/categories":         "Catégories",
      "/admin/banners":            "Banners",
      "/admin/announcement":       "Annonces",
      "/admin/newsletter":         "Newsletter",
      "/admin/push":               "Push",
      "/admin/stock":              "Stock",
      "/admin/shipping":           "Livraison",
      "/admin/returns":            "Retours",
      "/admin/settings":           "Paramètres",
      "/admin/app-releases":       "Versions Android",
      "/admin/staff":              "Équipe",
      "/admin/roles":              "Rôles",
      "/admin/approvals":          "Approbations",
      "/admin/ads":                "Publicités",
      "/admin/media":              "Médias",
      "/admin/loyalty":            "Fidélité",
      "/admin/pages":              "Pages",
      "/admin/size-guide":         "Guide des tailles",
      "/admin/recordings":         "Enregistrements",
      "/admin/client-data":        "Données clients",
      "/admin/studio":             "Studio IA",
      "/admin/broadcast":          "Broadcast",
      "/admin/how-it-was-built":   "Comment c'est construit",
      "/admin/chat-kb":            "Base de connaissances",
      "/admin/abandoned-carts":    "Paniers abandonnés",
      "/admin/ecoclub":            "Écoclub",
      "/admin/trustpilot":         "Trustpilot",
      "/admin/facture":            "Facture",
    };
    // Match by prefix to handle sub-routes like /admin/products?id=...
    const base = "/" + pathname.split("/").slice(0, 3).join("/").replace(/^\//, "");
    const pageName = PAGE_TITLES[base] ?? PAGE_TITLES[pathname] ?? "Admin";
    document.title = `${pageName} — Admin · L'ecomax`;
  }, [pathname]);

  useEffect(() => {
    if (isLoginRoute) return;
    let cancelled = false;

    async function loadPermissions() {
      setPermissionState({ status: "loading" });
      try {
        // Prefer the signed admin cookie: it is the same source of truth used by
        // the route guard. Supabase is retained as a fallback for legacy sessions.
        const verifyRes = await fetch("/api/admin/auth/verify/", {
          method: "GET",
          cache: "no-store",
        });
        let email: string | null = null;
        if (verifyRes.ok) {
          const verified = await verifyRes.json() as { email?: unknown };
          if (typeof verified.email === "string") email = verified.email;
        }
        if (!email) {
          const { data: { user } } = await supabase.auth.getUser();
          email = user?.email ?? null;
        }
        if (!email) throw new Error("Unable to identify the admin session");

        const res = await fetch(
          `/api/admin/staff/permissions/?email=${encodeURIComponent(email)}&v=2`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Unable to load permissions");
        const result = await res.json() as { isStaff?: unknown; permissions?: unknown };
        if (cancelled) return;

        if (result.isStaff === true) {
          const permissions = Array.isArray(result.permissions)
            ? result.permissions.filter((permission): permission is string => typeof permission === "string")
            : [];
          setPermissionState({ status: "staff", permissions });
        } else {
          setPermissionState({ status: "owner" });
        }
      } catch {
        // Unknown must never be interpreted as owner. Keep public admin routes
        // available and offer an explicit retry in the drawer.
        if (!cancelled) setPermissionState({ status: "error" });
      }
    }

    void loadPermissions();
    return () => { cancelled = true; };
  }, [isLoginRoute, permissionRetry]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setIsDesktop(media.matches);
      if (media.matches) setOpen(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearch("");
  }, [pathname]);

  useEffect(() => {
    if (!open || isDesktop) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const getFocusable = () => Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => element.getClientRects().length > 0);

    // Keep focus inside the drawer for accessibility without focusing the
    // search input, which would open the software keyboard on mobile.
    const focusTimer = window.setTimeout(() => {
      drawerCloseRef.current?.focus({ preventScroll: true });
    }, 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      drawerTriggerRef.current?.focus();
    };
  }, [isDesktop, open]);

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
    if (isLoginPage) { setChecking(false); return; }

    // Check the server-side admin_session cookie first (source of truth).
    // Only fall back to Supabase if the cookie is also missing.
    fetch("/api/admin/auth/verify/", { method: "GET", cache: "no-store" })
      .then((res) => {
        if (res.ok) {
          // Cookie session is valid — stay on current page regardless of Supabase state
          setChecking(false);
        } else {
          // Cookie invalid — check Supabase as final fallback
          supabase.auth.getSession().then(({ data }) => {
            if (!data.session) router.replace("/admin");
            setChecking(false);
          });
        }
      })
      .catch(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) router.replace("/admin");
          setChecking(false);
        });
      });

    // Still listen for explicit Supabase logout events while on page
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "SIGNED_OUT" && !session) router.replace("/admin");
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
      fetch("/api/admin/ecomedia/posts?limit=100"),
    ]).then(async ([oRes, pRes, mRes, aRes, eRes]) => {
      const orders = oRes.ok ? await oRes.json() : [];
      const products = pRes.ok ? await pRes.json() : [];
      const msgs = mRes.ok ? await mRes.json() : [];
      const approvals = aRes.ok ? await aRes.json() : [];
      const ecomediaPosts = eRes.ok ? await eRes.json() : [];
      const pending = Array.isArray(orders) ? orders.filter((o: { status: string }) => o.status === "pending").length : 0;
      const lowStock = Array.isArray(products) ? products.filter((p: { stock: number }) => p.stock <= 3).length : 0;
      const unread = Array.isArray(msgs) ? msgs.length : 0;
      const pendingApprovals = Array.isArray(approvals) ? approvals.length : 0;
      const pendingEcomedia = Array.isArray(ecomediaPosts) ? ecomediaPosts.filter((post: { is_client_post?: boolean; is_published?: boolean }) => post.is_client_post && !post.is_published).length : 0;
      setBadges({ orders: pending, stock: lowStock, messages: unread, approvals: pendingApprovals, ecomedia: pendingEcomedia });
    }).catch(() => {});
  }, [pathname]);

  // login page — no shell (strip trailing slash before comparing)
  if (isLoginRoute) return <>{children}</>;
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

  const commandItems = nav.filter(item => canSee(item.href)).map(item => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    badge: item.badge ? (badges[item.badge] ?? 0) : undefined,
    section: navSections.find(section => section.hrefs.includes(item.href))?.title ?? "ADMINISTRATION",
  }));

  async function logout() {
    await supabase.auth.signOut();
    await fetch("/api/admin/auth/session/", { method: "DELETE" });
    router.replace("/admin");
  }

  function openDrawer(trigger: HTMLButtonElement) {
    drawerTriggerRef.current = trigger;
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
  }

  // Returns true if this nav href should be visible to the current user
  function canSee(href: string): boolean {
    const perm = NAV_PERMISSIONS[href];
    if (perm === null) return true; // always visible (dashboard)
    if (permissionState.status === "owner") return true;
    if (permissionState.status !== "staff") return false;
    if (perm === undefined) return false; // owner-only section
    return permissionState.permissions.includes(perm);
  }

  const totalAlerts =
    (canSee("/admin/orders") ? badges.orders || 0 : 0) +
    (canSee("/admin/messages") ? badges.messages || 0 : 0);
  const mobileNavItems = [
    {
      href: "/admin/dashboard",
      activePath: "/admin/dashboard",
      label: "Accueil",
      icon: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
    },
    canSee("/admin/orders") ? {
      href: "/admin/orders",
      activePath: "/admin/orders",
      label: "Commandes",
      badge: "orders" as const,
      icon: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    } : null,
    canSee("/admin/products") ? {
      href: "/admin/products?new=1",
      activePath: "/admin/products",
      label: "Ajouter",
      primary: true,
      icon: <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
    } : null,
    canSee("/admin/messages") ? {
      href: "/admin/messages",
      activePath: "/admin/messages",
      label: "Messages",
      badge: "messages" as const,
      icon: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-[#f4f4f2]">
      {/* ──────────────── SIDEBAR ──────────────── */}
      <aside
        id="admin-sidebar"
        ref={drawerRef}
        aria-label="Navigation de l’administration"
        aria-hidden={!isDesktop && !open}
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(86vw,300px)] flex-col bg-[#0d0d0d] pt-[env(safe-area-inset-top)] text-white transition-[transform,visibility] duration-300 ease-out lg:static lg:z-40 lg:h-auto lg:max-h-none lg:w-[260px] lg:translate-x-0 lg:pt-0
          ${open ? "visible translate-x-0 shadow-2xl" : "invisible -translate-x-full pointer-events-none"} lg:visible lg:pointer-events-auto`}>

        {/* Brand header */}
        <div className="px-4 py-4 border-b border-white/[0.07] flex items-center gap-3 shrink-0">
          <img
            src="/favicon.png?v=5"
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
          <button
            ref={drawerCloseRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Fermer le menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/45 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <label htmlFor="admin-navigation-search" className="sr-only">Rechercher dans la navigation</label>
          <div className="relative">
            <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              id="admin-navigation-search"
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.06] pl-9 pr-3 text-[13px] text-white/80 placeholder-white/25 transition-all focus:border-[#3ecf4c]/60 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#3ecf4c]/20"
            />
          </div>
          {permissionState.status === "error" && (
            <div role="alert" className="mt-2 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-[11px] leading-4 text-amber-100">
              <span className="flex-1">Navigation limitée : les accès n’ont pas pu être vérifiés.</span>
              <button
                type="button"
                onClick={() => setPermissionRetry(value => value + 1)}
                className="min-h-11 shrink-0 rounded-lg px-2 font-bold text-amber-300 hover:bg-amber-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        {!search && (canSee("/admin/orders") || canSee("/admin/messages")) && (
          <div className="px-3 pb-2 shrink-0">
            <div className={`grid gap-1.5 ${canSee("/admin/orders") && canSee("/admin/messages") ? "grid-cols-2" : "grid-cols-1"}`}>
              {canSee("/admin/orders") && <Link href="/admin/orders" onClick={closeDrawer}
                aria-current={pathname.startsWith("/admin/orders") ? "page" : undefined}
                className="group flex min-h-12 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.05] px-3 py-2.5 transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]">
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
              </Link>}
              {canSee("/admin/messages") && <Link href="/admin/messages" onClick={closeDrawer}
                aria-current={pathname.startsWith("/admin/messages") ? "page" : undefined}
                className="group flex min-h-12 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.05] px-3 py-2.5 transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]">
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
              </Link>}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav aria-label="Sections de l’administration" aria-busy={permissionState.status === "loading"} className="min-h-0 flex-1 space-y-0 overflow-y-auto overscroll-contain px-3 py-1.5">
          {search ? (
            <div className="space-y-1 py-1">
              {allNavItems.length === 0 && (
                <p className="text-white/20 text-xs px-3 py-4 text-center">Aucun résultat</p>
              )}
              {allNavItems.map((item) => {
                const active = pathname.startsWith(item.href);
                const badgeCount = item.badge ? (badges[item.badge] ?? 0) : 0;
                return (
                  <Link key={item.href} href={item.href} onClick={() => { closeDrawer(); setSearch(""); }}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex min-h-12 items-center gap-2.5 rounded-[14px] border px-2 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]
                      ${active ? "border-[#3ecf4c]/25 bg-gradient-to-r from-[#3ecf4c]/16 to-[#3ecf4c]/[.06] text-white shadow-[0_8px_22px_rgba(0,0,0,.18)]" : "border-transparent text-white/60 hover:border-white/[.07] hover:bg-white/[.055] hover:text-white"}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-all ${active ? "bg-[#3ecf4c] text-black shadow-[0_5px_14px_rgba(62,207,76,.22)]" : "bg-white/[.045] text-white/35 group-hover:bg-white/[.08] group-hover:text-white/70"}`}>{item.icon}</span>
                    <span className="flex-1 truncate tracking-[-0.01em]">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight shrink-0
                        ${item.badge === "stock" ? "bg-amber-400 text-amber-950" : item.badge === "messages" ? "bg-blue-500 text-white" : item.badge === "approvals" ? "bg-amber-500 text-white animate-pulse" : "bg-orange-500 text-white"}`}>
                        {badgeCount}
                      </span>
                    )}
                    {active && badgeCount === 0 && <svg className="mr-1 shrink-0 text-[#66e875]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>}
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
              <div key={section.title} className="mb-1.5">
                <div className="flex items-center gap-2 px-2 pb-1.5 pt-3.5">
                  <span className="h-1 w-1 rounded-full bg-[#3ecf4c]/80 shadow-[0_0_8px_rgba(62,207,76,.45)]" />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">{section.title}</p>
                  <span className="h-px flex-1 bg-gradient-to-r from-white/[.07] to-transparent" />
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const badgeCount = item.badge ? (badges[item.badge] ?? 0) : 0;
                    return (
                      <Link key={item.href} href={item.href} onClick={closeDrawer}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex min-h-12 items-center gap-2.5 rounded-[14px] border px-2 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]
                          ${active ? "border-[#3ecf4c]/25 bg-gradient-to-r from-[#3ecf4c]/16 to-[#3ecf4c]/[.06] text-white shadow-[0_8px_22px_rgba(0,0,0,.18)]" : "border-transparent text-white/60 hover:border-white/[.07] hover:bg-white/[.055] hover:text-white"}`}>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-all ${active ? "bg-[#3ecf4c] text-black shadow-[0_5px_14px_rgba(62,207,76,.22)]" : "bg-white/[.045] text-white/35 group-hover:bg-white/[.08] group-hover:text-white/70"}`}>{item.icon}</span>
                        <span className="flex-1 truncate tracking-[-0.01em]">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight shrink-0
                            ${item.badge === "stock" ? "bg-amber-400 text-amber-950" : item.badge === "messages" ? "bg-blue-500 text-white" : item.badge === "approvals" ? "bg-amber-500 text-white animate-pulse" : "bg-orange-500 text-white"}`}>
                            {badgeCount}
                          </span>
                        )}
                        {active && badgeCount === 0 && <svg className="mr-1 shrink-0 text-[#66e875]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-1.5 border-t border-white/[0.07] bg-black/10 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:pb-3">
          <Link href="/" target="_blank" rel="noreferrer"
            className="group flex min-h-12 items-center gap-2.5 rounded-[14px] border border-transparent px-2 py-2 text-[12px] font-semibold text-white/55 transition-all hover:border-[#3ecf4c]/15 hover:bg-[#3ecf4c]/[.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[.045] text-white/35 transition group-hover:bg-[#3ecf4c]/15 group-hover:text-[#66e875]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>
            <span className="flex-1">Voir le site</span>
            <svg className="mr-1 text-white/20 transition group-hover:text-[#66e875]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
          <button type="button" onClick={logout}
            className="group flex min-h-12 w-full items-center gap-2.5 rounded-[14px] border border-transparent px-2 py-2 text-[12px] font-semibold text-white/45 transition-all hover:border-red-400/15 hover:bg-red-500/[.08] hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[.045] text-white/30 transition group-hover:bg-red-500/15 group-hover:text-red-300"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg></span>
            <span className="flex-1 text-left">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Fermer le menu de navigation"
          aria-controls="admin-sidebar"
          className="fixed inset-0 z-40 cursor-default bg-black/70 lg:hidden"
          onClick={closeDrawer}
          style={{ backdropFilter: "blur(3px)" }}
        />
      )}

      {/* ──────────────── MAIN ──────────────── */}
      <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] min-h-14 shrink-0 items-center gap-2 border-b border-neutral-100 bg-white px-3 pt-[env(safe-area-inset-top)] shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:gap-3 md:px-6 lg:h-14 lg:pt-0">
          {/* Hamburger */}
          <button
            type="button"
            onClick={event => openDrawer(event.currentTarget)}
            aria-label="Ouvrir le menu de navigation"
            aria-controls="admin-sidebar"
            aria-expanded={open}
            className="relative -ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] focus-visible:ring-offset-1 lg:hidden"
          >
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
            <img src="/favicon.png?v=5" alt="L'ecomax" width={24} height={24} className="rounded-md shrink-0" />
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
            <AdminCommandPalette items={commandItems} pathname={pathname} />
            <AdminPushNotifications />
            {/* Alert pill — mobile */}
            {canSee("/admin/orders") && badges.orders > 0 && (
              <Link href="/admin/orders"
                aria-label={`${badges.orders} commande${badges.orders > 1 ? "s" : ""} en attente`}
                className="flex min-h-11 items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-2.5 text-[11px] font-bold text-orange-600 transition-colors hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">{badges.orders} en attente</span>
                <span className="sm:hidden">{badges.orders}</span>
              </Link>
            )}
            {/* View site — desktop */}
            <Link href="/" target="_blank" rel="noreferrer"
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
        <main id="admin-main" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:p-6 md:pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:p-8 lg:pb-8">
          {children}
          <ScrollToTop />
        </main>

        {/* ──────────────── MOBILE BOTTOM NAV ──────────────── */}
        <nav
          aria-label="Navigation admin mobile"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200/80 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.10)] backdrop-blur-xl lg:hidden"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div className="flex h-[68px] items-stretch px-1.5">
            {mobileNavItems.map(item => {
              const active = pathname.startsWith(item.activePath);
              const badgeKey = "badge" in item ? item.badge : undefined;
              const badgeCount = badgeKey ? (badges[badgeKey] ?? 0) : 0;
              const primary = "primary" in item && item.primary;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] focus-visible:ring-inset ${active ? "text-black" : "text-neutral-500"}`}
                >
                  {badgeCount > 0 && (
                    <span aria-label={`${badgeCount} notification${badgeCount > 1 ? "s" : ""}`} className="absolute right-[calc(50%-20px)] top-1 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white shadow-sm">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                  <span className={primary ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white shadow-md" : active ? "text-black" : "text-neutral-500"}>
                    {item.icon}
                  </span>
                  <span className={`max-w-full truncate px-0.5 text-[10px] font-bold leading-3 ${active || primary ? "text-black" : "text-neutral-500"}`}>{item.label}</span>
                  {active && !primary && <span aria-hidden="true" className="absolute bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#3ecf4c]" />}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={event => openDrawer(event.currentTarget)}
              aria-label="Ouvrir tous les outils d’administration"
              aria-controls="admin-sidebar"
              aria-expanded={open}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-neutral-500 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] focus-visible:ring-inset"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              <span className="text-[10px] font-bold leading-3">Menu</span>
              {totalAlerts > 0 && (
                <span aria-label={`${totalAlerts} alerte${totalAlerts > 1 ? "s" : ""}`} className="absolute right-[calc(50%-20px)] top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white shadow-sm">
                  {totalAlerts > 9 ? "9+" : totalAlerts}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
