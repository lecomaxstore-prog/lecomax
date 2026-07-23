"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useProductColor } from "./ProductColorContext";
import SizeGuideModal from "./SizeGuideModal";
import type { Product } from "@/lib/products";
import { trackAddToCart } from "@/lib/analytics";
import { useWishlist } from "./WishlistContext";
import { collectEvent } from "@/lib/collect";
import { recordProductSignal } from "@/lib/personalization";

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
  const isMobileToast = window.innerWidth < 768;
  const toastBottom = isMobileToast ? "calc(66px + env(safe-area-inset-bottom, 0px) + 10px)" : "28px";
  toast.style.cssText = [
    "position:fixed",
    "bottom:" + toastBottom,
    "left:50%",
    "transform:translateX(-50%) translateY(16px)",
    "opacity:0",
    "transition:transform 0.4s cubic-bezier(0.22,1,0.36,1),opacity 0.4s ease",
    "z-index:99998",
    "pointer-events:none",
    "background:#111",
    "color:#fff",
    "border-radius:14px",
    "padding:11px 18px",
    "display:flex",
    "align-items:center",
    "gap:9px",
    "font-size:13px",
    "font-weight:700",
    "letter-spacing:0.01em",
    "box-shadow:0 8px 32px rgba(0,0,0,0.22)",
    "white-space:nowrap",
    "font-family:inherit",
  ].join(";");
  toast.innerHTML =
    '<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#3ecf4c;flex-shrink:0">' +
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
    "</span>" +
    "Produit ajout\u00e9 au panier";
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(16px)";
    setTimeout(() => toast.remove(), 400);
  }, 2600);
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

