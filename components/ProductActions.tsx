"use client";

import { useState, useEffect } from "react";
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
  "Marine": "#1e3a5f", "Jaune": "#facc15",
};
const getColorHex = (name: string) =>
  colorMap[name.split("/")[0].trim()] ?? "#e5e7eb";

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
  const availableSizes = ((product.colorSizes && color && product.colorSizes[color])
    ? product.colorSizes[color]
    : product.sizes) ?? [];

  const [size, setSize] = useState<string | null>(
    (product.sizes ?? []).length === 1 && product.sizes[0] === "Taille unique" ? "Taille unique" : null
  );
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
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
      {/* Color picker — above size selector */}
      {hasColors && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-black uppercase tracking-wide">
              Couleur
            </p>
            <span className="text-[12px] text-neutral-500 font-medium">{color}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => {
              const isSelected = color === c;
              const hex = getColorHex(c);
              const isLight = ["#f5f5f5","#fafaf5","#d1d5db","#fcd5ce","#f9a8d4","#f5f0e8","#f7e7ce","#fef08a","#c4b5fd","#7dd3fc"].includes(hex);
              return (
                <button
                  key={c}
                  title={c}
                  onClick={() => setColor(c)}
                  className="relative group flex-shrink-0 transition-transform duration-150"
                  style={{ transform: isSelected ? "scale(1.08)" : "scale(1)" }}
                >
                  {/* Swatch */}
                  <span
                    className={`flex w-10 h-10 rounded-full transition-all duration-200 ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-[#3ecf4c] shadow-md"
                        : "ring-1 ring-neutral-200 hover:ring-neutral-400 hover:ring-offset-1"
                    }`}
                    style={{ backgroundColor: hex, border: isLight ? "1px solid #d4d4d4" : "none" }}
                  >
                    {/* Checkmark for selected */}
                    {isSelected && (
                      <svg className="m-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isLight ? "#000" : "#fff"} strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                  {/* Tooltip */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
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
        className={`mt-5 w-full py-4 font-black uppercase text-[13px] tracking-wider inline-flex items-center justify-center gap-2 transition-all ${
          added
            ? "bg-neutral-800 text-white"
            : "bg-black text-white hover:bg-neutral-800 active:scale-[0.99]"
        }`}
      >
        {added ? (
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
      <button
        onClick={() => handleAdd(true)}
        className="mt-2 w-full border border-black py-4 font-black uppercase text-[13px] tracking-wider hover:bg-black hover:text-white transition-colors active:scale-[0.99]"
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
