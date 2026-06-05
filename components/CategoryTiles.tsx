"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { categories, productsByCategory } from "@/lib/products";

const categoryImages: Record<string, string> = {
  homme: "/images/pages images/homme.png",
  femme: "/images/pages images/femme.png",
  chaussures: "/images/pages images/chaussures.png",
  accessoires: "/images/pages images/accessoires.png",
};

function useInView(threshold = 0.1) {
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

function useParallax() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 18;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 12;
      setPos({ x, y });
    };
    const onLeave = () => setPos({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, []);
  return { ref, pos };
}

export default function CategoryTiles() {
  const cats = categories.map((c) => ({
    ...c,
    count: productsByCategory(c.slug).length,
    image: categoryImages[c.slug],
  }));

  const [main, ...rest] = cats;
  const { ref, visible } = useInView(0.08);
  const { ref: mainRef, pos } = useParallax();
  const total = cats.reduce((s, c) => s + c.count, 0);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-16" ref={ref}>
      {/* Header */}
      <div
        className="flex items-end justify-between mb-8 border-b border-neutral-100 pb-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <h2 className="h-display text-3xl md:text-[2.6rem]">Acheter par catégorie</h2>
        <span className="hidden md:block text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
          {total} articles
        </span>
      </div>

      {/* Grid: big left + 3 small right */}
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-3">

        {/* ── Large left tile ── */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            clipPath: visible ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
            transition: "opacity 0.05s, clip-path 0.9s cubic-bezier(0.76,0,0.24,1) 0.1s",
          }}
        >
          <Link
            ref={mainRef}
            href={`/${main.slug}`}
            className="relative block aspect-[3/4] md:aspect-auto md:h-full overflow-hidden bg-neutral-900 group"
            style={{ perspective: "800px" }}
          >
            <div
              className="absolute inset-[-4%] transition-transform duration-300 ease-out"
              style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(1.08)` }}
            >
              <Image
                src={main.image}
                alt={main.label}
                fill
                priority
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover group-hover:brightness-110 transition-all duration-700"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
            <div
              className="absolute top-0 left-0 h-[3px] bg-[#3ecf4c] transition-all duration-700 ease-out"
              style={{ width: visible ? "100%" : "0%" }}
            />
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#3ecf4c]/40 transition-all duration-500" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-2" style={{ color: "#3ecf4c" }}>
                {main.count} articles
              </p>
              <h3 className="h-display text-white text-5xl md:text-6xl leading-none group-hover:tracking-wider transition-all duration-500">
                {main.label}
              </h3>
              <div className="mt-3 h-[2px] bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-[#3ecf4c] transition-all duration-700 ease-out"
                  style={{ width: "0%", transform: "translateX(-100%)" }}
                  ref={(el) => {
                    if (el) {
                      const onEnter = () => { el.style.width = "100%"; el.style.transform = "translateX(0)"; };
                      const onLeave = () => { el.style.width = "0%"; el.style.transform = "translateX(-100%)"; };
                      const parent = el.closest(".group");
                      parent?.addEventListener("mouseenter", onEnter);
                      parent?.addEventListener("mouseleave", onLeave);
                    }
                  }}
                />
              </div>
              <span className="mt-5 inline-flex items-center gap-2 self-start bg-[#3ecf4c] text-black text-[10px] font-black uppercase px-4 py-2.5 tracking-[0.18em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-400 ease-out">
                Découvrir
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        </div>

        {/* ── 3 small tiles on the right ── */}
        <div className="flex flex-col gap-3">
          {/* Top row: 2 tiles side by side */}
          <div className="grid grid-cols-2 gap-3">
            {rest.slice(0, 2).map((c, i) => (
              <div
                key={c.slug}
                style={{
                  opacity: visible ? 1 : 0,
                  clipPath: visible ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
                  transition: `opacity 0.05s, clip-path 0.85s cubic-bezier(0.76,0,0.24,1) ${0.25 + i * 0.12}s`,
                }}
              >
                <SmallTile {...c} sizes="(min-width: 768px) 22vw, 50vw" />
              </div>
            ))}
          </div>
          {/* Bottom: 1 full-width tile */}
          {rest[2] && (
            <div
              style={{
                opacity: visible ? 1 : 0,
                clipPath: visible ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
                transition: "opacity 0.05s, clip-path 0.85s cubic-bezier(0.76,0,0.24,1) 0.49s",
              }}
            >
              <SmallTile {...rest[2]} sizes="(min-width: 768px) 44vw, 100vw" wide />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SmallTile({ slug, label, count, image, sizes, wide }: {
  slug: string; label: string; count: number; image: string; sizes: string; wide?: boolean;
}) {
  return (
    <Link href={`/${slug}`} className={`relative block overflow-hidden bg-neutral-900 group ${wide ? "aspect-[2/1]" : "aspect-[4/3]"}`}>
      <Image
        src={image}
        alt={label}
        fill
        sizes={sizes}
        className="object-cover group-hover:scale-[1.08] group-hover:brightness-110 transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {/* Green left accent line */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#3ecf4c] scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500 ease-out" />
      {/* Green glow border */}
      <div className="absolute inset-0 border border-transparent group-hover:border-[#3ecf4c]/30 transition-all duration-400" />
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
        <p className="text-white/50 text-[9px] uppercase tracking-[0.3em] font-bold mb-1 group-hover:text-[#3ecf4c] transition-colors duration-300">
          {count} articles
        </p>
        <h3 className="h-display text-white text-xl group-hover:tracking-wider transition-all duration-500">{label}</h3>
        <span className="mt-2.5 inline-flex items-center gap-1.5 self-start bg-white text-black text-[9px] font-black uppercase px-3 py-1.5 tracking-[0.15em] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 ease-out">
          Découvrir
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
