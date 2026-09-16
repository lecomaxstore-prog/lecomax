"use client";

import { useId, useState } from "react";

const COLOR_SWATCHES: Record<string, string> = {
  noir: "#0a0a0a", blanc: "#ffffff", "blanc casse": "#fafaf5",
  gris: "#9ca3af", "gris clair": "#d1d5db", "gris chine": "#d1d5db",
  "gris fonce": "#4b5563", "gris anthracite": "#374151",
  bleu: "#3b82f6", "bleu marine": "#1e3a5f", "bleu nuit": "#1e2a4a",
  "bleu ciel": "#7dd3fc", marine: "#1e3a5f", navy: "#1e3a5f",
  rouge: "#dc2626", bordeaux: "#7c1035", rose: "#f9a8d4",
  "rose poudre": "#fcd5ce", corail: "#fb7185", vert: "#22c55e",
  "vert militaire": "#4a5c3a", "vert sauge": "#7c9a6f", kaki: "#8b7355",
  caramel: "#d4a574", beige: "#f5f0e8", champagne: "#f7e7ce",
  lilas: "#c4b5fd", mauve: "#a78bfa", violet: "#8b5cf6",
  jaune: "#facc15", "jaune citron": "#fef08a", orange: "#f97316",
  dore: "#d4af37", argent: "#c0c0c0", marron: "#92400e",
  turquoise: "#2dd4bf", "edition standard": "#1a1a2e",
};

function swatchBackground(color: string) {
  const shades = color.split("/").map((name) => {
    const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    return COLOR_SWATCHES[normalized] ?? "#e5e7eb";
  });
  if (shades.length === 1) return shades[0];
  return `linear-gradient(135deg, ${shades.map((shade, index) => `${shade} ${index * 100 / shades.length}% ${(index + 1) * 100 / shades.length}%`).join(", ")})`;
}

export default function CardColorOptions({ colors }: { colors: string[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!colors.length) return null;

  return (
    <div className="relative z-20">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${open ? "Masquer" : "Voir"} les couleurs disponibles (${colors.length})`}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
        }}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((previous) => !previous); }}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md bg-transparent py-2.5 text-[11px] font-medium text-[#425447] transition-colors hover:text-[#183c30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="text-[10px] font-normal text-[#74796f]">{colors.length} couleur{colors.length > 1 ? "s" : ""}</span>
        </span>
        <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center text-[#7b8778]">
          <svg className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      <ul id={id} hidden={!open} aria-label="Couleurs disponibles" className={`${open ? "flex" : "hidden"} mb-2 max-h-32 flex-wrap gap-x-4 gap-y-2 overflow-y-auto pb-1 text-[10px] text-[#536052]`}>
        {colors.map((color) => (
          <li key={color} className="flex min-w-0 max-w-full items-center gap-1.5 py-0.5">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full border border-black/15" style={{ background: swatchBackground(color) }} />
            <span className="min-w-0 break-words">{color}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
