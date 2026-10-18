"use client";

import PreorderNotice from "./PreorderNotice";
import { preorderCopy } from "@/lib/preorder-copy";
import { selectedInventory, preorderSnapshot } from "@/lib/preorder";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cartStockLimit } from "@/lib/cart-stock-limit";
import { useCart } from "./CartContext";
import { useProductColor } from "./ProductColorContext";
import SizeGuideModal from "./SizeGuideModal";
import SizeSelect from "./SizeSelect";
import { productSizeGuideFromTags } from "@/mobile/src/lib/product-size-guide";
import type { Product } from "@/lib/products";
import { trackAddToCart } from "@/lib/analytics";
import { useWishlist } from "./WishlistContext";
import { collectEvent } from "@/lib/collect";
import { recordProductSignal } from "@/lib/personalization";
import { sortProductSizes } from "@/lib/product-inventory";
import { availableSizesForColor } from "@/mobile/src/lib/purchasability";

/* ── Cart fly animation (pure DOM, Web Animations API) ── */
function celebrateCart(cartEl: HTMLElement | null, x: number, y: number) {
  if (cartEl) {
    cartEl.classList.remove("cart-pulse");
    void cartEl.offsetWidth;
    cartEl.classList.add("cart-pulse");
    setTimeout(() => cartEl.classList.remove("cart-pulse"), 750);
  }

  const ring = document.createElement("span");
  ring.style.cssText = `position:fixed;left:${x - 17}px;top:${y - 17}px;width:34px;height:34px;border:2px solid #3ecf4c;border-radius:999px;z-index:100000;pointer-events:none;`;
  document.body.appendChild(ring);
  ring.animate(
    [{ transform: "scale(.35)", opacity: 0.95 }, { transform: "scale(1.9)", opacity: 0 }],
    { duration: 480, easing: "cubic-bezier(.16,1,.3,1)" }
  ).onfinish = () => ring.remove();

  [0, 60, 120, 180, 240, 300].forEach((angle, index) => {
    const particle = document.createElement("span");
    const radians = angle * Math.PI / 180;
    const distance = 18 + (index % 2) * 7;
    particle.style.cssText = `position:fixed;left:${x - 3}px;top:${y - 3}px;width:6px;height:6px;border-radius:999px;background:${index % 2 ? "#111" : "#3ecf4c"};z-index:100001;pointer-events:none;`;
    document.body.appendChild(particle);
    particle.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${Math.cos(radians) * distance}px,${Math.sin(radians) * distance}px) scale(.15)`, opacity: 0 },
      ],
      { duration: 430, delay: index * 18, easing: "cubic-bezier(.16,1,.3,1)" }
    ).onfinish = () => particle.remove();
  });
}

function flyImageToCart(imgSrc: string, btnEl: HTMLElement) {
  // Pick the visible cart icon (header on desktop, bottom nav on mobile)
  const allCartEls = document.querySelectorAll("[data-cart-icon]");
  const cartEl = Array.from(allCartEls).find((el) => {
    const r = (el as HTMLElement).getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) as HTMLElement | null;

  const from = btnEl.getBoundingClientRect();
  const isMobile = window.innerWidth < 768;

  // Bubble starts centered on the button, already small
  const size = isMobile ? 62 : 72;
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top  + from.height / 2 - size / 2;

  const cartRect = cartEl?.getBoundingClientRect();
  const endCX = cartRect ? cartRect.left + cartRect.width / 2  : (isMobile ? window.innerWidth / 2 : window.innerWidth - 48);
  const endCY = cartRect ? cartRect.top  + cartRect.height / 2 : (isMobile ? window.innerHeight - 40 : 30);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showCartToast();
    return;
  }

  // delta from bubble center to cart center
  const dx = endCX - (startX + size / 2);
  const dy = endCY - (startY + size / 2);

  // Arc midpoint: halfway along path, pulled upward
  const arcLift = Math.min(Math.abs(dx) * 0.18 + 60, 140);
  const midX = dx * 0.48;
  const midY = dy * 0.38 - arcLift;

  btnEl.animate(
    [{ transform: "scale(1)" }, { transform: "scale(.975)" }, { transform: "scale(1)" }],
    { duration: 240, easing: "ease-out" }
  );

  // Flying image bubble
  const fly = document.createElement("div");
  fly.style.cssText = [
    "position:fixed",
    "left:" + startX + "px",
    "top:" + startY + "px",
    "width:" + size + "px",
    "height:" + size + "px",
    "z-index:99999",
    "pointer-events:none",
    "border-radius:18px",
    "overflow:visible",
    "padding:3px",
    "background:#fff",
    "border:2px solid #3ecf4c",
    "box-shadow:0 14px 38px rgba(0,0,0,.28),0 0 0 7px rgba(62,207,76,.16)",
    "will-change:transform,opacity",
  ].join(";");
  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = "";
  img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;border-radius:13px;background:#f5f5f5;";
  img.draggable = false;
  fly.appendChild(img);
  const plus = document.createElement("span");
  plus.textContent = "+1";
  plus.style.cssText = "position:absolute;right:-9px;top:-10px;min-width:27px;height:27px;padding:0 5px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:#3ecf4c;color:#071108;font:900 11px/1 Arial,sans-serif;box-shadow:0 5px 14px rgba(62,207,76,.45);";
  fly.appendChild(plus);
  document.body.appendChild(fly);

  const trails = [0, 1].map((index) => {
    const dot = document.createElement("span");
    dot.style.cssText = `position:fixed;left:${startX + size / 2 - 5}px;top:${startY + size / 2 - 5}px;width:10px;height:10px;border-radius:999px;background:#3ecf4c;z-index:99998;pointer-events:none;filter:blur(${index ? 1 : 0}px);will-change:transform,opacity;`;
    document.body.appendChild(dot);
    dot.animate(
      [
        { transform: "translate(0,0) scale(.6)", opacity: 0 },
        { transform: `translate(${midX}px,${midY}px) scale(1)`, opacity: 0.5, offset: 0.48 },
        { transform: `translate(${dx}px,${dy}px) scale(.15)`, opacity: 0 },
      ],
      { duration: isMobile ? 760 : 860, delay: 90 + index * 75, easing: "cubic-bezier(.22,.75,.25,1)", fill: "forwards" }
    ).onfinish = () => dot.remove();
    return dot;
  });

  // Web Animations API — curved arc path
  const anim = fly.animate(
    [
      { transform: "translate(0,0) rotate(-4deg) scale(.2)", opacity: "0", offset: 0 },
      { transform: "translate(0,0) rotate(0deg) scale(1.08)", opacity: "1", offset: 0.12 },
      { transform: `translate(${midX}px,${midY}px) rotate(8deg) scale(.88)`, opacity: "1", offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) rotate(15deg) scale(.16)`, opacity: "0.7", offset: 0.94 },
      { transform: `translate(${dx}px,${dy}px) rotate(15deg) scale(.05)`, opacity: "0", offset: 1 },
    ],
    { duration: isMobile ? 760 : 860, easing: "cubic-bezier(.22,.75,.25,1)", fill: "forwards" }
  );

  anim.onfinish = () => {
    fly.remove();
    trails.forEach((trail) => trail.remove());
    celebrateCart(cartEl, endCX, endCY);
    showCartToast();
  };
}

function showCartToast() {
  const existing = document.getElementById("__cart_toast__");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "__cart_toast__";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.setAttribute("aria-atomic", "true");
  const isMobileToast = window.innerWidth < 768;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toastBottom = isMobileToast ? "calc(66px + env(safe-area-inset-bottom, 0px) + 10px)" : "28px";
  toast.style.cssText = [
    "position:fixed",
    "bottom:" + toastBottom,
    "left:50%",
    reducedMotion ? "transform:translateX(-50%)" : "transform:translateX(-50%) translateY(16px)",
    "opacity:0",
    reducedMotion ? "transition:none" : "transition:transform 0.4s cubic-bezier(0.22,1,0.36,1),opacity 0.4s ease",
    "z-index:99998",
    "pointer-events:none",
    "background:#fff",
    "color:#203d2b",
    "border-radius:18px",
    "border:1px solid #dce7d7",
    "width:360px",
    "padding:16px 18px",
    "max-width:calc(100vw - 32px)",
    "display:flex",
    "align-items:center",
    "gap:12px",
    "font-size:13px",
    "font-weight:700",
    "letter-spacing:-0.01em",
    "line-height:1.45",
    "box-shadow:0 8px 32px rgba(24,60,48,0.14)",
    "box-sizing:border-box",
    "font-family:inherit",
  ].join(";");
  toast.innerHTML =
    '<span aria-hidden="true" style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:#eaf4e5;color:#2f633d;flex-shrink:0">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
    '</span><span style="min-width:0">' +
    '<strong style="display:block;font-size:15px;font-weight:600">Article ajout&eacute; au panier</strong>' +
    '<span style="display:block;margin-top:4px;font-size:12px;font-weight:400;color:#5c7062">Retrouvez-le dans votre panier.</span></span>';
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = reducedMotion ? "translateX(-50%)" : "translateX(-50%) translateY(16px)";
    setTimeout(() => toast.remove(), 400);
  }, 3400);
}

const colorMap: Record<string, string> = {
  "Noir": "#0a0a0a", "Blanc": "#f5f5f5", "Blanc casse": "#fafaf5",
  "Édition Standard": "#1a1a2e",
  "Gris": "#9ca3af", "Gris chine": "#d1d5db", "Gris fonce": "#4b5563",
  "Gris anthracite": "#374151", "Bleu": "#3b82f6", "Bleu marine": "#1e3a5f",
  "Bleu nuit": "#1e2a4a", "Bleu ciel": "#7dd3fc", "Navy": "#1e3a5f",
  "Rouge": "#dc2626", "Bordeaux": "#7c1035", "Rose": "#f9a8d4",
  "Rose poudre": "#fcd5ce", "Corail": "#fb7185", "Vert": "#22c55e",
  "Vert militaire": "#4a5c3a", "Vert sauge": "#7c9a6f", "Kaki": "#8b7355",
  "Caramel": "#d4a574", "Beige": "#f5f0e8", "Champagne": "#f7e7ce",
  "Lilas": "#c4b5fd", "Mauve": "#a78bfa", "Violet": "#8b5cf6",
  "Marine": "#1e3a5f", "Jaune": "#facc15", "Doré": "#c9a84c",
};
const getColorHex = (name: string) =>
  colorMap[name.split("/")[0].trim()] ?? "#e5e7eb";
const getSwatchStyle = (name: string): React.CSSProperties => {
  const parts = name.split("/").map((p) => p.trim());
  if (parts.length >= 2) {
    const c1 = colorMap[parts[0]] ?? "#e5e7eb";
    const c2 = colorMap[parts[1]] ?? "#e5e7eb";
    return { background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` };
  }
  return { backgroundColor: colorMap[parts[0]] ?? "#e5e7eb" };
};

