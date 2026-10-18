"use client";

import { useId, useRef, useState, useEffect } from "react";
import RecommendationCard from "./RecommendationCard";
import styles from "./ProductCarousel.module.css";
import type { CardProduct } from "@/lib/products";

export default function ProductCarousel({ products }: { products: CardProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackId = useId();
  const headingId = useId();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => { el.removeEventListener("scroll", update); observer.disconnect(); };
  }, [products.length]);

  const scroll = (direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width ?? el.clientWidth;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 16;
    el.scrollBy({ left: direction * (cardWidth + gap), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return (
    <div role="region" aria-labelledby={headingId} className="min-w-0 w-full">
      <div className={`${styles.header} flex items-end justify-between gap-3`}>
        <div>
          <p className={styles.eyebrow}>La sélection L’ecomax</p>
          <h2 id={headingId} className={styles.heading}>Vous aimerez aussi</h2>
        </div>
        <div className="flex shrink-0 gap-1">
          {[-1, 1].map((direction) => (
            <button key={direction} type="button" onClick={() => scroll(direction)}
              disabled={direction === -1 ? !canPrev : !canNext}
              aria-label={direction === -1 ? "Produits précédents" : "Produits suivants"} aria-controls={trackId}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-transparent text-neutral-700 transition-colors hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735] focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-25 disabled:hover:border-neutral-200 disabled:hover:bg-transparent">
              <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={direction === -1 ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"}/></svg>
            </button>
          ))}
        </div>
      </div>
      <div id={trackId} ref={scrollRef} tabIndex={0} aria-label="Produits recommandés"
        className={`${styles.track} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234735]`}>
        {products.map((product) => (
          <div key={product.slug} className={styles.card}>
            <RecommendationCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
