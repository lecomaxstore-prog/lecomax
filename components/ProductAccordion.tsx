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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92"
      onClick={() => { if (!isZoomed) onClose(); }}
    >
      {/* Prev */}
      {images.length > 1 && !isZoomed && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white"
          aria-label="Précédent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}

      {/* Image container */}
      <div
        className="relative overflow-hidden"
        style={{ width: "90vw", height: "90vh" }}
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
          className="absolute inset-0 m-auto max-w-full max-h-full object-contain rounded-sm shadow-2xl select-none"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: dragging ? "none" : "transform 0.2s ease",
            cursor: isZoomed ? (dragging ? "grabbing" : "grab") : "zoom-in",
            top: 0, bottom: 0, left: 0, right: 0,
          }}
          draggable={false}
        />

        {/* Top bar — solid dark strip above the image */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-black rounded-full px-3 py-1.5 shadow-lg">
            <span className="text-white/70 text-[11px] font-semibold select-none mr-1">{current + 1}/{images.length}</span>
            <button
              onClick={(e) => { e.stopPropagation(); adjustZoom(-0.5); }}
              disabled={zoom <= MIN_ZOOM}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white disabled:opacity-30 transition-all"
              aria-label="Dézoomer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); isZoomed ? resetZoom() : setZoom(2.5); }}
              className="text-white text-[11px] font-bold w-8 text-center hover:text-white/70 transition-colors"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); adjustZoom(0.5); }}
              disabled={zoom >= MAX_ZOOM}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white disabled:opacity-30 transition-all"
              aria-label="Zoomer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black hover:bg-neutral-800 text-white transition-all shadow-lg"
            aria-label="Fermer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Hint: double-click to zoom */}
        {!isZoomed && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-white/40 text-[11px] select-none">Double-clic pour zoomer · Molette pour zoomer</span>
          </div>
        )}

        {/* Reset zoom hint when zoomed */}
        {isZoomed && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-white/40 text-[11px] select-none">Double-clic ou Échap pour réinitialiser</span>
          </div>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && !isZoomed && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white"
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 rounded-full p-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionItem>

      {/* Détails Du Produit */}
      <AccordionItem title="Détails Du Produit" defaultOpen={true}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2">
          {features.map((f) => (
            <div key={f} className="flex items-start gap-2 text-[13px] text-neutral-700">
              <span className="flex-shrink-0 mt-[2px]">•</span>
              {f}
            </div>
          ))}
        </div>
      </AccordionItem>

      {/* Avis */}
      <AccordionItem title="Avis">
        <ReviewSection productSlug={productSlug} />
      </AccordionItem>
    </div>
  );
}

