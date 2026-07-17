"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
};

const Ctx = createContext<CartCtx | null>(null);

const KEY = "lecomax_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

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
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

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
    }),
    [items]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
