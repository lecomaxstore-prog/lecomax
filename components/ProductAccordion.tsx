"use client";

import { useState, useEffect, useCallback } from "react";
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

  const prev = useCallback(() => setCurrent((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        aria-label="Fermer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          aria-label="Précédent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[current]}
          alt={`description ${current + 1}`}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-sm shadow-2xl"
          draggable={false}
        />
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          aria-label="Suivant"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
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
  return (
    <div className="mt-10 border-b border-neutral-200">
      {/* Description Produit */}
      <AccordionItem title="Description Produit" defaultOpen={true}>
        <div className="w-8 h-[2px] bg-black mb-4" />
        <p className="text-[15px] text-neutral-700 leading-[1.8] tracking-wide max-w-2xl mb-8">{description}</p>
        {hasImages && (
          <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
            {descriptionImages!.map((src, i) => (
              <div key={i} className="w-full overflow-hidden rounded-sm border border-neutral-100">
                <img src={src} alt={`description ${i + 1}`} className="w-full h-auto block" loading={i === 0 ? "eager" : "lazy"} />
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
