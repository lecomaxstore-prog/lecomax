/**
 * Utility to track behavioral events.
 * Only fires if the user has granted data_collection consent.
 * Import this in product/cart pages:
 *   import { collectEvent } from "@/lib/collect";
 */

function getSessionId(): string | null {
  try { return localStorage.getItem("lecomax_session_id"); } catch { return null; }
}

function hasConsent(): boolean {
  try {
    const raw = localStorage.getItem("lecomax_cookie_consent");
    if (!raw) return false;
    return JSON.parse(raw)?.data_collection === true;
  } catch { return false; }
}

export async function collectEvent(
  eventType: string,
  payload: {
    path?: string;
    title?: string;
    product_id?: string;
    product_name?: string;
    category?: string;
    query?: string;
    extra?: Record<string, unknown>;
  }
) {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;
  const session_id = getSessionId();
  if (!session_id) return;
  try {
    await fetch("/api/client-data/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, event_type: eventType, ...payload }),
    });
  } catch { /* silent */ }
}
