"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useProductColor } from "./ProductColorContext";
import SizeGuideModal from "./SizeGuideModal";
import type { Product } from "@/lib/products";

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

export default function ProductActions({ product }: { product: Product }) {
  const { color, setColor } = useProductColor();
  const hasColors = product.colors.length > 0 && product.colors[0] !== "Taille unique";
  const hasColorImages = !!(product.colorImages);
  const outOfStockColors = product.outOfStockColors ?? [];
  const availableSizes = ((product.colorSizes && color && product.colorSizes[color])
    ? product.colorSizes[color]
    : product.sizes) ?? [];

  const [size, setSize] = useState<string | null>(
    (product.sizes ?? []).length === 1 && product.sizes[0] === "Taille unique" ? "Taille unique" : null
  );
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const { add } = useCart();
  const router = useRouter();

  // Reset size when color changes if current size is no longer available
  useEffect(() => {
    if (size && !availableSizes.includes(size)) {
      setSize(null);
    }
  }, [color]);

  const isSingleSize = availableSizes.length === 1 && availableSizes[0] === "Taille unique";
  const sizeLabel = getSizeLabel(product.subCategory);
  const isCurrentColorOOS = outOfStockColors.includes(color);

  const handleAdd = (goToCart = false) => {
    if (!size) {
      setError("Veuillez sélectionner une taille.");
      return;
    }
    setError(null);
    add(product, size, 1, color);
    if (goToCart) {
      router.push("/checkout");
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div>
      {/* Color selection modal — bottom sheet */}
      {colorModalOpen && hasColors && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50"
          style={{ backdropFilter: "blur(2px)" }}
          onClick={() => setColorModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-t-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-neutral-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
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
                  const img = product.colorImages?.[c] ?? product.image;
                  return (
                    <button
                      key={c}
                      onClick={() => { if (!isOOS) { setColor(c); setColorModalOpen(false); } }}
                      disabled={isOOS}
                      className={`flex items-center gap-4 w-full text-left rounded-xl px-3 py-3 transition-all border ${
                        isSelected
                          ? "border-black bg-neutral-50"
                          : isOOS
                          ? "border-neutral-100 opacity-50 cursor-not-allowed"
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
              if (hasColorImages && product.colorImages?.[c]) {
                return (
                  <button
                    key={c}
                    title={isOOS ? `${c} — Rupture de stock` : c}
                    onClick={() => { if (!isOOS) setColor(c); }}
                    className={`relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                      isOOS ? "opacity-40 cursor-not-allowed" :
                      isSelected ? "border-black shadow-sm" : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.colorImages![c]} alt={c} className="w-full h-full object-cover" draggable={false} />
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
                  key={c}
                  title={isOOS ? `${c} — Rupture de stock` : c}
                  onClick={() => setColor(c)}
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

      {/* Size selector — hidden for single-size items */}
      {!isSingleSize && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-[12px] uppercase tracking-wide">
              {sizeLabel || "Taille"}
            </span>
            <button
              onClick={() => setSizeGuideOpen(true)}
              className="text-[12px] text-neutral-500 underline underline-offset-4 hover:text-black transition-colors"
            >
              Guide des tailles
            </button>
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
        onClick={() => handleAdd(false)}
        disabled={isCurrentColorOOS}
        className={`mt-5 w-full py-4 font-black uppercase text-[13px] tracking-wider inline-flex items-center justify-center gap-2 transition-all ${
          isCurrentColorOOS
            ? "border-2 border-dashed border-neutral-300 text-neutral-400 cursor-not-allowed bg-white"
            : added
            ? "bg-neutral-800 text-white"
            : "bg-black text-white hover:bg-neutral-800 active:scale-[0.99]"
        }`}
      >
        {isCurrentColorOOS ? (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Couleur indisponible
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
      {isCurrentColorOOS && (
        <p className="text-center text-[11px] text-neutral-400 mt-2">
          Choisissez une autre couleur disponible
        </p>
      )}
      <button
        onClick={() => handleAdd(true)}
        disabled={isCurrentColorOOS}
        className={`mt-2 w-full border py-4 font-black uppercase text-[13px] tracking-wider transition-colors active:scale-[0.99] ${
          isCurrentColorOOS
            ? "hidden"
            : "border-black hover:bg-black hover:text-white"
        }`}
      >
        Acheter maintenant
      </button>

      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        type={
          product.sizeGuideType === "shoes" ? "chaussures"
          : product.sizeGuideType === "clothing" ? "vetements"
          : product.category === "chaussures" ? "chaussures" : "vetements"
        }
        availableSizes={availableSizes}
      />
    </div>
  );
}
