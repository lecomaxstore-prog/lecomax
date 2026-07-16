"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function anonymousId(prefix: string) {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    let sessionId: string | null = null;
    let visitorId: string | null = null;
    try {
      sessionId = sessionStorage.getItem("_lx_sid");
      if (!sessionId) {
        sessionId = anonymousId("s");
        sessionStorage.setItem("_lx_sid", sessionId);
      }
      visitorId = localStorage.getItem("_lx_vid");
      if (!visitorId) {
        visitorId = anonymousId("v");
        localStorage.setItem("_lx_vid", visitorId);
      }
    } catch {
      // Tracking must never interfere with browsing.
    }

    fetch("/api/page-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        session_id: sessionId,
        visitor_id: visitorId,
        screen_width: window.screen?.width ?? null,
        screen_height: window.screen?.height ?? null,
        language: navigator.language || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      }),
    }).catch(() => undefined);

    const analyticsWindow = window as unknown as Record<string, (...args: unknown[]) => void>;
    if (analyticsWindow.gtag) analyticsWindow.gtag("config", "G-9N1CPZQ1HG", { page_path: pathname });
  }, [pathname]);

  return null;
}
