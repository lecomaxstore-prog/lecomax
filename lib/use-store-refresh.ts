"use client";

import { useEffect, useRef } from "react";
import { STORE_REFRESH_EVENT } from "@/mobile/src/lib/store-sync";

/** Runs once and whenever the shared storefront refreshes. */
export function useStoreRefresh(load: (signal: AbortSignal) => Promise<void>) {
  const latest = useRef(load);
  latest.current = load;
  useEffect(() => {
    let controller: AbortController | undefined;
    const refresh = () => {
      // Keep at most one request running for this consumer.
      if (controller) return;
      controller = new AbortController();
      void latest.current(controller.signal).catch(() => {}).finally(() => {
        controller = undefined;
      });
    };
    refresh();
    window.addEventListener(STORE_REFRESH_EVENT, refresh);
    return () => {
      window.removeEventListener(STORE_REFRESH_EVENT, refresh);
      controller?.abort();
    };
  }, []);
}
