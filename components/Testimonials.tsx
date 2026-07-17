"use client";

import { useEffect, useRef, useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";

type FeaturedReview = {
  id: string;
  name: string;
  title: string;
  text: string;
  rating: number;
  date: string;
  photo?: string;
};

const STATS = [
  { value: "500+", label: "Clients satisfaits" },
  { value: "4.8/5", label: "Note moyenne" },
  { value: "2–5 jours ouvrables", label: "Livraison estimée" },
  { value: "30 j", label: "Retours gratuits" },
];

const BUSINESS_UNIT_ID = "6a2c5605a30ac9aadd7fc293";

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

function TrustBoxCarousel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    type TP = { loadFromElement: (el: Element, force: boolean) => void };
    const win = window as Window & { Trustpilot?: TP };
    if (win.Trustpilot && ref.current) win.Trustpilot.loadFromElement(ref.current, true);
  }, []);

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="fr-FR"
      data-template-id="54ad5defc6454f065c28af8b"
      data-businessunit-id={BUSINESS_UNIT_ID}
      data-style-height="240px"
      data-style-width="100%"
      data-theme="light"
      data-stars="4,5"
    >
      <a href="https://www.trustpilot.com/review/lecomax.com" target="_blank" rel="noopener noreferrer">
        Voir nos avis Trustpilot
      </a>
    </div>
  );
}

function TrustBoxMini() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    type TP = { loadFromElement: (el: Element, force: boolean) => void };
    const win = window as Window & { Trustpilot?: TP };
    if (win.Trustpilot && ref.current) win.Trustpilot.loadFromElement(ref.current, true);
  }, []);

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="fr-FR"
      data-template-id="5419b6ffb0d04a076446a9af"
      data-businessunit-id={BUSINESS_UNIT_ID}
      data-style-height="24px"
      data-style-width="160px"
      data-theme="light"
    >
      <a href="https://www.trustpilot.com/review/lecomax.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-neutral-500">
        Trustpilot
      </a>
    </div>
  );
}

function FeaturedStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="14" height="14" viewBox="0 0 24 24"
          fill={s <= rating ? "#00b67a" : "#e5e7eb"} stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [featured, setFeatured] = useState<FeaturedReview[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadFeaturedReviews() {
      try {
        const response = await fetch("/api/trustpilot-featured/", {
          signal: controller.signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;

        const payload = await response.json().catch(() => null);
        if (active && Array.isArray(payload?.reviews)) {
          setFeatured(payload.reviews);
        }
      } catch (error) {
        // Featured reviews are optional. Keep the Trustpilot widget and page
        // usable when the local API or network is temporarily unavailable.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    void loadFeaturedReviews();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return (
    <section className="border-t border-line bg-neutral-50/60">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 border-b border-line">
        {STATS.map((s, i) => (
          <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 120} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-16">
        <ScrollReveal direction="up">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="label-eyebrow">Avis vérifiés</p>
              <h2 className="h-display text-3xl md:text-5xl mt-2">Ils nous font confiance</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <TrustBoxMini />
              <a
                href="https://www.trustpilot.com/review/lecomax.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-[#00b67a] hover:underline"
              >
                Voir tous les avis →
              </a>
            </div>
          </div>
        </ScrollReveal>

        <TrustBoxCarousel />

        {/* Featured reviews from admin (shown below TrustBox when available) */}
        {featured.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((r) => (
              <div key={r.id}
                className="bg-white rounded-2xl border border-neutral-100 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {r.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo} alt={r.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#e8f8f0] flex items-center justify-center shrink-0 text-[#00b67a] font-black text-sm">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-neutral-900 truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <FeaturedStars rating={r.rating} />
                        <span className="text-[10px] text-neutral-400">
                          {new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Trustpilot logo */}
                  <svg width="18" height="18" viewBox="0 0 127.1 117.5" className="shrink-0 opacity-50 mt-0.5">
                    <polygon fill="#00b67a" points="63.6 0 82.9 55.7 141.4 55.7 96 90.1 113.5 143.8 68.1 109.4 22.7 143.8 40.2 90.1 -5.2 55.7 53.3 55.7" transform="scale(0.9)"/>
                  </svg>
                </div>
                {r.title && (
                  <p className="text-sm font-semibold text-neutral-900 leading-tight">{r.title}</p>
                )}
                <p className="text-sm text-neutral-600 leading-relaxed flex-1">{r.text}</p>
                <a href="https://www.trustpilot.com/review/lecomax.com" target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-[#00b67a] font-bold hover:underline">
                  Voir sur Trustpilot ↗
                </a>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-x-8 gap-y-3 text-[12px] text-neutral-500 font-semibold border-t border-neutral-100 pt-8 flex-wrap">
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            Avis clients authentiques
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#00b67a">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Avis Trustpilot vérifiés
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <a
            href="https://www.trustpilot.com/evaluate/lecomax.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#00b67a] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Laisser un avis
          </a>
        </div>
      </div>
    </section>
  );
}
