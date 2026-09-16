"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { CartCalculation, CartRequestItem } from "./commerce-contract";

export async function commerceAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export function useCartCalculation(input: { items: CartRequestItem[]; city?: string; email?: string; couponId?: string; paymentProvider?: "cod" | "paypal" }, settings: unknown) {
  const key = JSON.stringify([input, settings]);
  const [result, setResult] = useState<{ key: string; quote?: CartCalculation; error?: string }>({ key: "" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("focus", refresh);
    const timer = setInterval(refresh, 30_000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(timer); };
  }, []);
  useEffect(() => {
    const [payload] = JSON.parse(key) as [typeof input];
    if (!payload.items.length) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (controller.signal.aborted) return;
        const response = await fetch("/api/checkout/quote", { method: "POST", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "application/json", ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) }, body: JSON.stringify(payload) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Calcul indisponible.");
        if (!controller.signal.aborted) setResult({ key, quote: body });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, error: error instanceof Error ? error.message : "Calcul indisponible." });
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, revision]);
  return { quote: result.key === key ? result.quote : undefined, error: result.key === key ? result.error : undefined,
    loading: result.key !== key, refresh: () => setRevision(value => value + 1) };
}
