"use client";

import { useState } from "react";
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
