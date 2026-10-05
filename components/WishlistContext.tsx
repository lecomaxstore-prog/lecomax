"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { customerApiFetch } from "@/lib/customer-api";
import { collectEvent } from "@/lib/collect";
import { safeLocalStorage } from "@/lib/browser-storage";

const STORAGE_KEY = "lecomax_wishlist_v1";

type WishlistContextValue = {
  slugs: Set<string>;
  count: number;
  ready: boolean;
  authenticated: boolean;
  pending: Set<string>;
  toggle: (slug: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readLocalWishlist(): string[] {
  try {
    const parsed = JSON.parse(safeLocalStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed
          .filter((slug): slug is string => typeof slug === "string")
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const mutationQueue = useRef<Promise<void>>(Promise.resolve());
  const sessionVersion = useRef(0);
  const pendingSlugs = useRef(new Set<string>());

  const hydrate = useCallback(async (signedIn: boolean) => {
    const version = ++sessionVersion.current;
    pendingSlugs.current.clear();
    setPending(new Set());
    const local = readLocalWishlist();
    setReady(false);
    if (!signedIn) {
      setAuthenticated(false);
      setSlugs(new Set(local));
      setReady(true);
      return;
    }

    setAuthenticated(true);
    try {
      const response = await customerApiFetch("/api/wishlist/");
      if (!response.ok) throw new Error("Wishlist unavailable");
      const data = await response.json();
      if (version !== sessionVersion.current) return;
      const server = Array.isArray(data.slugs)
        ? data.slugs.filter(
            (slug: unknown): slug is string => typeof slug === "string",
          )
        : [];
      const merged = [...new Set([...server, ...local])].slice(0, 100);
      let resolved = server;
      if (
        merged.length !== server.length ||
        merged.some((slug, index) => slug !== server[index])
      ) {
        const mergeResponse = await customerApiFetch("/api/wishlist/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "replace", slugs: merged }),
        });
        if (!mergeResponse.ok) throw new Error("Wishlist merge unavailable");
        const mergeData = await mergeResponse.json();
        resolved = Array.isArray(mergeData.slugs)
          ? mergeData.slugs.filter(
              (slug: unknown): slug is string => typeof slug === "string",
            )
          : server;
      }
      if (version !== sessionVersion.current) return;
      setSlugs(new Set(resolved));
      safeLocalStorage.removeItem(STORAGE_KEY);
    } catch {
      if (version === sessionVersion.current) setSlugs(new Set(local));
    } finally {
      if (version === sessionVersion.current) setReady(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) return hydrate(!!session);
    }).catch(() => {
      if (active) { setSlugs(new Set(readLocalWishlist())); setReady(true); }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !["SIGNED_IN", "SIGNED_OUT"].includes(event)) return;
      // Defer API calls until Supabase releases its auth callback lock.
      setTimeout(() => { if (active) void hydrate(!!session); }, 0);
    });
    return () => {
      active = false;
      sessionVersion.current++;
      subscription.unsubscribe();
    };
  }, [hydrate]);

  useEffect(() => {
    if (!ready || authenticated) return;
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs]));
  }, [authenticated, ready, slugs]);

  const toggle = useCallback(
    async (slug: string) => {
      if (!ready || !slug || pendingSlugs.current.has(slug)) return;
      const version = sessionVersion.current;
      pendingSlugs.current.add(slug);
      const wasSaved = slugs.has(slug);
      setPending((current) => new Set(current).add(slug));
      setSlugs((current) => {
        const next = new Set(current);
        if (wasSaved) next.delete(slug);
        else next.add(slug);
        return next;
      });

      let succeeded = true;
      if (authenticated) {
        try {
          const mutate = async () => {
            if (version !== sessionVersion.current) return;
            const response = await customerApiFetch("/api/wishlist/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: wasSaved ? "remove" : "save",
                slug,
              }),
            });
            if (!response.ok) throw new Error("Wishlist update failed");
          };
          const queued = mutationQueue.current.then(mutate, mutate);
          mutationQueue.current = queued.catch(() => undefined);
          await queued;
        } catch {
          succeeded = false;
          if (version !== sessionVersion.current) return;
          setSlugs((current) => {
            const rollback = new Set(current);
            if (wasSaved) rollback.add(slug);
            else rollback.delete(slug);
            return rollback;
          });
        }
      }
      if (version !== sessionVersion.current) return;
      if (succeeded) {
        collectEvent(wasSaved ? "favorite_remove" : "favorite_add", {
          path: "/wishlist",
          product_id: slug,
        });
      }
      pendingSlugs.current.delete(slug);
      setPending((current) => {
        const next = new Set(current);
        next.delete(slug);
        return next;
      });
    },
    [authenticated, ready, slugs],
  );

  const value = useMemo(
    () => ({ slugs, count: slugs.size, ready, authenticated, pending, toggle }),
    [slugs, ready, authenticated, pending, toggle],
  );
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value)
    throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}
