"use client";
import { DEFAULT_SHOE_GUIDE, completeShoeGuide, normalizeShoeSize } from "@/lib/shoe-size-guide";

import { useEffect, useRef, useState } from "react";

type ClothingRow = { label: string; fr: string; poitrine: string; taille: string };
type ShoeRow = { eu: string; us: string; uk: string; cm: string };

const DEFAULT_SHOES = DEFAULT_SHOE_GUIDE;

const DEFAULT_CLOTHING: ClothingRow[] = [
  { label: "XS",  fr: "34-36", poitrine: "82-86",   taille: "62-66" },
  { label: "S",   fr: "36-38", poitrine: "86-90",   taille: "66-70" },
  { label: "M",   fr: "38-40", poitrine: "90-94",   taille: "70-74" },
  { label: "L",   fr: "40-42", poitrine: "94-98",   taille: "74-78" },
  { label: "XL",  fr: "42-44", poitrine: "98-104",  taille: "78-84" },
  { label: "XXL", fr: "44-46", poitrine: "104-110", taille: "84-90" },
];

export default function SizeGuideModal({
  open,
  onClose,
  type = "chaussures",
  availableSizes = [],
  selectedSize,
}: {
  open: boolean;
  onClose: () => void;
  type?: "chaussures" | "vetements";
  availableSizes?: string[];
  selectedSize?: string;
}) {
  const [shoesSizes, setShoesSizes]       = useState<ShoeRow[]>(DEFAULT_SHOES);
  const [clothingSizes, setClothingSizes] = useState<ClothingRow[]>(DEFAULT_CLOTHING);
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  // Auto-scroll to selected size when modal opens
  useEffect(() => {
    if (!open || !selectedSize) return;
    const timeout = setTimeout(() => {
      selectedRowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 320); // after drawer slide-in
    return () => clearTimeout(timeout);
  }, [open, selectedSize, shoesSizes]);
  useEffect(() => {
    if (!open) return;
    fetch("/api/size-guide")
      .then((r) => r.json())
      .then((data) => {
        if (data.shoes?.length)    setShoesSizes(data.shoes);
        if (data.clothing?.length) setClothingSizes(data.clothing);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Guide des tailles"
        className={`fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-neutral-100">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-0.5">L&apos;ecomax</p>
            <h2 className="font-black text-xl">Guide des tailles</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* How to measure */}
          <div className="px-6 pt-6 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
              Comment se mesurer
            </p>

            {type === "chaussures" ? (
              <div className="flex gap-4 bg-neutral-50 rounded-2xl p-4 items-center">
                <div className="w-14 h-14 flex-shrink-0 bg-black rounded-xl flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    <path d="M4 22c0-3 2-5 5-5h4l4-7h7c2.5 0 4 1.5 4 4 0 4-2.5 8-8 8H4z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5"/>
                    <path d="M4 22h20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9 17v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M13 15v7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M17 13v9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm">Longueur du pied</p>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Posez le pied sur une feuille, tracez le contour.
                    Mesurez du talon à l&apos;orteil le plus long.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    label: "Tour de poitrine",
                    desc: "Mesurez à l'endroit le plus fort, le mètre ruban bien horizontal sous les bras.",
                    icon: (
                      <path d="M8 10c0-2 1.5-4 4-4s4 2 4 4v2H8v-2z M6 12h20M8 16c0 3 1.5 5 4 5h8c2.5 0 4-2 4-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    ),
                  },
                  {
                    label: "Tour de taille",
                    desc: "Mesurez à l'endroit le plus fin, juste au-dessus du nombril.",
                    icon: (
                      <path d="M6 16h20 M10 12c0-2 1.5-4 6-4s6 2 6 4 M10 20c0 2 1.5 4 6 4s6-2 6-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    ),
                  },
                ].map((tip) => (
                  <div key={tip.label} className="flex gap-4 bg-neutral-50 rounded-2xl p-4 items-center">
                    <div className="w-12 h-12 flex-shrink-0 bg-black rounded-xl flex items-center justify-center">
                      <svg width="26" height="26" viewBox="0 0 32 32" fill="none">{tip.icon}</svg>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{tip.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {type === "chaussures" && (
            <p className="px-6 pb-4 text-xs text-neutral-500">Demi-pointures incluses. « — » indique une correspondance non renseignée. Contactez-nous pour les mesures du modèle choisi.</p>
          )}

          {/* Divider */}
          <div className="mx-6 border-t border-neutral-100" />

          {/* Size table */}
          <div className="px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
              {type === "chaussures" ? "Tableau des pointures" : "Tableau des tailles"}
            </p>

            <div className="rounded-2xl overflow-hidden border border-neutral-200">
              {type === "chaussures" ? (
                <table className="w-full text-sm text-center">
                  <thead>
                    <tr className="bg-black text-white text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 font-semibold">EU</th>
                      <th className="py-3 px-3 font-semibold">US</th>
                      <th className="py-3 px-3 font-semibold">UK</th>
                      <th className="py-3 px-3 font-semibold">CM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completeShoeGuide(shoesSizes, [...availableSizes, ...(selectedSize ? [selectedSize] : [])]).map((row, i) => {
                      const isAvailable = availableSizes.some(size => normalizeShoeSize(size) === normalizeShoeSize(row.eu));
                      const isSelected = !!selectedSize && normalizeShoeSize(selectedSize) === normalizeShoeSize(row.eu);
                      return (
                        <tr
                          key={row.eu}
                          ref={isSelected ? selectedRowRef : undefined}
                          className="transition-colors"
                          style={
                            isSelected
                              ? { backgroundColor: "#f0fdf4", borderLeft: "3px solid #3ecf4c" }
                              : isAvailable
                              ? { backgroundColor: "rgba(0,0,0,0.04)" }
                              : { backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }
                          }
                        >
                          <td className="py-3 px-3 font-bold">
                            <div className="flex items-center justify-center gap-1.5">
                              {isSelected && (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              <span className={isSelected ? "text-[#166534] font-black" : ""}>{row.eu}</span>
                              {isSelected && (
                                <span className="text-[9px] font-black uppercase tracking-wide text-[#166534] border border-[#86efac] bg-[#dcfce7] px-1.5 py-0.5 rounded-full leading-none">
                                  Votre taille
                                </span>
                              )}
                              {!isSelected && isAvailable && (
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                              )}
                            </div>
                          </td>
                          <td className={`py-3 px-3 ${isSelected ? "text-[#166534] font-semibold" : isAvailable ? "font-semibold" : "text-neutral-500"}`}>{row.us}</td>
                          <td className={`py-3 px-3 ${isSelected ? "text-[#166534] font-semibold" : isAvailable ? "font-semibold" : "text-neutral-500"}`}>{row.uk}</td>
                          <td className={`py-3 px-3 ${isSelected ? "text-[#166534] font-semibold" : isAvailable ? "font-semibold" : "text-neutral-500"}`}>{row.cm}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm text-center">
                  <thead>
                    <tr className="bg-black text-white text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 font-semibold">Taille</th>
                      <th className="py-3 px-3 font-semibold">FR</th>
                      <th className="py-3 px-3 font-semibold">Poitrine</th>
                      <th className="py-3 px-3 font-semibold">Taille</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clothingSizes.map((row, i) => {
                      const isAvailable = availableSizes.includes(row.label);
                      const isSelected = selectedSize === row.label;
                      return (
                        <tr
                          key={row.label}
                          ref={isSelected ? selectedRowRef : undefined}
                          className="transition-colors"
                          style={
                            isSelected
                              ? { backgroundColor: "#f0fdf4", borderLeft: "3px solid #3ecf4c" }
                              : isAvailable
                              ? { backgroundColor: "rgba(0,0,0,0.04)" }
                              : { backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }
                          }
                        >
                          <td className="py-3 px-3 font-bold">
                            <div className="flex items-center justify-center gap-1.5">
                              {isSelected && (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              <span className={isSelected ? "text-[#166534] font-black" : ""}>{row.label}</span>
                              {isSelected && (
                                <span className="text-[9px] font-black uppercase tracking-wide text-[#166534] border border-[#86efac] bg-[#dcfce7] px-1.5 py-0.5 rounded-full leading-none">
                                  Votre taille
                                </span>
                              )}
                              {!isSelected && isAvailable && (
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                              )}
                            </div>
                          </td>
                          <td className={`py-3 px-3 ${isSelected ? "text-[#166534] font-semibold" : isAvailable ? "font-semibold" : "text-neutral-500"}`}>{row.fr}</td>
                          <td className={`py-3 px-3 ${isSelected ? "text-[#166534] font-semibold" : isAvailable ? "font-semibold" : "text-neutral-500"}`}>{row.poitrine}</td>
                          <td className={`py-3 px-3 ${isSelected ? "text-[#166534] font-semibold" : isAvailable ? "font-semibold" : "text-neutral-500"}`}>{row.taille}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {(availableSizes.length > 0 || selectedSize) && (
              <div className="flex flex-col gap-1.5 mt-3">
                {selectedSize && (
                  <p className="text-[11px] text-[#166534] flex items-center gap-1.5 font-semibold">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Taille {selectedSize} sélectionnée
                  </p>
                )}
                {availableSizes.length > 0 && (
                  <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                    Tailles disponibles pour ce produit
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tip */}
          <div className="mx-6 mb-8 bg-neutral-50 rounded-2xl p-4">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 flex-shrink-0 bg-black rounded-lg flex items-center justify-center mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm mb-1">Conseil</p>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {type === "chaussures"
                    ? "En cas de doute entre deux pointures, choisissez la plus grande. Nos chaussures sont fidèles à la taille."
                    : "En cas de doute, optez pour la taille supérieure. Nos vêtements ont une coupe droite, ni trop slim ni trop ample."}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

