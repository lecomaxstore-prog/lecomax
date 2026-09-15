"use client";

import { useEffect, useId, useRef, useState } from "react";
import { registerOpenSizeMenu } from "@/lib/size-menu-state";

export default function SizeSelect({ sizes, availableSizes, value, label, onChange }: {
  sizes: string[];
  availableSizes: string[];
  value: string | null;
  label: string;
  onChange: (size: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const selected = value && availableSizes.includes(value) ? value : null;
  const availableCount = sizes.filter((size) => availableSizes.includes(size)).length;

  useEffect(() => {
    if (!open) return;
    const releaseMenu = registerOpenSizeMenu();
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      releaseMenu();
    };
  }, [open]);

  if (sizes.length === 1 && /^taille unique$/i.test(sizes[0].trim())) {
    const singleSize = sizes[0];
    const available = availableSizes.includes(singleSize);
    return (
      <button
        type="button"
        disabled={!available}
        aria-pressed={selected === singleSize}
        onClick={() => onChange(singleSize)}
        className={`group inline-flex min-h-14 w-full items-center justify-between gap-6 rounded-xl border px-4 py-3 text-left transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[220px] ${
          !available
            ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400"
            : selected
              ? "border-[#234735]/25 bg-[#f1f5f0] text-[#234735] hover:border-[#234735]/45 hover:bg-[#eaf0e8]"
              : "border-neutral-300 bg-white text-neutral-900 hover:border-[#234735]/50 hover:bg-[#f8faf6]"
        }`}
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold leading-5">{singleSize}</span>
          <span className={`text-[11px] font-normal leading-4 ${available ? "text-[#526955]" : "text-neutral-400"}`}>
            {!available ? "Indisponible" : selected ? "Sélectionnée" : "Sélectionner"}
          </span>
        </span>
        <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          selected && available ? "bg-[#234735] text-white" : "border border-neutral-300"
        }`}>
          {selected && available ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
          ) : !available ? <span className="h-px w-2 bg-neutral-300" /> : null}
        </span>
      </button>
    );
  }

  return (
    <div ref={container} data-size-select-open={open ? "true" : undefined} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
      if (open && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const options = Array.from(container.current?.querySelectorAll<HTMLButtonElement>("[data-size-option]:not(:disabled)") ?? []);
        const index = options.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : event.key === "ArrowDown" ? (index + 1) % options.length : (index - 1 + options.length) % options.length;
        options[next]?.focus();
      }
    }}>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls={panelId}
        aria-label={`${label} : ${selected || "Choisir une taille"}`}
        onClick={() => setOpen(!open)}
        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735] focus-visible:ring-offset-2 ${open ? "border-[#234735] ring-2 ring-[#234735]/10" : "border-neutral-300 hover:border-[#234735]"}`}>
        <span className={selected ? "font-semibold text-neutral-900" : "text-neutral-500"}>{selected ? `${label} ${selected}` : "Choisir une taille"}</span>
        <svg aria-hidden="true" className={`shrink-0 text-[#234735] transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {open && (
        <div id={panelId} role="group" aria-label={`Choisir : ${label}`} className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_16px_48px_-12px_rgba(25,42,32,0.22)]">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-[#f8f8f5] px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Choisir une taille</span>
            <span className="text-[11px] text-neutral-500">{availableCount} disponible{availableCount > 1 ? "s" : ""}</span>
          </div>
          <div className="max-h-64 overflow-y-auto overscroll-contain p-1.5">
            {sizes.map((size) => {
              const soldOut = !availableSizes.includes(size);
              const active = selected === size;
              return (
                <button key={size} type="button" data-size-option disabled={soldOut} aria-pressed={active}
                  onClick={() => { onChange(size); setOpen(false); trigger.current?.focus(); }}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#234735] ${soldOut ? "cursor-not-allowed text-neutral-400" : active ? "bg-[#edf3ed] text-[#234735]" : "text-neutral-800 hover:bg-[#f6f7f4]"}`}>
                  <span className="text-[15px] font-semibold tabular-nums">{size}</span>
                  <span className="flex shrink-0 items-center gap-2.5">
                    <span className={`text-[11px] ${soldOut ? "text-neutral-400" : "text-[#526955]"}`}>{soldOut ? "Épuisé" : active ? "Sélectionnée" : "Disponible"}</span>
                    <span aria-hidden="true" className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-[#234735] text-white" : soldOut ? "border border-neutral-200 bg-neutral-50" : "border border-neutral-300"}`}>
                      {active ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg> : soldOut ? <span className="h-px w-2 bg-neutral-300"/> : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
