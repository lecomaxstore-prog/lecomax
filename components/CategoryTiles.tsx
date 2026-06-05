"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { categories, productsByCategory } from "@/lib/products";

const categoryImages: Record<string, string> = {
  homme: "/images/pages images/homme.png",
  femme: "/images/pages images/femme.png",
  chaussures:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  accessoires: "/images/pages images/accessoires.png",
};

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function CategoryTiles() {
  const cats = categories.map((c) => ({
    ...c,
    count: productsByCategory(c.slug).length,
    image: categoryImages[c.slug],
  }));

  const [main, ...rest] = cats;
  const { ref, visible } = useInView(0.1);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-16" ref={ref}>
      {/* Animated header */}
      <div
        className="flex items-end justify-between mb-8 border-b border-neutral-100 pb-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <h2 className="h-display text-3xl md:text-[2.6rem]">
          Acheter par catégorie
        </h2>
        <span className="hidden md:block text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
          {cats.reduce((s, c) => s + c.count, 0)} articles
        </span>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-3">
        {/* Large left tile — slides in from left */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0) scale(1)" : "translateX(-40px) scale(0.97)",
            transition: "opacity 0.8s cubic-bezier(0.25,0.46,0.45,0.94) 0.15s, transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94) 0.15s",
          }}
        >
          <Tile
            {...main}
            aspect="aspect-[3/4] md:aspect-auto md:h-full"
            textSize="text-4xl"
            sizes="(min-width: 768px) 55vw, 100vw"
          />
        </div>

        {/* 2×2 right grid — staggered pop in */}
        <div className="grid grid-cols-2 grid-rows-2 gap-3">
          {rest.slice(0, 3).map((c, i) => (
            <div
              key={c.slug}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
                transition: `opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${0.25 + i * 0.1}s, transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${0.25 + i * 0.1}s`,
              }}
            >
              <Tile
                {...c}
                aspect="aspect-[4/3]"
                textSize="text-2xl"
                sizes="(min-width: 768px) 22vw, 50vw"
              />
            </div>
          ))}

          {/* "Tout Explorer" tile */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
              transition: "opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94) 0.55s, transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94) 0.55s",
            }}
          >
            <Link
              href="/homme"
              className="relative block aspect-[4/3] overflow-hidden bg-black group"
            >
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80"
                alt="Tout explorer"
                fill
                sizes="(min-width: 768px) 22vw, 50vw"
                className="object-cover opacity-45 group-hover:opacity-60 group-hover:scale-[1.08] transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              {/* Animated border ring on hover */}
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 transition-all duration-500" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5">
                <div className="w-9 h-9 border border-white/40 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
                <p className="text-white font-black text-[11px] uppercase tracking-[0.25em] text-center leading-tight group-hover:tracking-[0.35em] transition-all duration-500">
                  Tout<br/>explorer
                </p>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
                  {cats.reduce((s, c) => s + c.count, 0)} articles
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tile({
  slug,
  label,
  count,
  image,
  aspect,
  textSize,
  sizes,
}: {
  slug: string;
  label: string;
  count: number;
  image: string;
  aspect: string;
  textSize: string;
  sizes: string;
}) {
  return (
    <Link
      href={`/${slug}`}
      className={`relative block ${aspect} overflow-hidden bg-neutral-100 group`}
    >
      <Image
        src={image}
        alt={label}
        fill
        sizes={sizes}
        className="object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
      />
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      {/* Hover shimmer sweep */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.06)_50%,transparent_70%)] group-hover:translate-x-full" style={{ transition: "opacity 0.4s, transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)" }} />
      {/* Animated border on hover */}
      <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/15 transition-all duration-500" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
        <p className="text-white/50 text-[10px] uppercase tracking-[0.3em] font-bold mb-1 group-hover:text-white/70 transition-colors duration-300">
          {count} articles
        </p>
        <h3 className={`h-display text-white ${textSize} group-hover:tracking-wider transition-all duration-500`}>{label}</h3>
        <span className="mt-3.5 inline-flex items-center gap-1.5 self-start bg-white text-black text-[10px] font-black uppercase px-3.5 py-2 tracking-[0.15em] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 ease-out">
          Découvrir
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
