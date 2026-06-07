"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith("/admin")) return;

    // Generate or retrieve a session ID persisted in sessionStorage
    // (resets when the browser tab is closed, giving one ID per visit)
    let sessionId: string | null = null;
    try {
      sessionId = sessionStorage.getItem("_lx_sid");
      if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);
        sessionStorage.setItem("_lx_sid", sessionId);
      }
    } catch {
      // sessionStorage unavailable (private browsing in some browsers) — ignore
    }

    fetch("/api/page-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
        session_id: sessionId,
      }),
    }).catch(() => {
      // silent — tracking should never block UX
    });

    // Also fire GA4 page view on navigation
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
      (window as unknown as Record<string, (...args: unknown[]) => void>).gtag("config", "G-9N1CPZQ1HG", { page_path: pathname });
    }
  }, [pathname]);

  return null;
}
