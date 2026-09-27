"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import ProductCard from "./ProductCard";
import CollectionProductCard from "./CollectionProductCard";
import Link from "next/link";
import type { CardProduct } from "@/lib/products";
import styles from "./ProductRail.module.css";

export default function ProductRail({
  title,
  products,
  cta,
  cardStyle = "default",
  refined = false,
}: {
  title: string;
  products: CardProduct[];
  cta?: { label: string; href: string };
  cardStyle?: "default" | "collection";
  refined?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const [VISIBLE, setVisibleCount] = useState(4);
  useEffect(() => {
    const update = () => setVisibleCount(window.innerWidth < 640 ? 2 : window.innerWidth < 768 ? 3 : 4);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const total = products.length;
  const maxIndex = Math.max(0, total - VISIBLE);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  const prev = () => {
    const next = Math.max(0, activeIndex - 1);
    setActiveIndex(next);
    scrollTo(next);
  };

  const next = () => {
    const n = Math.min(maxIndex, activeIndex + 1);
    setActiveIndex(n);
    scrollTo(n);
  };

  const goTo = (i: number) => {
    setActiveIndex(i);
    scrollTo(i);
  };

  useEffect(() => {
    setCanPrev(activeIndex > 0);
    setCanNext(activeIndex < maxIndex);
  }, [activeIndex, maxIndex]);

  // Stagger reveal on scroll-into-view
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reveal = () => {
      const header = section.querySelector(".rail-header") as HTMLElement | null;
      if (header) header.classList.add("in");
      const cards = section.querySelectorAll(".card-sr");
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add("in"), i * 75);
      });
    };

    const isInView = () => {
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
    };

    if (isInView()) {
      reveal();
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          obs.unobserve(section);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  // Sync dots on manual scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const card = track.children[0] as HTMLElement;
      if (!card) return;
      const cardW = card.offsetWidth + 12; // gap-3 = 12px
      const idx = Math.round(track.scrollLeft / cardW);
      setActiveIndex(Math.min(idx, maxIndex));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [maxIndex]);

  return (
    <section data-source-file="components/ProductRail.tsx" ref={sectionRef} className={`${refined ? styles.refined : ""} max-w-7xl mx-auto px-4 md:px-6 py-10`}>
      {/* Header */}
      <div className="rail-header sr sr-up flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-1.5">{refined ? "La sélection L’ecomax" : "Collection"}</p>
          <h2 className="h-display text-2xl md:text-3xl leading-none">{title}</h2>
        </div>
        <div className="flex items-center gap-2.5">
          {cta && products.length > 0 && (
            <Link
              href={cta.href}
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] border border-black text-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-200 group"
            >
              {cta.label}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform duration-200">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          )}
          {/* Arrow buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              disabled={!canPrev}
              aria-label="Précédent"
              className={`w-8 h-8 border flex items-center justify-center transition-all duration-200
                ${canPrev
                  ? "border-neutral-300 text-neutral-600 hover:border-black hover:text-black"
                  : "border-neutral-100 text-neutral-200 cursor-not-allowed"
                }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={next}
              disabled={!canNext}
              aria-label="Suivant"
              className={`w-8 h-8 border flex items-center justify-center transition-all duration-200
                ${canNext
                  ? "border-neutral-300 text-neutral-600 hover:border-black hover:text-black"
                  : "border-neutral-100 text-neutral-200 cursor-not-allowed"
                }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Track + overlay arrows */}
      <div className="relative group/rail">
        {/* Left arrow */}
        <button
          onClick={prev}
          disabled={!canPrev}
          aria-label="Précédent"
          className={`hidden md:flex absolute left-0 top-[45%] -translate-y-1/2 z-10 -translate-x-1/2
            w-10 h-10 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-neutral-100
            items-center justify-center transition-all duration-200
            ${canPrev
              ? "opacity-0 group-hover/rail:opacity-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.18)] hover:scale-110 cursor-pointer"
              : "opacity-0 pointer-events-none"
            }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        {/* Right arrow */}
        <button
          onClick={next}
          disabled={!canNext}
          aria-label="Suivant"
          className={`hidden md:flex absolute right-0 top-[45%] -translate-y-1/2 z-10 translate-x-1/2
            w-10 h-10 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-neutral-100
            items-center justify-center transition-all duration-200
            ${canNext
              ? "opacity-0 group-hover/rail:opacity-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.18)] hover:scale-110 cursor-pointer"
              : "opacity-0 pointer-events-none"
            }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.length > 0 ? products.map((p) => (
            <div
              key={p.slug}
              className="card-sr w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] flex-none"
              style={{ scrollSnapAlign: "start" }}
            >
              {cardStyle === "collection" ? <CollectionProductCard product={p} /> : <ProductCard product={p} />}
            </div>
          )) : (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center border border-dashed border-neutral-200">
              <p className="text-[11px] uppercase tracking-[0.25em] font-black text-neutral-300">Bientôt disponible</p>
              <p className="text-neutral-400 text-[12px] mt-1.5">Des produits seront ajoutés prochainement.</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      {total > VISIBLE && (
        maxIndex + 1 <= 6 ? (
          /* Dots for short rails */
          <div className="flex items-center justify-center gap-2 mt-7">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-[3px] rounded-full transition-all duration-300
                  ${i === activeIndex ? "w-10 bg-black" : "w-3 bg-neutral-200 hover:bg-neutral-400"}`}
              />
            ))}
          </div>
        ) : (
          /* Progress bar for long rails */
          <div className="mt-7 px-0">
            <div className="relative h-[2px] bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-black rounded-full transition-all duration-300"
                style={{ width: `${((activeIndex + VISIBLE) / total) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-neutral-400 font-medium tabular-nums">
                {activeIndex + 1} – {Math.min(activeIndex + VISIBLE, total)} / {total}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={prev} disabled={!canPrev} aria-label="Précédent"
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${canPrev ? "text-neutral-400 hover:text-black" : "text-neutral-200 cursor-not-allowed"}`}>
                  ←
                </button>
                <span className="text-neutral-200 text-[10px]">/</span>
                <button onClick={next} disabled={!canNext} aria-label="Suivant"
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${canNext ? "text-neutral-400 hover:text-black" : "text-neutral-200 cursor-not-allowed"}`}>
                  →
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </section>
  );
}
