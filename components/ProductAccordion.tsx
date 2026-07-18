"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ReviewSection from "./ReviewSection";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function AccordionItem({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-neutral-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-black text-[14px] uppercase tracking-[0.05em]">{title}</span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="pb-6">{children}</div>}
    </div>
  );
}

function ImageLightbox({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;

  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const prev = useCallback(() => { resetZoom(); setCurrent((i) => (i - 1 + images.length) % images.length); }, [images.length, resetZoom]);
  const next = useCallback(() => { resetZoom(); setCurrent((i) => (i + 1) % images.length); }, [images.length, resetZoom]);

  const clampPan = useCallback((x: number, y: number, z: number) => {
    if (!imgRef.current) return { x, y };
    const el = imgRef.current;
    const maxX = (el.offsetWidth * (z - 1)) / 2;
    const maxY = (el.offsetHeight * (z - 1)) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }, []);

  const adjustZoom = useCallback((delta: number, cx?: number, cy?: number) => {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
    void cx; void cy;
  }, []);

  // Mouse wheel zoom
  useEffect(() => {
    const el = imgRef.current?.parentElement;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      adjustZoom(e.deltaY < 0 ? 0.3 : -0.3);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [adjustZoom]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (zoom > 1) resetZoom(); else onClose(); }
      if (e.key === "ArrowLeft" && zoom === 1) prev();
      if (e.key === "ArrowRight" && zoom === 1) next();
      if (e.key === "+" || e.key === "=") adjustZoom(0.5);
      if (e.key === "-") adjustZoom(-0.5);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, prev, next, zoom, resetZoom, adjustZoom]);

  // Mouse drag to pan
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan(clampPan(dragStart.current.px + dx, dragStart.current.py + dy, zoom));
  };
  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  // Double-click to zoom in/reset
  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom > 1) { resetZoom(); } else { setZoom(2.5); }
  };

  const isZoomed = zoom > 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95"
      onClick={() => { if (!isZoomed) onClose(); }}
    >
      {/* ── Top bar — always on pure black, never over image ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: page counter, zoom controls only when zoomed */}
        <div className="flex items-center gap-3">
          <span className="text-white text-[13px] font-semibold">{current + 1} / {images.length}</span>
          {isZoomed && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); adjustZoom(-0.5); }}
                disabled={zoom <= MIN_ZOOM}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-30 transition-all"
                aria-label="Dézoomer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                className="text-white text-[12px] font-bold w-10 text-center hover:text-white/70 transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); adjustZoom(0.5); }}
                disabled={zoom >= MAX_ZOOM}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-30 transition-all"
                aria-label="Zoomer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
            </div>
          )}
        </div>

        {/* Right: close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-600 text-white transition-all"
          aria-label="Fermer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* ── Image area ── */}
      <div className="relative flex-1 flex items-center justify-center">
        {/* Prev */}
        {images.length > 1 && !isZoomed && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#3ecf4c] hover:bg-[#2db83a] transition-colors text-white shadow-lg"
            aria-label="Précédent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}

        {/* Image container */}
        <div
          className="relative overflow-hidden w-full h-full"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={images[current]}
            alt={`description ${current + 1}`}
            onDoubleClick={onDoubleClick}
            className="absolute inset-0 m-auto max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: dragging ? "none" : "transform 0.2s ease",
              cursor: isZoomed ? (dragging ? "grabbing" : "grab") : "zoom-in",
              top: 0, bottom: 0, left: 0, right: 0,
            }}
            draggable={false}
          />

          {/* Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-white/40 text-[11px] select-none">
              {isZoomed ? "Double-clic ou Échap pour réinitialiser" : "Double-clic pour zoomer · Molette pour zoomer"}
            </span>
          </div>
        </div>

        {/* Next */}
        {images.length > 1 && !isZoomed && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#3ecf4c] hover:bg-[#2db83a] transition-colors text-white shadow-lg"
            aria-label="Suivant"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Dot navigation */}
        {images.length > 1 && !isZoomed && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); resetZoom(); setCurrent(i); }}
                className={`rounded-full transition-all ${i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductAccordion({
  description,
  features,
  descriptionImages,
  productSlug,
}: {
  description: string;
  features: string[];
  descriptionImages?: string[];
  productSlug: string;
}) {
  const hasImages = descriptionImages && descriptionImages.length > 0;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const detailRows = features.filter((feature) => feature.includes(": "));
  const highlights = features.filter((feature) => !feature.includes(": "));

  return (
    <div className="mt-10 border-b border-neutral-200">
      {lightboxIndex !== null && hasImages && (
        <ImageLightbox
          images={descriptionImages!}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Description Produit */}
      <AccordionItem title="Description Produit" defaultOpen={true}>
        <div className="w-8 h-[2px] bg-black mb-4" />
        <p className="text-[15px] text-neutral-700 leading-[1.8] tracking-wide max-w-2xl mb-8">{description}</p>
        {hasImages && (
          <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
            {descriptionImages!.map((src, i) => (
              <div
                key={i}
                className="w-full overflow-hidden rounded-sm border border-neutral-100 cursor-zoom-in relative group"
                onClick={() => setLightboxIndex(i)}
              >
                <img src={src} alt={`description ${i + 1}`} className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]" loading={i === 0 ? "eager" : "lazy"} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </div>
            ))}
          </div>
        )}
      </AccordionItem>

      {/* Détails Du Produit */}
      <AccordionItem title="Détails Du Produit" defaultOpen={true}>
        <div className="max-w-4xl">
          {detailRows.length > 0 && <div className="max-w-xl divide-y divide-neutral-100">
          {detailRows.map((f) => {
            const colonIdx = f.indexOf(": ");
            const key = f.slice(0, colonIdx);
            const val = f.slice(colonIdx + 2);
            return (
              <div key={f} className="flex items-baseline gap-3 py-3 text-[13px]">
                <span className="w-32 shrink-0 text-[10px] font-black uppercase tracking-[.12em] text-neutral-400">{key}</span>
                <span className="font-medium text-neutral-800">{val}</span>
              </div>
            );
          })}
          </div>}

          {highlights.length > 0 && (
            <section
              aria-labelledby="product-highlights-title"
              className={`${detailRows.length > 0 ? "mt-7" : ""} overflow-hidden rounded-[22px] border border-emerald-100 bg-[linear-gradient(135deg,#f4fff6_0%,#ffffff_58%,#f8faf8_100%)] p-4 sm:p-6`}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-600 shadow-[0_8px_24px_rgba(22,163,74,0.08)]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m7.5 12 3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-[.26em] text-emerald-600">L&apos;essentiel</p>
                    <h3 id="product-highlights-title" className="text-[15px] font-black tracking-[-0.02em] text-neutral-950 sm:text-[17px]">Points forts du produit</h3>
                  </div>
                </div>
                <span className="hidden rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-neutral-500 sm:inline-flex">
                  {highlights.length} atouts
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((feature, index) => (
                  <div
                    key={feature}
                    className="group flex min-h-[62px] items-center gap-3 rounded-2xl border border-white bg-white/90 px-3.5 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-[0_12px_30px_rgba(22,163,74,0.08)] sm:px-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors duration-300 group-hover:bg-emerald-500 group-hover:text-white">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="m4.5 8 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="flex-1 text-[12px] font-bold leading-[1.35] text-neutral-700">{feature}</span>
                    <span className="self-start pt-0.5 text-[8px] font-black tabular-nums tracking-[.12em] text-neutral-300" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </AccordionItem>

      {/* Avis */}
      <AccordionItem title="Avis">
        <ReviewSection productSlug={productSlug} />
      </AccordionItem>
    </div>
  );
}

