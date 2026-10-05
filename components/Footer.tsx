"use client";
import { RETURN_POLICY } from "@/lib/return-policy";

import { BRAND_COPY } from "@/mobile/src/lib/brand-copy";
import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import { useSettings } from "@/lib/use-settings";
import { storeSettings } from "@/lib/store-settings";

const cols = [
  {
    title: "Produits",
    links: [
      { label: "Nouveautés", href: "/nouveautes/" },
      { label: "Bestsellers", href: "/bestsellers/" },
      { label: "Promotions", href: "/promotions/" },
    ],
  },
  {
    title: "Catégories",
    links: [
      { label: "Chaussures", href: "/chaussures/" },
      { label: "Homme", href: "/homme/" },
      { label: "Femme", href: "/femme/" },
      { label: "Accessoires", href: "/accessoires/" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Aide & FAQ", href: "/aide/" },
      { label: "Nous contacter", href: "/nous-contacter/" },
      { label: "Suivi de commande", href: "/suivre-commande/" },
      { label: "Retours", href: "/retours/" },
      { label: "Guide des tailles", href: "/guide-des-tailles/" },
    ],
  },
  {
    title: "Société",
    links: [
      { label: "À propos", href: "/a-propos/" },
      { label: "Notre boutique", href: "/boutiques/" },
      { label: "ecoClub", href: "/ecoclub/" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Politique de confidentialité", href: "/politique-confidentialite/" },
      { label: "Conditions d'utilisation", href: "/conditions-utilisation/" },
      { label: "Politique de retours", href: "/retours/" },
      { label: "Politique de cookies", href: "/cookies/" },
    ],
  },
];

const DEFAULT_SOCIALS = [
  {
    label: "Instagram",
    key: "instagram_url",
    defaultHref: "https://www.instagram.com/lecomaxcom",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: "TikTok",
    key: "tiktok_url",
    defaultHref: "https://www.tiktok.com/@lecomaxcom",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.95a8.16 8.16 0 004.79 1.53V7.03a4.85 4.85 0 01-1.02-.34z"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    key: "facebook_url",
    defaultHref: "https://www.facebook.com/lecomaxcom",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
];

const trustBadges = [
  { label: "", sub: "Partout au Maroc", path: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z", dynamicLabel: "shipping" },
  { label: RETURN_POLICY.label, sub: `Sous ${RETURN_POLICY.window}`, path: "M3 2v6h6M3 8C4.5 4.5 8 2 12 2a10 10 0 0110 10 10 10 0 01-10 10c-4.1 0-7.6-2.5-9.2-6" },
  { label: "Paiement sécurisé", sub: "Options au paiement", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { label: "Service client", sub: "Contactez-nous", path: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const rawSettings = useSettings();
  const siteSettings: Record<string, string> = { ...rawSettings, ...storeSettings(rawSettings) };

  const socials = DEFAULT_SOCIALS.map(s => ({ ...s, href: siteSettings[s.key] || s.defaultHref }));
  const whatsappNumber = siteSettings.whatsapp_number;
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`;
  const shippingCost = siteSettings.shipping_cost;
  const freeShippingThreshold = siteSettings.free_shipping_enabled === "false" ? "0" : siteSettings.free_shipping_threshold;

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setNewsletterStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setNewsletterStatus(data?.alreadySubscribed ? "already" : "success");
        setEmail("");
      } else {
        setNewsletterStatus("error");
      }
    } catch {
      setNewsletterStatus("error");
    }
  };
  return (
    <footer data-source-file="components/Footer.tsx" className="bg-neutral-950 text-white mt-20">
      <div data-nosnippet>
      {/* Green accent bar */}
      <div className="h-[3px] bg-gradient-to-r from-[#3ecf4c] via-[#6bdd6b] to-[#3ecf4c]" />

      {/* Trust bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-white/10">
          {trustBadges.map((b) => (
            <div key={b.sub} className="flex items-center gap-3 md:px-6 first:pl-0 last:pr-0">
              <div className="w-9 h-9 rounded-full bg-[#3ecf4c]/10 border border-[#3ecf4c]/20 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="1.8" strokeLinecap="round">
                  <path d={b.path}/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-black uppercase tracking-wide text-white/90 leading-tight">
                  {b.dynamicLabel === "shipping"
                    ? `Livraison ${shippingCost} MAD`
                    : b.label}
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">{b.dynamicLabel === "shipping"
                  ? Number(freeShippingThreshold) > 0 ? `Gratuite dès ${freeShippingThreshold} MAD` : "Tarif fixe partout au Maroc"
                  : b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Brand + contact + newsletter */}
        <div className="grid md:grid-cols-3 gap-12 pb-12 border-b border-white/10">
          {/* Brand */}
          <div>
            <Logo variant="light" />
            <p className="text-white/50 text-[13px] mt-4 leading-relaxed">
              Votre marketplace lifestyle — des trouvailles et des essentiels pour tous les univers du quotidien. Livraison partout au Maroc.
            </p>
            <div className="flex items-center gap-2 mt-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-black text-[11px] uppercase tracking-[0.25em] text-white/40 mb-5">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 shrink-0" style={{color:'#3ecf4c'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wide mb-0.5">WhatsApp</p>
                  <a href={whatsappUrl} className="text-[13px] text-white/80 hover:text-white transition-colors">{whatsappNumber ? `+${whatsappNumber.replace(/[^0-9]/g, "")}` : "+212 699 289 568"}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 shrink-0" style={{color:'#3ecf4c'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wide mb-0.5">Email</p>
                  <a href={`mailto:${siteSettings.store_email || "contact@lecomax.com"}`} className="text-[13px] text-white/80 hover:text-white transition-colors">{siteSettings.store_email || "contact@lecomax.com"}</a>
                </div>
              </li>
              {(siteSettings.store_city || siteSettings.store_address) && (
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 shrink-0" style={{color:'#3ecf4c'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 00-8 8c0 5.25 8 13 8 13s8-7.75 8-13a8 8 0 00-8-8z"/></svg>
                <div>
                  <p className="text-[11px] text-white/40 uppercase tracking-wide mb-0.5">Adresse</p>
                  <p className="text-[13px] text-white/80">{[siteSettings.store_address, siteSettings.store_city, "Maroc"].filter(Boolean).join(", ")}</p>
                </div>
              </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          {siteSettings.enable_newsletter !== "false" && <div>
            <h3 className="font-black text-[11px] uppercase tracking-[0.25em] text-white/40 mb-5">Newsletter</h3>
            <p className="text-white/55 text-[13px] mb-5 leading-relaxed">
              Nouveautés, offres exclusives et invitations en avant-première.
            </p>
            <form className="flex flex-col gap-2" onSubmit={handleNewsletter}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                 disabled={newsletterStatus === "loading" || newsletterStatus === "success" || newsletterStatus === "already"}
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50"
              />
              {newsletterStatus === "success" || newsletterStatus === "already" ? (
                <p className="text-[12px] text-[#3ecf4c] font-bold py-2">
                  {newsletterStatus === "already" ? "✓ Vous êtes déjà inscrit(e) !" : "✓ Vous êtes inscrit(e) !"}
                </p>
              ) : (
                <button
                  type="submit"
                  disabled={newsletterStatus === "loading"}
                  className="w-full py-3 font-black uppercase text-[11px] tracking-widest border border-white/30 text-white bg-white/8 hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-50"
                >
                  {newsletterStatus === "loading" ? "..." : "S\u2019inscrire gratuitement"}
                </button>
              )}
              {newsletterStatus === "error" && (
                <p className="text-[11px] text-red-400">Erreur. Réessayez.</p>
              )}
            </form>
            <p className="text-[10px] text-white/25 mt-2">Pas de spam. Désinscription en 1 clic.</p>
          </div>}
        </div>

        {/* Nav columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 py-12 border-b border-white/10">
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-black text-[11px] uppercase tracking-[0.25em] text-white/40 mb-4">
                {c.title}
              </h4>
              <ul className="space-y-3">
                {c.links.filter((link) => link.href !== "/ecoclub/" || siteSettings.enable_ecoclub !== "false").map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-white/55 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-[#3ecf4c] transition-all duration-200 overflow-hidden shrink-0" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 text-[11px] text-white/35">
          <div>© {new Date().getFullYear()} {siteSettings.store_name || "L'ecomax"}. Tous droits réservés. — Fait avec ♥ au Maroc</div>

          <div className="flex flex-wrap justify-center gap-5">
            <Link href="/conditions-utilisation/" className="hover:text-white/60 transition-colors">Conditions</Link>
            <Link href="/politique-confidentialite/" className="hover:text-white/60 transition-colors">Confidentialité</Link>
            <Link href="/cookies/" className="hover:text-white/60 transition-colors">Cookies</Link>
            <Link href="/retours/" className="hover:text-white/60 transition-colors">Retours</Link>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