function getSizeLabel(subCategory: string): string {
  const sub = subCategory.toLowerCase();
  if (sub === "running" || sub === "lifestyle" || sub.includes("sneaker") || sub.includes("chaussure") || sub.includes("basket")) return "Pointure";
  if (sub === "taille unique" || sub === "audio" || sub === "gaming" || sub === "tech") return null as unknown as string;
  return "Taille";
}

export default function ProductActions({
  product,
  colorImages: colorImagesProp,
  colorImageGalleries,
}: {
  product: Product;
  colorImages?: Record<string, string>;
  colorImageGalleries?: Record<string, string[]>;
}) {
  const { color, setColor } = useProductColor();
  const hasColors = product.colors.length > 0 && product.colors[0] !== "Taille unique";
  const effectiveColorImages = React.useMemo(() => {
    const productImages = [product.image, ...(product.gallery || [])].filter(Boolean);
    return Object.fromEntries(product.colors.map((variantColor, index) => {
      const image = colorImageGalleries?.[variantColor]?.[0]
        ?? colorImagesProp?.[variantColor]
        ?? product.colorImages?.[variantColor]
        ?? (product as any).color_images?.[variantColor]
        ?? productImages[index]
        ?? productImages[0]
        ?? product.image;
      return [variantColor, image];
    }));
  }, [colorImageGalleries, colorImagesProp, product.colorImages, product.colors, product.gallery, product.image]);
  const hasColorImages = Object.keys(effectiveColorImages).length > 0;
  const outOfStockColors = product.outOfStockColors ?? [];
  const colorSizeStock = product.colorSizeStock ?? {};
  const hasColorSizeStock = Object.keys(colorSizeStock).length > 0;
  const isProductOOS = product.stock !== undefined && product.stock <= 0;
  const isCurrentColorOOS = outOfStockColors.includes(color) || (hasColorSizeStock && color && !Object.values(colorSizeStock[color] ?? {}).some((quantity) => quantity > 0));

  const [size, setSize] = useState<string | null>(
    (product.sizes ?? []).length === 1 && product.sizes[0] === "Taille unique" ? "Taille unique" : null
  );

  // Fire view_item once when product page mounts
  useEffect(() => {
    recordProductSignal(product, 3);
    collectEvent("product_view", {
      path: window.location.pathname,
      product_id: product.slug,
      product_name: product.name,
      category: product.category,
      extra: { price: product.price },
    });
    import("@/lib/analytics").then(({ trackViewItem }) => {
      trackViewItem({
        item_id: product.slug,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const sizeGuideIntentRef = React.useRef(false);
  const { add, items } = useCart();
  const { slugs: wishlistSlugs, pending: wishlistPending, toggle: toggleWishlist } = useWishlist();
  const wished = wishlistSlugs.has(product.slug);
  const router = useRouter();
  const selectedPrice = product.colorPrices?.[color]?.price ?? product.price;

  const selectColor = (
    nextColor: string,
    closeModal = false,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    sizeGuideIntentRef.current = false;
    setSizeGuideOpen(false);
    setColor(nextColor);
    if (closeModal) setColorModalOpen(false);
  };

  // Pre-orders retain only real configured variant combinations.
  const availableSizes = availableSizesForColor({
    ...product,
    color_sizes: product.colorSizes,
    out_of_stock_colors: product.outOfStockColors,
    out_of_stock_sizes: product.outOfStockSizes,
  }, color || undefined);
  const selectedStock = selectedInventory(product, color || undefined, size || undefined);
  const preorder = preorderSnapshot(product, selectedStock);

  // Reset size when color changes if current size is no longer available
  useEffect(() => {
    if (size && !availableSizes.includes(size)) {
      setSize(null);
    }
  }, [color]);

  const isSingleSize = availableSizes.length === 1 && availableSizes[0] === "Taille unique";
  const sizeLabel = getSizeLabel(product.subCategory);
  const hasNoAvailableSize = product.sizes.length > 0 && availableSizes.length === 0;
  const isUnavailable = Boolean(hasNoAvailableSize || (!product.preorder_enabled && (isProductOOS || isCurrentColorOOS)));
  const orderedSizes = sortProductSizes(product.sizes);

  const openSizeGuide = (event: React.MouseEvent<HTMLButtonElement>) => {
    // A real tap sends pointerdown before click. Requiring that intent keeps
    // mobile browsers from retargeting a color-selection tap to this button.
    const openedWithKeyboard = event.detail === 0;
    if (!openedWithKeyboard && !sizeGuideIntentRef.current) return;
    sizeGuideIntentRef.current = false;
    setSizeGuideOpen(true);
  };

  const handleAdd = (goToCart = false, btnEl?: HTMLElement) => {
    if (isUnavailable || (size && (selectedStock < 0 || (!product.preorder_enabled && selectedStock < 1)))) {
      setError("Ce produit est actuellement indisponible.");
      return;
    }
    if (product.sizes.length > 0 && !size) {
      setError("Veuillez sélectionner une taille.");
      return;
    }
    if (selectedStock < 0 || (!product.preorder_enabled && selectedStock < 1)) {
      setError(preorderCopy.fr.unavailable);
      return;
    }
    const inCart = items.find(item => item.slug === product.slug && item.size === (size ?? "") && item.color === color)?.quantity ?? 0;
    const limit = cartStockLimit(selectedStock, product.preorder_enabled);
    if (inCart >= limit) {
      setError(`Quantité maximale atteinte : ${limit} article${limit > 1 ? "s" : ""}. Vous avez déjà cette quantité dans votre panier.`);
      return;
    }
    setError(null);
    const colorImg = effectiveColorImages?.[color] ?? product.image;
    add({ ...product, price: selectedPrice, oldPrice: product.colorPrices?.[color]?.originalPrice ?? product.oldPrice }, size ?? "", 1, color, colorImg);
    trackAddToCart({
      item_id: product.slug,
      item_name: product.name,
      item_category: product.category,
      price: selectedPrice,
      quantity: 1,
      item_variant: [color, size].filter(Boolean).join(" / ") || undefined,
    });
    recordProductSignal(product, 8);
    collectEvent("cart_add", {
      path: window.location.pathname,
      product_id: product.slug,
      product_name: product.name,
      category: product.category,
      extra: { price: selectedPrice, quantity: 1, color, size },
    });
    if (goToCart) {
      router.push("/checkout");
    } else {
      const imgSrc = effectiveColorImages?.[color] ?? product.image;
      setAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 3400);
      if (btnEl && typeof btnEl.animate === "function") {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          btnEl.animate(
            [{ transform: "scale(1)" }, { transform: "scale(.97)", offset: .3 }, { transform: "scale(1.015)", offset: .65 }, { transform: "scale(1)" }],
            { duration: 420, easing: "ease-out" },
          );
        }
        flyImageToCart(imgSrc, btnEl);
      } else {
        showCartToast();
      }
    }
  };

  return (
    <div>
      {/* Color selection modal — bottom sheet */}
      {colorModalOpen && hasColors && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
          style={{ backdropFilter: "blur(2px)" }}
          onClick={() => setColorModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <p className="font-bold text-[16px] tracking-tight">Couleur</p>
                <span className="text-[13px] text-neutral-400">· {product.colors.length} options</span>
              </div>
              <button
                onClick={() => setColorModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Color list */}
            <div className="overflow-y-auto pb-6 px-4" style={{ maxHeight: "calc(85vh - 90px)" }}>
              <div className="flex flex-col gap-2">
                {product.colors.map((c) => {
                  const isSelected = color === c;
                  const isOOS = !product.preorder_enabled && outOfStockColors.includes(c);
                  const img = effectiveColorImages?.[c] ?? product.image;
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={(event) => selectColor(c, true, event)}
                      aria-label={`Sélectionner la couleur ${c}`}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-4 w-full text-left rounded-xl px-3 py-3 transition-all border ${
                        isSelected
                          ? "border-black bg-neutral-50"
                          : isOOS
                          ? "border-neutral-100 opacity-50 hover:border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                          : "border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer"
                      }`}
                    >
                      {/* Product image */}
                      <div className="relative flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden bg-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={c}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        {isOOS && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-neutral-400 bg-white/90 px-1.5 py-0.5 rounded">Épuisé</span>
                          </div>
                        )}
                      </div>

                      {/* Color info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-semibold truncate ${isSelected ? "text-black" : "text-neutral-700"}`}>{c}</p>
                        {isOOS
                          ? <p className="text-[12px] text-neutral-400 mt-0.5">Rupture de stock</p>
                          : <p className="text-[12px] font-bold text-neutral-700 mt-0.5">{product.colorPrices?.[c]?.price ?? product.price} MAD</p>
                        }
                      </div>

                      {/* Selection indicator */}
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-black border-black" : "border-neutral-300"
                      }`}>
                        {isSelected && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color picker */}
      {hasColors && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] uppercase leading-5">
              <span className="font-extrabold text-black">Couleur</span>
              <span className="font-normal text-neutral-500"> · {color}</span>
            </p>
            <button
              type="button"
              data-color-modal-trigger
              onClick={() => setColorModalOpen(true)}
              className="flex items-center gap-1.5 text-[12px] text-[#5f6368] hover:text-black transition-colors font-medium"
            >
              <span>Voir tout</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div role="group" aria-label="Couleur" className="flex flex-wrap items-start gap-x-3 gap-y-4 p-0.5">
            {product.colors.map((c) => {
              const isSelected = color === c;
              const isOOS = !product.preorder_enabled && outOfStockColors.includes(c);
              const variantImg = effectiveColorImages?.[c] || product.image;

              return (
                <button
                  type="button"
                  key={c}
                  title={isOOS ? `${c} — Rupture de stock` : c}
                  onClick={(event) => selectColor(c, false, event)}
                  aria-label={`Sélectionner la couleur ${c}`}
                  aria-pressed={isSelected}
                  className="group flex w-16 flex-shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735] focus-visible:ring-offset-4"
                >
                  <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 bg-white transition-all shadow-sm ${
                    isSelected ? "border-[#234735] ring-2 ring-[#234735]/20 shadow-md scale-[1.03]" :
                    isOOS ? "opacity-40 border-neutral-200" :
                    "border-neutral-200 hover:border-neutral-400"
                  }`}>
                    {variantImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={variantImg} alt={c} className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center" style={getSwatchStyle(c)} />
                    )}

                    {isSelected && (
                      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#234735] text-white flex items-center justify-center shadow">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}

                    {isOOS && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="text-[9px] font-extrabold text-neutral-500 bg-white/90 px-1 py-0.5 rounded">Épuisé</span>
                      </div>
                    )}
                  </div>
                  <span className={`w-full break-words text-center text-[12px] leading-4 ${isSelected ? "font-extrabold text-black" : "font-semibold text-neutral-600 group-hover:text-black"}`}>
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size picker */}
      {product.sizes.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3 mt-6">
            <span className="font-extrabold text-[12px] uppercase tracking-[0.12em] text-neutral-900">
              {sizeLabel || "Taille"}
            </span>
            {(product.category === "homme" || product.category === "femme" || product.category === "chaussures") && (
              <button
                type="button"
                onPointerDown={() => { sizeGuideIntentRef.current = true; }}
                onPointerCancel={() => { sizeGuideIntentRef.current = false; }}
                onClick={openSizeGuide}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md text-[12px] font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[#234735] hover:decoration-[#234735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735] focus-visible:ring-offset-2"
              >
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 7v4m5-4v6m5-6v4"/></svg>
                Guide des tailles
              </button>
            )}
          </div>
          <SizeSelect
            key={`${product.slug}-${color}`}
            sizes={orderedSizes}
            availableSizes={availableSizes}
            value={size}
            label={sizeLabel || "Taille"}
            onChange={(nextSize) => { setSize(nextSize); setError(null); }}
          />
          {error && (
            <p className="text-red-600 text-[12px] mt-2 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </p>
          )}
        </>
      )}

      <PreorderNotice item={preorder} />
      {product.preorder_enabled && <p className="text-xs text-neutral-500">{preorderCopy.fr.quantity}</p>}
      <button
        onClick={(e) => handleAdd(false, e.currentTarget)}
        disabled={isUnavailable}
        className={`mt-5 w-full py-4 font-black uppercase text-[13px] tracking-wider inline-flex items-center justify-center gap-2 transition-all ${
          isUnavailable
            ? "border-2 border-dashed border-neutral-300 text-neutral-400 cursor-not-allowed bg-white"
            : added
            ? "bg-emerald-700 text-white"
            : "bg-black text-white hover:bg-neutral-800 active:scale-[0.99]"
        }`}
      >
        {isUnavailable ? (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {isProductOOS ? "Produit épuisé" : isCurrentColorOOS ? "Couleur indisponible" : "Taille indisponible"}
          </>
        ) : added ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Merci ! Ajouté au panier
          </>
        ) : (
          <>
            {preorder.fulfillment_type === "PREORDER" ? preorderCopy.fr.action : "Ajouter au panier"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </>
        )}
      </button>
      {isUnavailable && (
        <p className="text-center text-[11px] text-neutral-400 mt-2">
          {isProductOOS ? "Ce produit sera bientôt de retour" : isCurrentColorOOS ? "Choisissez une autre couleur disponible" : "Aucune taille n’est disponible"}
        </p>
      )}
      <button
        onClick={() => handleAdd(true)}
        disabled={isUnavailable}
        className={`mt-2 w-full border py-4 font-black uppercase text-[13px] tracking-wider transition-colors active:scale-[0.99] ${
          isUnavailable
            ? "hidden"
            : "border-black hover:bg-black hover:text-white"
        }`}
      >
        {preorder.fulfillment_type === "PREORDER" ? preorderCopy.fr.action : "Acheter maintenant"}
      </button>
      <button
        type="button"
        onClick={() => void toggleWishlist(product.slug)}
        disabled={wishlistPending.has(product.slug)}
        aria-pressed={wished}
        className={`mt-2 w-full border py-3.5 font-black uppercase text-[11px] tracking-[0.14em] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60 ${wished ? "border-rose-200 bg-rose-50 text-rose-600" : "border-neutral-200 bg-white text-neutral-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8a5.5 5.5 0 0 0 1-7.8Z"/></svg>
        {wished ? "Enregistré dans mes favoris" : "Ajouter aux favoris"}
      </button>

      {/* Payment methods */}
      <div className="mt-4 pt-4 border-t border-neutral-100">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-3 text-center">Paiement sécurisé</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Cash on delivery */}
          <span className="inline-flex items-center gap-1 border border-neutral-200 px-2.5 py-1.5 text-[10px] font-bold text-neutral-600 rounded-md">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            À la livraison
          </span>
          {/* PayPal */}
          <span className="inline-flex items-center gap-1 border border-neutral-200 px-2.5 py-1.5 text-[10px] font-bold rounded-md" style={{ color: "#003087" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788l.038-.19.734-4.653.047-.257a.933.933 0 0 1 .92-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.78-4.461z"/></svg>
            PayPal
          </span>
          {/* Visa */}
          <span className="inline-flex items-center border border-neutral-200 px-2.5 py-1.5 text-[10px] font-black rounded-md" style={{ color: "#1A1F71" }}>VISA</span>
          {/* Mastercard */}
          <span className="inline-flex items-center gap-0.5 border border-neutral-200 px-2.5 py-1.5 rounded-md">
            <span className="w-4 h-4 rounded-full opacity-90" style={{ background: "#EB001B" }} />
            <span className="w-4 h-4 rounded-full opacity-90 -ml-2" style={{ background: "#F79E1B" }} />
          </span>
        </div>
      </div>

      {sizeGuideOpen && (
        <SizeGuideModal
          customGuide={productSizeGuideFromTags(product.tags)}
          open
          onClose={() => {
            sizeGuideIntentRef.current = false;
            setSizeGuideOpen(false);
          }}
          type={
            product.sizeGuideType === "shoes" ? "chaussures"
            : product.sizeGuideType === "clothing" ? "vetements"
            : product.category === "chaussures" ? "chaussures" : "vetements"
          }
          availableSizes={availableSizes}
          selectedSize={size ?? undefined}
        />
      )}
    </div>
  );
}
