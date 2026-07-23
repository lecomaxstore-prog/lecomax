"use client";

import { useEffect, useRef, useState } from "react";

type ReviewRating = { rating?: number };

export default function RatingSummaryPopover({
  productSlug,
  rating,
  reviewCount,
}: {
  productSlug: string;
  rating: number;
  reviewCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [distribution, setDistribution] = useState<number[] | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || distribution) return;
    fetch(`/api/reviews?slug=${encodeURIComponent(productSlug)}`)
      .then((response) => response.json())
      .then((data: { reviews?: ReviewRating[] }) => {
        const counts = [0, 0, 0, 0, 0];
        for (const review of data.reviews ?? []) {
          const value = Math.round(Number(review.rating));
          if (value >= 1 && value <= 5) counts[value - 1] += 1;
        }
        setDistribution(counts);
      })
      .catch(() => setDistribution([0, 0, 0, 0, 0]));
  }, [distribution, open, productSlug]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const counts = distribution ?? [0, 0, 0, 0, 0];
  const actualTotal = counts.reduce((sum, count) => sum + count, 0);
  const barTotal = actualTotal || reviewCount || 1;

  return (
    <div ref={rootRef} className="relative z-[70] shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${rating.toFixed(1)} sur 5, ${reviewCount} avis. Afficher le détail des notes`}
        onClick={() => setOpen((value) => !value)}
        className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="flex items-center gap-px text-[#22c55e]">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={star <= Math.round(rating) ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            >
              <path d="m12 2.8 2.8 5.67 6.26.91-4.53 4.42 1.07 6.23L12 17.08l-5.6 2.95 1.07-6.23-4.53-4.42 6.26-.91L12 2.8Z" />
            </svg>
          ))}
        </span>
        <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums text-neutral-900">
          {rating.toFixed(1)}
          <span className="ml-1 font-medium text-neutral-500">({reviewCount})</span>
        </span>
        <svg
          aria-hidden="true"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Répartition des avis"
          className="absolute right-0 top-[calc(100%+10px)] isolate z-[80] w-[290px] rounded-xl border border-neutral-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,.18)] sm:w-[310px]"
        >
          <span aria-hidden="true" className="absolute -top-1.5 right-8 h-3 w-3 rotate-45 border-l border-t border-neutral-200 bg-white" />
          <div className="mb-3 flex items-end justify-between border-b border-neutral-100 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-neutral-400">Note moyenne</p>
              <p className="mt-1 text-2xl font-black leading-none text-neutral-950">{rating.toFixed(1)}<span className="text-sm text-neutral-400">/5</span></p>
            </div>
            <p className="text-[12px] font-semibold text-neutral-600">{reviewCount} avis</p>
          </div>

          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = counts[star - 1];
              const width = distribution ? Math.max(0, (count / barTotal) * 100) : 0;
              return (
                <div key={star} className="grid grid-cols-[30px_1fr_30px] items-center gap-2">
                  <span className="flex items-center justify-end gap-0.5 text-[12px] font-semibold text-neutral-700">
                    {star}<span className="text-[#22c55e]">★</span>
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <span
                      className={`block h-full rounded-full bg-neutral-900 transition-[width] duration-500 ${distribution ? "" : "animate-pulse"}`}
                      style={{ width: distribution ? `${width}%` : "35%" }}
                    />
                  </span>
                  <span className="text-right text-[11px] tabular-nums text-neutral-500">
                    {distribution ? count : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <a
            href="#avis"
            onClick={() => setOpen(false)}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 text-[11px] font-black uppercase tracking-[.08em] text-white transition-colors hover:bg-[#22c55e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-2"
          >
            Lire les {reviewCount} avis
          </a>
        </div>
      )}
    </div>
  );
}
