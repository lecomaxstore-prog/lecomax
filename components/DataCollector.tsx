"use client";
/**
 * DataCollector — collects behavioral data ONLY after the user grants
 * data_collection consent in the cookie banner.
 *
 * To track custom events (product views, cart, search) use:
 *   import { collectEvent } from "@/lib/collect";
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { collectEvent } from "@/lib/collect";

function hasDataConsent(): boolean {
  try {
    const raw = localStorage.getItem("lecomax_cookie_consent");
    if (!raw) return false;
    return JSON.parse(raw)?.data_collection === true;
  } catch { return false; }
}

export default function DataCollector() {
  const pathname = usePathname();

  // Listen for consent grant at runtime (from CookieBanner)
  useEffect(() => {
    function onConsent(e: Event) {
      const granted = (e as CustomEvent<boolean>).detail;
      if (granted) {
        collectEvent("page_view", {
          path: window.location.pathname,
          title: document.title,
          extra: { referrer: document.referrer || null },
        });
      }
    }
    window.addEventListener("lecomax-data-consent", onConsent);
    return () => window.removeEventListener("lecomax-data-consent", onConsent);
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!hasDataConsent()) return;
    collectEvent("page_view", {
      path: pathname,
      title: document.title,
      extra: { referrer: document.referrer || null },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!hasDataConsent()) return;
    const startedAt = Date.now();
    let maximumScroll = 0;
    const updateScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0) maximumScroll = Math.max(maximumScroll, Math.round((window.scrollY / scrollable) * 100));
    };
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScroll);
      const dwellSeconds = Math.min(1800, Math.round((Date.now() - startedAt) / 1000));
      if (dwellSeconds >= 5 || maximumScroll >= 25) {
        collectEvent("engagement", {
          path: pathname,
          extra: { dwell_seconds: dwellSeconds, scroll_depth: Math.min(100, maximumScroll) },
        });
      }
    };
  }, [pathname]);

  return null;
}
