"use client";

import { useRef, useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import type { CardProduct } from "@/lib/products";

export default function ProductCarousel({ products }: { products: CardProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const CARD_W = 220;
  const GAP = 16;
  const SCROLL_BY = (CARD_W + GAP) * 2;

  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  const scroll = (dir: "prev" | "next") => {
    scrollRef.current?.scrollBy({ left: dir === "next" ? SCROLL_BY : -SCROLL_BY, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Prev arrow */}
      <button
        onClick={() => scroll("prev")}
        aria-label="Précédent"
        className={`absolute left-0 top-[40%] -translate-y-1/2 z-10 w-10 h-10 bg-white border border-neutral-200 shadow-sm flex items-center justify-center transition-all duration-200 hover:bg-black hover:text-white hover:border-black ${
          canPrev ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      {/* Next arrow */}
      <button
        onClick={() => scroll("next")}
        aria-label="Suivant"
        className={`absolute right-0 top-[40%] -translate-y-1/2 z-10 w-10 h-10 bg-white border border-neutral-200 shadow-sm flex items-center justify-center transition-all duration-200 hover:bg-black hover:text-white hover:border-black ${
          canNext ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-1 -mx-4 px-4 md:-mx-0 md:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((p) => (
          <div key={p.slug} className="flex-shrink-0 w-[200px] md:w-[220px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
