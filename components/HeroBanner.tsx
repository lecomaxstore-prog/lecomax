"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeroBannerRecord } from "@/lib/hero-banners";

export default function HeroBanner({ banners = [], heroImage, heroImageMobile, shippingCost }: { banners?: HeroBannerRecord[]; heroImage?: string; heroImageMobile?: string; shippingCost?: string }) {
  const shippingLabel = shippingCost ? `Livraison ${shippingCost} MAD` : "Livraison 35 MAD";
  const fallback: HeroBannerRecord = { id: "fallback", title: "Sport. Tech. Style.", subtitle: `${shippingLabel} · Retours gratuits 30 j · Paiement à la livraison`, badge: "Boutique en ligne · Maroc", button_label: "Découvrir la collection", button_href: "/boutique", button2_label: "Voir les promos", button2_href: "/promotions", image_desktop: heroImage || "/images/hero secrtion/hero section web version.png", image_mobile: heroImageMobile || "/images/hero secrtion/hero section mobile version.png", overlay_opacity: 48, sort_order: 0, active: true, created_at: "" };
  const slides = banners.length ? banners : [fallback];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => { if (active >= slides.length) setActive(0); }, [active, slides.length]);
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

  return <section aria-roledescription="carrousel" aria-label="Sélection L'ecomax" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} className="group relative min-h-[calc(100svh-60px)] w-full overflow-hidden bg-neutral-950 md:min-h-[620px] md:max-h-[820px] md:h-[calc(100svh-97px)]">
    <div key={`${slide.id}-desktop`} className="absolute inset-0 hidden motion-safe:animate-[fadeIn_.7s_ease-out] md:block"><Image src={desktopSrc} alt="" priority={active === 0} fill sizes="100vw" className="object-cover object-center" unoptimized={desktopSrc.startsWith("http")} /></div>
    <div key={`${slide.id}-mobile`} className="absolute inset-0 motion-safe:animate-[fadeIn_.7s_ease-out] md:hidden"><Image src={mobileSrc} alt="" priority={active === 0} fill sizes="100vw" className="object-cover object-center" unoptimized={mobileSrc.startsWith("http")} /></div>
    <div className="absolute inset-0 hidden md:block" style={{ background: `linear-gradient(90deg,rgba(0,0,0,${Math.min(.92, overlay + .28)}) 0%,rgba(0,0,0,${overlay}) 42%,rgba(0,0,0,.08) 75%)` }} />
    <div className="absolute inset-0 md:hidden" style={{ background: `linear-gradient(180deg,rgba(0,0,0,.05) 24%,rgba(0,0,0,${Math.max(.15, overlay * .5)}) 55%,rgba(0,0,0,${Math.min(.96, overlay + .4)}) 100%)` }} />

    <div className="relative z-10 mx-auto flex h-full min-h-[calc(100svh-60px)] max-w-7xl items-end px-5 pb-20 pt-28 text-white md:min-h-[620px] md:items-center md:px-10 md:pb-0 md:pt-0 lg:px-16">
      <div className="max-w-2xl motion-safe:animate-[fadeIn_.55s_ease-out]">
        {slide.badge && <p className="mb-3 flex items-center gap-3 text-[9px] font-black uppercase tracking-[.34em] text-[#3ecf4c] md:mb-5 md:text-[11px]"><span className="hidden h-px w-8 bg-[#3ecf4c] md:block" />{slide.badge}</p>}
        {slide.title && <h1 className="h-display whitespace-pre-line text-[3.25rem] leading-[.88] tracking-[-.03em] md:text-7xl lg:text-8xl">{slide.title}</h1>}
        {slide.subtitle && <p className="mt-4 max-w-md text-xs leading-relaxed text-white/70 md:mt-6 md:text-[15px]">{slide.subtitle}</p>}
        {(slide.button_label && slide.button_href) || (slide.button2_label && slide.button2_href) ? <div key={`${slide.id}-actions`} className="hero-cta-row mt-5 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
          {slide.button_label && slide.button_href && <Link href={slide.button_href} className="hero-cta hero-cta-primary group relative inline-flex min-h-12 flex-1 items-center justify-center gap-3 overflow-hidden bg-[#3ecf4c] px-5 text-[10px] font-black uppercase tracking-[.14em] text-black shadow-[0_12px_35px_rgba(62,207,76,.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#4be05a] hover:shadow-[0_18px_45px_rgba(62,207,76,.35)] active:translate-y-0 active:scale-[.98] md:flex-none md:px-8">
            <span aria-hidden="true" className="hero-cta-shine absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/40 blur-[2px]" />
            <span className="relative z-10">{slide.button_label}</span>
            <span aria-hidden="true" className="hero-cta-arrow relative z-10 text-base leading-none transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </Link>}
          {slide.button2_label && slide.button2_href && <Link href={slide.button2_href} className="hero-cta hero-cta-secondary group relative inline-flex min-h-12 flex-1 items-center justify-center overflow-hidden border border-white/35 bg-black/15 px-5 text-[10px] font-black uppercase tracking-[.12em] text-white shadow-[0_10px_30px_rgba(0,0,0,.14)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-black hover:shadow-[0_18px_40px_rgba(0,0,0,.22)] active:translate-y-0 active:scale-[.98] md:flex-none">
            <span aria-hidden="true" className="hero-cta-shine absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/35 blur-[2px]" />
            <span className="relative z-10">{slide.button2_label}</span>
          </Link>}
        </div> : null}
      </div>
    </div>

    {slides.length > 1 && <><button type="button" onClick={() => go(-1)} aria-label="Bannière précédente" className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white opacity-0 backdrop-blur transition hover:bg-white hover:text-black group-hover:opacity-100 md:flex">←</button><button type="button" onClick={() => go(1)} aria-label="Bannière suivante" className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white opacity-0 backdrop-blur transition hover:bg-white hover:text-black group-hover:opacity-100 md:flex">→</button><div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur md:bottom-7">{slides.map((item, index) => <button key={item.id} type="button" onClick={() => setActive(index)} aria-label={`Afficher la bannière ${index + 1}`} aria-current={index === active} className={`h-1.5 rounded-full transition-all ${index === active ? "w-7 bg-[#3ecf4c]" : "w-1.5 bg-white/50 hover:bg-white"}`} />)}</div></>}
  </section>;
}
