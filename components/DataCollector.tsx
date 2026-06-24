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

function getSessionId(): string | null {
  try { return localStorage.getItem("lecomax_session_id"); } catch { return null; }
}

function hasDataConsent(): boolean {
  try {
    const raw = localStorage.getItem("lecomax_cookie_consent");
    if (!raw) return false;
    return JSON.parse(raw)?.data_collection === true;
  } catch { return false; }
}

function sendEvent(eventType: string, payload: Record<string, unknown>) {
  const session_id = getSessionId();
  if (!session_id) return;
  fetch("/api/client-data/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, event_type: eventType, ...payload }),
  }).catch(() => { /* silent */ });
}

export default function DataCollector() {
  const pathname = usePathname();

  // Listen for consent grant at runtime (from CookieBanner)
  useEffect(() => {
    function onConsent(e: Event) {
      const granted = (e as CustomEvent<boolean>).detail;
      if (granted) {
        sendEvent("page_view", {
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
    sendEvent("page_view", {
      path: pathname,
      title: document.title,
      extra: { referrer: document.referrer || null },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
