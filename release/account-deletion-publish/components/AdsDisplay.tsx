"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type Ad = {
  id: string;
  type: "popup" | "topbar" | "corner" | "floating";
  heading: string | null;
  body: string | null;
  image_url: string | null;
  button_label: string | null;
  button_href: string | null;
  bg_color: string;
  text_color: string;
  accent_color: string;
  delay_seconds: number;
  frequency: "always" | "once_session" | "once_day" | "once_total";
  target_pages: string;
};

export default function AdsDisplay() {
  const pathname = usePathname();
  const [ads, setAds] = useState<Ad[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const isAdmin = useRef(false);

  useEffect(() => {
    isAdmin.current = (pathname ?? "").startsWith("/admin");
  }, [pathname]);

  useEffect(() => {
    if ((pathname ?? "").startsWith("/admin")) return;
    fetch("/api/ads")
      .then((r) => r.json())
      .then((data: Ad[]) => {
        if (!Array.isArray(data)) return;
        const path = pathname ?? "/";
        setAds(
          data.filter((a) => {
            const t = a.target_pages;
            if (t === "all") return true;
            if (t === "home") return path === "/";
            if (t === "boutique") return path.startsWith("/boutique");
            if (t === "product") return path.startsWith("/produit");
            if (t === "cart") return path.startsWith("/panier");
            try {
              const paths: string[] = JSON.parse(t);
              return paths.some((p) => path.startsWith(p));
            } catch {
              return false;
            }
          })
        );
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    ads.forEach((ad) => {
      let skip = false;
      try {
        const seenRaw = localStorage.getItem("lecomax_ads_seen");
        const seen: Record<string, number> = seenRaw ? JSON.parse(seenRaw) : {};
        const lastSeen = seen[ad.id];
        if (lastSeen) {
          if (ad.frequency === "once_total") skip = true;
          else if (ad.frequency === "once_day" && Date.now() - lastSeen <= 86_400_000) skip = true;
        }
        if (!skip && ad.frequency === "once_session") {
          if (sessionStorage.getItem(`lecomax_ad_sess_${ad.id}`)) skip = true;
        }
      } catch {
        // storage unavailable
      }
      if (skip) return;

      const delay = (ad.type === "topbar" ? 0 : (ad.delay_seconds || 0)) * 1000;
      const t = setTimeout(() => {
        setVisible((v) => ({ ...v, [ad.id]: true }));
        try {
          if (ad.frequency === "once_session") {
            sessionStorage.setItem(`lecomax_ad_sess_${ad.id}`, "1");
          }
          if (ad.frequency !== "always") {
            const seenRaw = localStorage.getItem("lecomax_ads_seen");
            const seen: Record<string, number> = seenRaw ? JSON.parse(seenRaw) : {};
            seen[ad.id] = Date.now();
            localStorage.setItem("lecomax_ads_seen", JSON.stringify(seen));
          }
        } catch {
          // storage unavailable
        }
      }, delay);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [ads]);

  if ((pathname ?? "").startsWith("/admin")) return null;

  const visibleAds = ads.filter((a) => visible[a.id]);
  if (visibleAds.length === 0) return null;

  const topbars = visibleAds.filter((a) => a.type === "topbar");
  const popups = visibleAds.filter((a) => a.type === "popup");
  const corners = visibleAds.filter((a) => a.type === "corner");
  const floaters = visibleAds.filter((a) => a.type === "floating");

  function dismiss(id: string) {
    setVisible((v) => ({ ...v, [id]: false }));
  }

  return (
    <>
      {topbars.map((ad) => (
        <div
          key={ad.id}
          className="relative z-[9999] px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-semibold"
          style={{ background: ad.bg_color, color: ad.text_color }}
        >
          <div className="flex-1 flex items-center justify-center gap-3 flex-wrap">
            {ad.heading && <span className="font-bold">{ad.heading}</span>}
            {ad.body && <span className="opacity-70 text-xs">{ad.body}</span>}
            {ad.button_label && ad.button_href && (
              <Link
                href={ad.button_href}
                className="text-xs font-black px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                style={{ background: ad.accent_color, color: "#000" }}
              >
                {ad.button_label}
              </Link>
            )}
          </div>
          <button
            onClick={() => dismiss(ad.id)}
            className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1"
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}

      {popups.map((ad) => (
        <div
          key={ad.id}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(ad.id); }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: ad.bg_color, color: ad.text_color }}
          >
            <button
              onClick={() => dismiss(ad.id)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ background: ad.text_color + "22" }}
              aria-label="Fermer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ad.text_color} strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {ad.image_url && (
              <img src={ad.image_url} alt={ad.heading ?? ""} className="w-full h-52 object-cover" />
            )}
            <div className="p-6">
              {ad.heading && <h2 className="font-black text-2xl mb-2 leading-tight">{ad.heading}</h2>}
              {ad.body && <p className="text-sm opacity-70 mb-5 leading-relaxed">{ad.body}</p>}
              {ad.button_label && ad.button_href && (
                <Link
                  href={ad.button_href}
                  onClick={() => dismiss(ad.id)}
                  className="inline-flex items-center gap-2 text-sm font-black px-6 py-3 rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: ad.accent_color, color: "#000" }}
                >
                  {ad.button_label}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {corners.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9997] flex flex-col gap-3 items-end" style={{ maxWidth: "320px" }}>
          {corners.map((ad) => (
            <div
              key={ad.id}
              className="w-full rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: ad.bg_color, color: ad.text_color }}
            >
              {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-32 object-cover" />}
              <div className="p-4 relative">
                <button
                  onClick={() => dismiss(ad.id)}
                  className="absolute top-3 right-3 opacity-40 hover:opacity-80 transition-opacity"
                  aria-label="Fermer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ad.text_color} strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                {ad.heading && <p className="font-black text-sm mb-1 pr-5">{ad.heading}</p>}
                {ad.body && <p className="text-xs opacity-60 mb-3">{ad.body}</p>}
                {ad.button_label && ad.button_href && (
                  <Link
                    href={ad.button_href}
                    onClick={() => dismiss(ad.id)}
                    className="inline-block text-xs font-black px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: ad.accent_color, color: "#000" }}
                  >
                    {ad.button_label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {floaters.map((ad) => (
        <div
          key={ad.id}
          className="fixed bottom-0 left-0 right-0 z-[9996] px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]"
          style={{ background: ad.bg_color, color: ad.text_color }}
        >
          <div className="flex-1 flex items-center gap-3 flex-wrap">
            {ad.image_url && (
              <img src={ad.image_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            )}
            {ad.heading && <span className="font-black text-sm">{ad.heading}</span>}
            {ad.body && <span className="text-xs opacity-70">{ad.body}</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {ad.button_label && ad.button_href && (
              <Link
                href={ad.button_href}
                onClick={() => dismiss(ad.id)}
                className="text-xs font-black px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: ad.accent_color, color: "#000" }}
              >
                {ad.button_label}
              </Link>
            )}
            <button
              onClick={() => dismiss(ad.id)}
              className="opacity-50 hover:opacity-100 transition-opacity p-1"
              aria-label="Fermer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

