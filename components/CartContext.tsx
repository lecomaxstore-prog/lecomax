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
import type { Product } from "@/lib/products";
import { resolveProductVariantImage } from "@/lib/product-variant-image";

export type CartItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (p: Product, size: string, qty?: number, color?: string, image?: string) => void;
  remove: (slug: string, size: string, color: string) => void;
  setQty: (slug: string, size: string, color: string, qty: number) => void;
  clear: () => void;
  inventoryNotice: string;
  dismissInventoryNotice: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

const KEY = "lecomax_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [inventoryNotice, setInventoryNotice] = useState("");
  const itemsRef = useRef<CartItem[]>([]);
  const inventoryRequestRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const stored = JSON.parse(raw) as CartItem[];
        if (Array.isArray(stored)) {
          setItems(stored.map((item) => ({
            ...item,
            image: resolveProductVariantImage({
              slug: item.slug,
              color: item.color,
              fallback: item.image,
            }),
          })));
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    itemsRef.current = items;
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const reconcileInventory = useCallback(() => {
    if (inventoryRequestRef.current) return inventoryRequestRef.current;
    if (itemsRef.current.length === 0) return Promise.resolve();

    const request = (async () => {
      try {
        const response = await fetch("/api/products/?active=true&cart_inventory=1", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const data = await response.json() as Array<{
          slug?: unknown;
          stock?: unknown;
          color_stock?: unknown;
        }>;
        if (!Array.isArray(data)) return;

        const inventory = new Map(data.flatMap((product) =>
          typeof product.slug === "string" ? [[product.slug, product] as const] : []
        ));
        const removed: string[] = [];
        const adjusted: string[] = [];
        let changed = false;

        const next = itemsRef.current.flatMap((item) => {
          const live = inventory.get(item.slug);
          // Static fallback products may not exist in the database. Leave them
          // untouched; the order endpoint still performs the final validation.
          if (!live) return [item];

          const totalStock = Number(live.stock);
          const colorStock = live.color_stock && typeof live.color_stock === "object" && !Array.isArray(live.color_stock)
            ? live.color_stock as Record<string, unknown>
            : null;
          const selectedColorStock = item.color && colorStock && item.color in colorStock
            ? Number(colorStock[item.color])
            : null;
          const available = selectedColorStock !== null && Number.isFinite(selectedColorStock)
            ? Math.min(totalStock, selectedColorStock)
            : totalStock;

          if (Number.isFinite(available) && available <= 0) {
            changed = true;
            removed.push(item.name);
            return [];
          }
          if (Number.isFinite(available) && item.quantity > available) {
            changed = true;
            adjusted.push(item.name);
            return [{ ...item, quantity: Math.max(1, Math.floor(available)) }];
          }
          return [item];
        });

        if (!changed) return;
        itemsRef.current = next;
        setItems(next);
        const messages = [
          removed.length > 0
            ? `${removed.length} article${removed.length > 1 ? "s ont" : " a"} été retiré${removed.length > 1 ? "s" : ""} car ${removed.length > 1 ? "ils sont" : "il est"} épuisé${removed.length > 1 ? "s" : ""}.`
            : "",
          adjusted.length > 0
            ? `La quantité de ${adjusted.length} article${adjusted.length > 1 ? "s" : ""} a été ajustée au stock disponible.`
            : "",
        ].filter(Boolean);
        setInventoryNotice(messages.join(" "));
      } catch {
        // Keep the cart intact while inventory is temporarily unreachable.
        // The order API remains the final authoritative stock check.
      }
    })().finally(() => {
      inventoryRequestRef.current = null;
    });

    inventoryRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    void reconcileInventory();
    const interval = window.setInterval(() => void reconcileInventory(), 120_000);
    const onFocus = () => void reconcileInventory();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void reconcileInventory();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [hydrated, items.length, reconcileInventory]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce((s, i) => s + i.quantity * i.price, 0),
      add: (p, size, qty = 1, color = "", image) =>
        setItems((prev) => {
          const variantImage = resolveProductVariantImage({
            slug: p.slug,
            color,
            fallback: image ?? p.image,
            colors: p.colors,
            images: [p.image, ...p.gallery],
          });
          const idx = prev.findIndex(
            (i) => i.slug === p.slug && i.size === size && i.color === color
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              quantity: next[idx].quantity + qty,
              image: variantImage,
            };
            return next;
          }
          return [
            ...prev,
            {
              slug: p.slug,
              name: p.name,
              image: variantImage,
              price: p.price,
              size,
              color,
              quantity: qty,
            },
          ];
        }),
      remove: (slug, size, color) =>
        setItems((prev) =>
          prev.filter((i) => !(i.slug === slug && i.size === size && i.color === color))
        ),
      setQty: (slug, size, color, qty) =>
        setItems((prev) =>
          prev.map((i) =>
            i.slug === slug && i.size === size && i.color === color
              ? { ...i, quantity: Math.max(1, qty) }
              : i
          )
        ),
      clear: () => setItems([]),
      inventoryNotice,
      dismissInventoryNotice: () => setInventoryNotice(""),
    }),
    [inventoryNotice, items]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
