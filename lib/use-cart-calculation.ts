"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import type { CartCalculation, CartRequestItem } from "./commerce-contract";

export async function commerceAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export function useCartCalculation(input: { items: CartRequestItem[]; city?: string; email?: string; couponId?: string; paymentProvider?: "cod" | "paypal" }, settings: unknown, deliveryAddress?: string) {
  const [revision, setRevision] = useState(0);
  // Include retries and address edits in identity: an older quote is never ready
  // while its replacement is debouncing, authenticating, or in flight.
  const key = JSON.stringify([input, settings, deliveryAddress, revision]);
  // A -> B -> A is a new request too, not a reusable result from the first A.
  const request = useMemo(() => ({ key }), [key]);
  const [result, setResult] = useState<{ request?: typeof request; quote?: CartCalculation; error?: string }>({});
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("focus", refresh);
    const timer = setInterval(refresh, 30_000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(timer); };
  }, []);
  useEffect(() => {
    const [payload] = JSON.parse(request.key) as [typeof input];
    if (!payload.items.length) return;
    const controller = new AbortController();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      const message = "Le calcul du panier est momentanément indisponible. Réessayez.";
      deadline = setTimeout(() => {
        setResult({ request, error: message });
        controller.abort();
      }, 15_000);
      try {
        const { data } = await supabase.auth.getSession();
        if (controller.signal.aborted) return;
        const response = await fetch("/api/checkout/quote", { method: "POST", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "application/json", ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) }, body: JSON.stringify(payload) });
        const body = await response.json();
        if (!response.ok) {
          throw new Error("Quote unavailable");
        }
        // A malformed successful response must never become a free quote.
        if (!body || !Array.isArray(body.items) || typeof body.currency !== "string" || !body.currency.trim() ||
            ![body.subtotal, body.shipping, body.discount, body.paymentFee, body.total].every(value =>
              typeof value === "number" && Number.isFinite(value) && value >= 0)) {
          throw new Error("Invalid quote");
        }
        if (!controller.signal.aborted) setResult({ request, quote: body });
      } catch {
        if (!controller.signal.aborted) setResult({ request, error: message });
      } finally { clearTimeout(deadline); }
    }, 200);
    return () => { clearTimeout(timer); clearTimeout(deadline); controller.abort(); };
  }, [request]);
  const hasItems = input.items.length > 0;
  return { quote: hasItems && result.request === request ? result.quote : undefined, error: hasItems && result.request === request ? result.error : undefined,
    loading: hasItems && result.request !== request, refresh: () => setRevision(value => value + 1) };
}
