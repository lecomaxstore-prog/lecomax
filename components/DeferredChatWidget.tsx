"use client";

import { useEffect, useState, type ComponentType } from "react";

export default function DeferredChatWidget() {
  const [Widget, setWidget] = useState<ComponentType | null>(null);

  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let loading = false;
    let loaded = false;
    let attempts = 0;
    const reveal = () => {
      if (disposed || loading || loaded || attempts >= 3) return;
      loading = true;
      attempts += 1;
      // A failed optional chunk must never replace the storefront with an
      // application error. Retry transient download failures a bounded number
      // of times, and leave the rest of the page usable while offline.
      void import("./ChatWidget").then((module) => {
        loaded = true;
        if (!disposed) setWidget(() => module.default);
      }).catch(() => {
        if (!disposed && attempts < 3) timer = setTimeout(reveal, 1500);
      }).finally(() => {
        loading = false;
      });
    };
    const onScroll = () => {
      if (window.scrollY >= 80) reveal();
    };
    const afterLoad = () => {
      if ("requestIdleCallback" in window) {
        idle = window.requestIdleCallback(reveal, { timeout: 1500 });
      } else {
        timer = setTimeout(reveal, 200);
      }
    };

    // The launcher is hidden until scrolling. Keep its code off the initial
    // request waterfall, but restore saved sessions soon after the page loads.
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });

    return () => {
      disposed = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", afterLoad);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  return Widget ? <Widget /> : null;
}
