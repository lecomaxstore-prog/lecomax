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

function parseStatValue(raw: string) {
  const m = raw.match(/^(\d+\.?\d*)(.*)$/);
  if (!m) return { numeric: 0, suffix: raw, isFloat: false };
  return { numeric: parseFloat(m[1]), suffix: m[2], isFloat: m[1].includes(".") };
}

function AnimatedStat({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [display, setDisplay] = useState("0");
  const { numeric, suffix, isFloat } = parseStatValue(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setStarted(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const duration = 1600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4); // ease-out quart
      const current = numeric * eased;
      setDisplay(isFloat ? current.toFixed(1) : Math.round(current).toString());
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, numeric, isFloat]);

  return (
    <div ref={ref} className="text-center md:text-left">
      <p
        className="h-display text-3xl md:text-4xl tabular-nums stat-value-in"
        style={{ color: "#3ecf4c", animationDelay: `${delay}ms` }}
      >
        {display}{suffix}
      </p>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
        {label}
      </p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={i < rating ? "#f59e0b" : "none"}
          stroke={i < rating ? "#f59e0b" : "#d4d4d4"}
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="border-t border-line bg-neutral-50/60">
      {/* Stats band */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 border-b border-line">
        {STATS.map((s, i) => (
          <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 120} />
        ))}
      </div>

      {/* Reviews */}
      <div className="max-w-7xl mx-auto px-6 pb-20 pt-4">
        <ScrollReveal direction="up">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label-eyebrow">Avis vérifiés</p>
              <h2 className="h-display text-3xl md:text-5xl mt-2">
                Ils nous font confiance
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Stars rating={5} />
              <span className="text-[13px] text-neutral-600 font-semibold">
                4.8/5 · 47 avis
              </span>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {REVIEWS.map((r, i) => (
            <ScrollReveal key={r.name} direction="up" delay={i * 120}>
              <figure className="h-full bg-white border border-neutral-100 p-7 flex flex-col transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)] hover:-translate-y-1 hover:border-neutral-200">
                <Stars rating={r.rating} />
                <blockquote className="mt-4 text-[13.5px] leading-relaxed text-neutral-600 flex-1 italic">
                  &ldquo;{r.text}&rdquo;
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-neutral-100 flex items-center gap-3">
                  <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-[13px]" style={{ background: "#3ecf4c", color: "#000" }}>
                    {r.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold text-black">
                      {r.name}
                    </span>
                    <span className="block text-[11px] text-neutral-500">
                      {r.city} · {r.product}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
