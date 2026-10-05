"use client";
import { RETURN_POLICY } from "@/lib/return-policy";

import { BRAND_COPY, marketplaceHeadline } from "@/mobile/src/lib/brand-copy";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { HeroBannerRecord } from "@/lib/hero-banners";
import { useShippingConfig } from '@/lib/use-settings';
import { formatShippingAmount } from '@/lib/shipping-config';

type Props = {
  banners?: HeroBannerRecord[];
  heroImage?: string;
  heroImageMobile?: string;
  shippingCost?: string;
};

export default function HeroBanner({ banners = [], heroImage, heroImageMobile, shippingCost }: Props) {
  const shipping = useShippingConfig();
  const shippingLabel = `Livraison ${formatShippingAmount(shipping.cost)} MAD`;
  const fallback: HeroBannerRecord = {
    id: "fallback",
    title: BRAND_COPY.fr.tagline,
    subtitle: `${shippingLabel} · ${RETURN_POLICY.summary} · Paiement à la livraison`,
    badge: "Marketplace lifestyle · Maroc",
    button_label: "Découvrir la collection",
    button_href: "/boutique",
    button2_label: "Voir les promos",
    button2_href: "/promotions",
    image_desktop: heroImage || "/images/hero secrtion/hero section web version.png",
    image_mobile: heroImageMobile || "/images/hero secrtion/hero section mobile version.png",
    overlay_opacity: 48,
    sort_order: 0,
    active: true,
    created_at: "",
  };
  const slides = banners.length ? banners : [fallback];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  useEffect(() => {
    if (slides.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[active] ?? fallback;
  const desktopSrc = slide.image_desktop || fallback.image_desktop!;
  const mobileSrc = slide.image_mobile || slide.image_desktop || fallback.image_mobile!;
  const overlay = Math.max(0, Math.min(0.9, Number(slide.overlay_opacity) / 100));
  const go = (direction: number) => setActive((index) => (index + direction + slides.length) % slides.length);

  function moveCamera(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    heroRef.current?.style.setProperty("--hero-x", `${x * 18}px`);
    heroRef.current?.style.setProperty("--hero-y", `${y * 12}px`);
    heroRef.current?.style.setProperty("--hero-ry", `${x * 1.8}deg`);
    heroRef.current?.style.setProperty("--hero-rx", `${y * -1.2}deg`);
    heroRef.current?.style.setProperty("--hero-copy-x", `${x * -5}px`);
    heroRef.current?.style.setProperty("--hero-copy-y", `${y * -4}px`);
  }

  function resetCamera() {
    setPaused(false);
    heroRef.current?.style.setProperty("--hero-x", "0px");
    heroRef.current?.style.setProperty("--hero-y", "0px");
    heroRef.current?.style.setProperty("--hero-ry", "0deg");
    heroRef.current?.style.setProperty("--hero-rx", "0deg");
    heroRef.current?.style.setProperty("--hero-copy-x", "0px");
    heroRef.current?.style.setProperty("--hero-copy-y", "0px");
  }

  return (
    <section
      ref={heroRef}
      aria-roledescription="carrousel"
      aria-label="Sélection L'ecomax"
      onPointerMove={moveCamera}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={resetCamera}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      className={`hero-cinema group relative min-h-[calc(100svh-60px)] w-full overflow-hidden bg-neutral-950 md:h-[calc(100svh-97px)] md:min-h-[620px] md:max-h-[820px] ${paused ? "is-paused" : ""}`}
    >
      <div aria-hidden="true" className="hero-fill-backdrop absolute inset-0">
        <div key={`${slide.id}-backdrop-desktop`} className="absolute inset-0 hidden md:block">
          <Image src={desktopSrc} alt="" fill sizes="100vw" className="object-cover object-center" unoptimized={desktopSrc.startsWith("http")} />
        </div>
        <div key={`${slide.id}-backdrop-mobile`} className="absolute inset-0 md:hidden">
          <Image src={mobileSrc} alt="" fill sizes="100vw" className="object-cover object-center" unoptimized={mobileSrc.startsWith("http")} />
        </div>
      </div>
      <div className="hero-3d-stage absolute inset-0">
        <div className="hero-3d-camera absolute inset-0">
          <div key={`${slide.id}-desktop`} className="hero-cinematic-image absolute inset-0 hidden md:block">
            <Image src={desktopSrc} alt="" priority={active === 0} fill sizes="100vw" className="object-cover object-[center_65%]" unoptimized={desktopSrc.startsWith("http")} />
          </div>
          <div key={`${slide.id}-mobile`} className="hero-cinematic-image absolute inset-0 md:hidden">
            <Image src={mobileSrc} alt="" priority={active === 0} fill sizes="100vw" className="object-cover object-top" unoptimized={mobileSrc.startsWith("http")} />
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="hero-depth-grid absolute inset-x-0 bottom-0 hidden h-[45%] md:block" />
      <div aria-hidden="true" className="hero-light-orb absolute -right-[12%] -top-[30%] hidden h-[75%] w-[55%] rounded-full md:block" />
      <div aria-hidden="true" className="hero-light-sweep absolute inset-y-[-20%] -left-1/3 hidden w-1/4 md:block" />
      <div aria-hidden="true" className="hero-film-grain absolute inset-0" />
      <div className="absolute inset-0 hidden md:block" style={{ background: `linear-gradient(90deg,rgba(0,0,0,${Math.min(.92, overlay + .28)}) 0%,rgba(0,0,0,${overlay}) 42%,rgba(0,0,0,.08) 75%)` }} />
      <div className="absolute inset-0 md:hidden" style={{ background: `linear-gradient(180deg,rgba(0,0,0,.05) 24%,rgba(0,0,0,${Math.max(.15, overlay * .5)}) 55%,rgba(0,0,0,${Math.min(.96, overlay + .4)}) 100%)` }} />
      <div aria-hidden="true" className="hero-vignette absolute inset-0" />

      <div className="relative z-10 mx-auto flex h-full min-h-[calc(100svh-60px)] max-w-7xl items-end px-5 pb-20 pt-28 text-white md:min-h-[620px] md:items-center md:px-10 md:pb-0 md:pt-0 lg:px-16">
        <div key={`${slide.id}-copy`} className="hero-copy-3d max-w-2xl">
          {slide.badge && (
            <p className="hero-eyebrow mb-3 flex items-center gap-3 text-[9px] font-black uppercase tracking-[.34em] text-[#3ecf4c] md:mb-5 md:text-[11px]">
              <span className="hero-divider hidden h-px w-8 origin-left bg-[#3ecf4c] md:block" />
              {slide.badge}
            </p>
          )}
          {slide.title && <h1 className="hero-headline h-display whitespace-pre-line text-[3.25rem] leading-[.88] tracking-[-.03em] [text-shadow:0_18px_55px_rgba(0,0,0,.35)] md:text-7xl lg:text-8xl">{marketplaceHeadline(slide.title, "fr")}</h1>}
          {slide.subtitle && <p className="hero-sub mt-4 max-w-md text-xs leading-relaxed text-white/70 md:mt-6 md:text-[15px]">{slide.subtitle}</p>}
          {(slide.button_label && slide.button_href) || (slide.button2_label && slide.button2_href) ? (
            <div key={`${slide.id}-actions`} className="hero-ctas hero-cta-row mt-5 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
              {slide.button_label && slide.button_href && (
                <Link href={slide.button_href} className="hero-cta hero-cta-primary group relative inline-flex min-h-12 flex-1 items-center justify-center gap-3 overflow-hidden bg-[#3ecf4c] px-5 text-[10px] font-black uppercase tracking-[.14em] text-black shadow-[0_12px_35px_rgba(62,207,76,.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#4be05a] hover:shadow-[0_18px_45px_rgba(62,207,76,.35)] active:translate-y-0 active:scale-[.98] md:flex-none md:px-8">
                  <span aria-hidden="true" className="hero-cta-shine absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/40 blur-[2px]" />
                  <span className="relative z-10">{slide.button_label}</span>
                  <span aria-hidden="true" className="hero-cta-arrow relative z-10 text-base leading-none transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                </Link>
              )}
              {slide.button2_label && slide.button2_href && (
                <Link href={slide.button2_href} className="hero-cta hero-cta-secondary group relative inline-flex min-h-12 flex-1 items-center justify-center overflow-hidden border border-white/35 bg-black/15 px-5 text-[10px] font-black uppercase tracking-[.12em] text-white shadow-[0_10px_30px_rgba(0,0,0,.14)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-black hover:shadow-[0_18px_40px_rgba(0,0,0,.22)] active:translate-y-0 active:scale-[.98] md:flex-none">
                  <span aria-hidden="true" className="hero-cta-shine absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/35 blur-[2px]" />
                  <span className="relative z-10">{slide.button2_label}</span>
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div aria-hidden="true" className="absolute bottom-7 left-8 z-20 hidden items-center gap-3 text-[8px] font-black uppercase tracking-[.28em] text-white/40 lg:flex"><span className="h-px w-10 bg-[#3ecf4c]/70" />Expérience immersive</div>

      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Bannière précédente" className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white opacity-0 backdrop-blur transition hover:bg-white hover:text-black group-hover:opacity-100 md:flex">←</button>
          <button type="button" onClick={() => go(1)} aria-label="Bannière suivante" className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white opacity-0 backdrop-blur transition hover:bg-white hover:text-black group-hover:opacity-100 md:flex">→</button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md md:bottom-7">
            {slides.map((item, index) => (
              <button key={item.id} type="button" onClick={() => setActive(index)} aria-label={`Afficher la bannière ${index + 1}`} aria-current={index === active} className={`hero-slide-dot relative h-1.5 overflow-hidden rounded-full transition-all ${index === active ? "w-8 bg-white/25" : "w-1.5 bg-white/45 hover:bg-white"}`}>
                {index === active && <span className="hero-slide-progress absolute inset-0 origin-left rounded-full bg-[#3ecf4c]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
