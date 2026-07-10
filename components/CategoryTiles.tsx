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

export default function CategoryTiles() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/products?active=true&fields=category")
      .then(r => r.json())
      .then((data: { category: string }[]) => {
        if (!Array.isArray(data)) return;
        const c: Record<string, number> = {};
        for (const p of data) {
          const cat = p.category?.toLowerCase();
          if (cat) c[cat] = (c[cat] || 0) + 1;
        }
        setCounts(c);
      })
      .catch(() => {});
  }, []);

  const cats = categories.map((c) => ({
    ...c,
    count: counts[c.slug] ?? productsByCategory(c.slug).length,
    image: categoryImages[c.slug],
  })).filter((c) => c.count > 0 && c.slug !== "femme");

  const { ref, visible } = useInView(0.08);
  const total = cats.reduce((s, c) => s + c.count, 0);

  // Don't render the section if no categories have products yet
  if (cats.length === 0) return null;

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

      {/* ── Homme / Femme portrait banners ── */}
      <div
        className="grid grid-cols-2 gap-2 md:gap-3 mb-3"
        style={{
          opacity: visible ? 1 : 0,
          clipPath: visible ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
          transition: "opacity 0.05s, clip-path 0.85s cubic-bezier(0.76,0,0.24,1) 0.1s",
        }}
      >
        {[{href:"/homme",src:"/images/pages images/homme.png",alt:"Collection Homme",label:"Homme",objPos:"object-center"},{href:"/femme",src:"/images/pages images/femme.png",alt:"Collection Femme",label:"Femme",objPos:"object-[65%_center] md:object-center"}].map(({href,src,alt,label,objPos})=>(
          <Link key={href} href={href} className="group relative block aspect-[3/4] md:aspect-[4/3] overflow-hidden bg-neutral-900">
            <Image src={src} alt={alt} fill priority quality={90}
              sizes="(min-width: 1280px) 620px, (min-width: 768px) 50vw, 100vw"
              className={`object-cover ${objPos} group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`}
            />
            {/* Gradient always visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            {/* Green left accent */}
            <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#3ecf4c] scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500" />
            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 md:right-auto p-4 md:p-8 text-white" style={{textShadow:"0 1px 8px rgba(0,0,0,0.8)"}}>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/70 font-bold mb-1">Collection</p>
              <h3 className="h-display text-2xl md:text-4xl mb-3 md:mb-5">{label}</h3>
              {/* Hidden on mobile by default, shown on active tap or desktop hover */}
              <span className="inline-flex items-center gap-2 bg-[#3ecf4c] text-black px-4 py-2.5 md:px-5 font-black uppercase text-[11px] tracking-[0.18em]
                opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                group-active:opacity-100 group-active:translate-y-0
                group-focus:opacity-100 group-focus:translate-y-0
                transition-all duration-200">
                Explorer
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Grid — Chaussures / Accessoires */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mt-3">
        {cats.map((c, i) => (
          <div
            key={c.slug}
            style={{
              opacity: visible ? 1 : 0,
              clipPath: visible ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
              transition: `opacity 0.05s, clip-path 0.85s cubic-bezier(0.76,0,0.24,1) ${0.58 + i * 0.12}s`,
            }}
          >
            <SmallTile {...c} sizes="(min-width: 768px) 40vw, 50vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

function SmallTile({ slug, label, image, sizes }: {
  slug: string; label: string; image: string; sizes: string;
}) {
  return (
    <Link href={`/${slug}`} className="group relative block aspect-[3/4] md:aspect-[4/3] overflow-hidden bg-neutral-900">
      <Image src={image} alt={label} fill priority quality={85} sizes={sizes}
        className="object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
      />
      {/* Gradient always visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      {/* Green left accent */}
      <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#3ecf4c] scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500" />
      <div className="hidden md:block absolute inset-0 border border-transparent group-hover:border-[#3ecf4c]/40 transition-colors duration-300" />
      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white" style={{textShadow:"0 1px 8px rgba(0,0,0,0.9)"}}>
        <p className="hidden md:block text-[9px] uppercase tracking-[0.35em] text-white/60 font-bold mb-1">Catégorie</p>
        <h3 className="h-display text-xl md:text-3xl leading-none mb-2.5 md:mb-3">{label}</h3>
        <span className="inline-flex items-center gap-2 bg-[#3ecf4c] text-black px-4 py-2 md:px-4 md:py-2.5 font-black uppercase text-[10px] md:text-[11px] tracking-[0.18em]
          opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
          group-active:opacity-100 group-active:translate-y-0
          group-focus:opacity-100 group-focus:translate-y-0
          transition-all duration-200">
          Explorer
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </div>
    </Link>
  );
}
