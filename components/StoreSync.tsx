"use client";

import { useEffect, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { refreshSettings } from "@/lib/use-settings";
import { STORE_REFRESH_EVENT, STORE_REFRESH_INTERVAL_MS, STORE_TABLE_QUERIES } from "@/mobile/src/lib/store-sync";

/** Refresh open storefronts after database changes, with a polling fallback. */
export default function StoreSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    let lastRefresh = 0;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      if (Date.now() - lastRefresh < 1_000) return;
      lastRefresh = Date.now();
      window.dispatchEvent(new Event(STORE_REFRESH_EVENT));
      void refreshSettings().catch(() => {});
      startTransition(() => router.refresh());
    };
    const onChange = () => {
      clearTimeout(debounce);
      debounce = setTimeout(refresh, 250);
    };
    const timer = setInterval(refresh, STORE_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    const channel = isSupabaseConfigured ? supabase.channel("website-store") : null;
    for (const table of Object.keys(STORE_TABLE_QUERIES)) {
      channel?.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
    }
    channel?.subscribe();
    return () => {
      clearInterval(timer);
      clearTimeout(debounce);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [pathname, router]);
  return null;
}
