"use client";

import { useEffect, useRef, useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";

const STATS = [
  { value: "500+", label: "Clients satisfaits" },
  { value: "4.8/5", label: "Note moyenne" },
  { value: "48 h", label: "Livraison express" },
  { value: "30 j", label: "Retours gratuits" },
];

const REVIEWS = [
  {
    name: "Yassine B.",
    city: "Casablanca",
    rating: 5,
    text: "Commande reçue en 2 jours, emballage soigné et qualité au rendez-vous. Les écouteurs sont incroyables pour le prix. Je recommande à 100 %.",
    product: "Écouteurs GENAI TWS",
  },
  {
    name: "Salma E.",
    city: "Rabat",
    rating: 5,
    text: "Service client très réactif et livraison rapide. Les baskets sont confortables et exactement comme sur les photos. Bravo L'ecomax !",
    product: "BAASPLOA Running",
  },
  {
    name: "Mehdi A.",
    city: "Marrakech",
    rating: 4,
    text: "Site clair, paiement simple et suivi de commande au top. J'ai été agréablement surpris par la qualité. Je reviendrai sans hésiter.",
    product: "Accessoires Tech",
  },
];

function AnimatedStat({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="text-center md:text-left">
      <p
        className="h-display text-3xl md:text-4xl tabular-nums"
        style={{
          color: "#1e8a2a",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
        {label}
      </p>
    </div>
  );
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < rating ? "#f59e0b" : "none"}
          stroke={i < rating ? "#f59e0b" : "#e5e7eb"}
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ r }: { r: typeof REVIEWS[0] }) {
  return (
    <figure className="relative flex flex-col bg-white rounded-2xl border border-neutral-100 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.07)] transition-all duration-300 md:hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] md:hover:-translate-y-1 md:hover:border-neutral-200 overflow-hidden">
      {/* brand accent bar */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: "linear-gradient(90deg,#3ecf4c,#6bdd6b)" }} />

      {/* top row: stars + badge */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <Stars rating={r.rating} size={17} />
        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Achat vérifié
        </span>
      </div>

      {/* review text */}
      <blockquote className="text-[14px] leading-[1.8] text-neutral-700 mb-5 flex-1">
        <span className="block text-[36px] font-black leading-none text-neutral-150 select-none mb-1" style={{ color: "#e5e7eb" }}>&ldquo;</span>
        {r.text}
      </blockquote>

      {/* divider */}
      <div className="border-t border-neutral-100" />

      {/* author */}
      <figcaption className="flex items-center gap-3 pt-4">
        <span
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-[15px] shadow-sm"
          style={{ background: "#3ecf4c", color: "#000" }}
        >
          {r.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-black text-black leading-tight">{r.name}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {r.city}
            </span>
            <span className="text-neutral-200">·</span>
            <span className="truncate">{r.product}</span>
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / REVIEWS.length;
    const idx = Math.min(REVIEWS.length - 1, Math.round(el.scrollLeft / cardWidth));
    setActiveIdx(idx);
  };

  const scrollTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / REVIEWS.length;
    el.scrollTo({ left: cardWidth * i, behavior: "smooth" });
  };

  return (
    <section className="border-t border-line bg-neutral-50/60">
      {/* Stats band */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 border-b border-line">
        {STATS.map((s, i) => (
          <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 120} />
        ))}
      </div>

      {/* Reviews */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-16">
        <ScrollReveal direction="up">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="label-eyebrow">Avis vérifiés</p>
              <h2 className="h-display text-3xl md:text-5xl mt-2">Ils nous font confiance</h2>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <Stars rating={5} size={16} />
              <span className="text-[12px] text-neutral-500 font-semibold">4.8 / 5 · 47 avis</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Desktop grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <ReviewCard key={r.name} r={r} />
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto -mx-6 px-6 snap-x snap-mandatory no-scrollbar pb-2"
          >
            {REVIEWS.map((r) => (
              <div key={r.name} className="w-[85vw] shrink-0 snap-start snap-always">
                <ReviewCard r={r} />
              </div>
            ))}
          </div>

          {/* dot nav */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                aria-label={`Avis ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeIdx ? "24px" : "8px",
                  height: "8px",
                  background: i === activeIdx ? "#3ecf4c" : "#d4d4d4",
                }}
              />
            ))}
          </div>
          <p className="text-center text-[11px] text-neutral-400 mt-2 font-semibold tracking-wide">
            {activeIdx + 1} / {REVIEWS.length}
          </p>
        </div>

        {/* Bottom trust bar */}
        <div className="mt-10 flex items-center justify-center gap-x-8 gap-y-3 text-[12px] text-neutral-500 font-semibold border-t border-neutral-100 pt-8">
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            Avis clients authentiques
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Note moyenne 4.8 / 5
          </span>
        </div>
      </div>
    </section>
  );
}