export default function ProductActions({ product, colorImages: colorImagesProp }: { product: Product; colorImages?: Record<string, string> }) {
  const { color, setColor } = useProductColor();
  const hasColors = product.colors.length > 0 && product.colors[0] !== "Taille unique";
  const effectiveColorImages = colorImagesProp ?? product.colorImages;
  const hasColorImages = !!(effectiveColorImages);
  const outOfStockColors = product.outOfStockColors ?? [];
  const outOfStockSizes = product.outOfStockSizes ?? [];
  const isProductOOS = product.stock !== undefined && product.stock <= 0;
  const isCurrentColorOOS = outOfStockColors.includes(color);
  const availableSizes = ((isProductOOS || isCurrentColorOOS) ? [] : (((product.colorSizes && color && product.colorSizes[color])
    ? product.colorSizes[color]
    : product.sizes) ?? []).filter((s) => !outOfStockSizes.includes(s)));

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
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const sizeGuideIntentRef = React.useRef(false);
  const { add } = useCart();
  const { slugs: wishlistSlugs, pending: wishlistPending, toggle: toggleWishlist } = useWishlist();
  const wished = wishlistSlugs.has(product.slug);
  const router = useRouter();

  const selectColorAndRevealImage = (
    nextColor: string,
    closeModal = false,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    // Color selection and the size guide are independent actions. Keeping
    // this explicit also prevents a mobile tap from leaving the guide open.
    sizeGuideIntentRef.current = false;
    setSizeGuideOpen(false);
    setColor(nextColor);
    if (closeModal) setColorModalOpen(false);

    // Let React switch the gallery image first, then bring that image back
    // into view. This also works when the customer taps the active color.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const galleryImage = document.querySelector<HTMLElement>("[data-main-gallery-img]");
        if (!galleryImage) return;

        const headerOffset = window.innerWidth < 768 ? 72 : 92;
        const top = galleryImage.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    });
  };

  // Reset size when color changes if current size is no longer available
  useEffect(() => {
    if (size && !availableSizes.includes(size)) {
      setSize(null);
    }
  }, [color]);

  const isSingleSize = availableSizes.length === 1 && availableSizes[0] === "Taille unique";
  const sizeLabel = getSizeLabel(product.subCategory);
  const hasNoAvailableSize = product.sizes.length > 0 && availableSizes.length === 0;
  const isUnavailable = isProductOOS || isCurrentColorOOS || hasNoAvailableSize;

  const openSizeGuide = (event: React.MouseEvent<HTMLButtonElement>) => {
    // A real tap sends pointerdown before click. Requiring that intent keeps
    // mobile browsers from retargeting a color-selection tap to this button.
    const openedWithKeyboard = event.detail === 0;
    if (!openedWithKeyboard && !sizeGuideIntentRef.current) return;
    sizeGuideIntentRef.current = false;
    setSizeGuideOpen(true);
  };

  const handleAdd = (goToCart = false, btnEl?: HTMLElement) => {
    if (isUnavailable) {
      setError("Ce produit est actuellement indisponible.");
      return;
    }
    if (!size) {
      setError("Veuillez sélectionner une taille.");
      return;
    }
    setError(null);
    const colorImg = effectiveColorImages?.[color] ?? product.image;
    add(product, size, 1, color, colorImg);
    trackAddToCart({
      item_id: product.slug,
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: 1,
      item_variant: [color, size].filter(Boolean).join(" / ") || undefined,
    });
    recordProductSignal(product, 8);
    collectEvent("cart_add", {
      path: window.location.pathname,
      product_id: product.slug,
      product_name: product.name,
      category: product.category,
      extra: { price: product.price, quantity: 1, color, size },
    });
    if (goToCart) {
      router.push("/checkout");
    } else {
      const imgSrc = effectiveColorImages?.[color] ?? product.image;
      if (btnEl) flyImageToCart(imgSrc, btnEl);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
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
                  const isOOS = outOfStockColors.includes(c);
                  const img = effectiveColorImages?.[c] ?? product.image;
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={(event) => selectColorAndRevealImage(c, true, event)}
                      aria-label={`Voir le produit en couleur ${c}`}
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
                          : <p className="text-[12px] text-neutral-400 mt-0.5">{product.price} MAD</p>
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
            <p className="text-[12px] font-black uppercase tracking-wide">Couleur</p>
            <button
              onClick={() => setColorModalOpen(true)}
              className="flex items-center gap-1.5 text-[12px] text-neutral-600 hover:text-black transition-colors font-medium"
            >
              <span
                className="inline-block w-3 h-3 rounded-full border border-neutral-300"
                style={getSwatchStyle(color)}
              />
              <span>{color}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => {
              const isSelected = color === c;
              const isOOS = outOfStockColors.includes(c);
              const hex = getColorHex(c);
              const isLight = ["#f5f5f5","#fafaf5","#d1d5db","#fcd5ce","#f9a8d4","#f5f0e8","#f7e7ce","#fef08a","#c4b5fd","#7dd3fc"].includes(hex);

              // If product has color images, show small image swatches instead of color dots
              if (hasColorImages && effectiveColorImages?.[c]) {
                return (
                  <button
                    type="button"
                    key={c}
                    title={isOOS ? `${c} — Rupture de stock` : c}
                    onClick={(event) => selectColorAndRevealImage(c, false, event)}
                    aria-label={`Voir le produit en couleur ${c}`}
                    className={`relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                      isOOS ? "opacity-50 cursor-pointer" :
                      isSelected ? "border-black shadow-sm" : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={effectiveColorImages![c]} alt={c} className="w-full h-full object-cover" draggable={false} />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  key={c}
                  title={isOOS ? `${c} — Rupture de stock` : c}
                  onClick={(event) => selectColorAndRevealImage(c, false, event)}
                  aria-label={`Voir le produit en couleur ${c}`}
                  className="relative group flex-shrink-0 transition-transform duration-150"
                  style={{ transform: isSelected ? "scale(1.08)" : "scale(1)", cursor: "pointer" }}
                >
                  <span
                    className={`flex w-10 h-10 rounded-full transition-all duration-200 ${
                      isOOS ? "ring-1 ring-neutral-200 opacity-40" :
                      isSelected ? "ring-2 ring-offset-2 ring-[#3ecf4c] shadow-md" :
                      "ring-1 ring-neutral-200 hover:ring-neutral-400 hover:ring-offset-1"
                    }`}
                    style={{ ...getSwatchStyle(c), border: isLight ? "1px solid #d4d4d4" : "none" }}
                  >
                    {isSelected && !isOOS && (
                      <svg className="m-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isLight ? "#000" : "#fff"} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                    {isOOS && (
                      <svg className="m-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                  </span>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                    {isOOS ? `${c} — Rupture` : c}
                  </span>
                </button>
              );
            })}
          </div>

          {/* "See all colors" button when there are many colors or color images */}
          {(product.colors.length > 4 || hasColorImages) && (
            <button
              onClick={() => setColorModalOpen(true)}
              className="mt-3 flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-black transition-colors font-medium group"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg>
              <span className="group-hover:underline underline-offset-2">Voir tous les coloris</span>
            </button>
          )}
        </div>
      )}

      {/* Size selector — hidden for single-size items and accessory-only products */}
      {!isSingleSize && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-[12px] uppercase tracking-wide">
              {sizeLabel || "Taille"}
            </span>
            {(product.category === "homme" || product.category === "femme" || product.category === "chaussures") && (
              <button
                type="button"
                onPointerDown={() => { sizeGuideIntentRef.current = true; }}
                onPointerCancel={() => { sizeGuideIntentRef.current = false; }}
                onClick={openSizeGuide}
                className="text-[12px] text-neutral-500 underline underline-offset-4 hover:text-black transition-colors"
              >
                Guide des tailles
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.sizes.map((s) => {
              const soldOut = !availableSizes.includes(s);
              return (
                <button
                  key={s}
                  disabled={soldOut}
                  onClick={() => { if (!soldOut) { setSize(s); setError(null); } }}
                  className={`relative border py-3 text-[13px] font-bold transition-colors ${
                    soldOut
                      ? "border-neutral-200 text-neutral-300 cursor-not-allowed"
                      : size === s
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 hover:border-black"
                  }`}
                >
                  {s}
                  {soldOut && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="block w-full h-px bg-neutral-300 rotate-[-35deg]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {error && (
            <p className="text-red-600 text-[12px] mt-2 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </p>
          )}
        </>
      )}

      <button
        onClick={(e) => handleAdd(false, e.currentTarget)}
        disabled={isUnavailable}
        className={`mt-5 w-full py-4 font-black uppercase text-[13px] tracking-wider inline-flex items-center justify-center gap-2 transition-all ${
          isUnavailable
            ? "border-2 border-dashed border-neutral-300 text-neutral-400 cursor-not-allowed bg-white"
            : added
            ? "bg-neutral-800 text-white"
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
            Ajouté au panier
          </>
        ) : (
          <>
            Ajouter au panier
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
        Acheter maintenant
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
