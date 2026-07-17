"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useProductColor } from "./ProductColorContext";

const colorMap: Record<string, string> = {
  "Noir": "#0a0a0a", "Blanc": "#f5f5f5", "Blanc casse": "#fafaf5",
  "Édition Standard": "#1a1a2e",
  "Gris": "#9ca3af", "Gris chine": "#d1d5db", "Gris fonce": "#4b5563",
  "Gris anthracite": "#374151", "Bleu": "#3b82f6", "Bleu marine": "#1e3a5f",
  "Bleu nuit": "#1e2a4a", "Bleu ciel": "#7dd3fc", "Navy": "#1e3a5f",
  "Rouge": "#dc2626", "Bordeaux": "#7c1035", "Rose": "#f9a8d4",
  "Rose poudre": "#fcd5ce", "Corail": "#fb7185", "Vert": "#22c55e",
  "Vert militaire": "#4a5c3a", "Vert sauge": "#7c9a6f", "Kaki": "#8b7355",
  "Caramel": "#d4a574", "Beige": "#f5f0e8", "Champagne": "#f7e7ce",
  "Lilas": "#c4b5fd", "Mauve": "#a78bfa", "Violet": "#8b5cf6",
  "Marine": "#1e3a5f", "Jaune": "#facc15",
};
const getColorHex = (name: string) =>
  colorMap[name.split("/")[0].trim()] ?? "#e5e7eb";

/** Extract YouTube video ID from any YouTube URL format */
function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

/** Returns true if the URL is a YouTube link */
function isYouTube(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

export default function ProductGallery({
  images,
  name,
  badge,
  discount,
  colors,
  colorImages,
  video,
}: {
  images: string[];
  name: string;
  badge?: string;
  discount?: number;
  colors?: string[];
  colorImages?: Record<string, string>;
  video?: string;
}) {
  // active: index into images, or "video" sentinel
  const [active, setActive] = useState<number | "video">(video ? "video" : 0);
  const { color: selectedColor, setColor: setSelectedColor } = useProductColor();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // Filter out empty/invalid image strings and ensure at least a placeholder
  const validImages = images.filter(Boolean);
  const safeImages = validImages.length > 0 ? validImages : ["/images/no-image.svg"];

  // Build the full list of "slides": video first (if any), then images
  const slides: Array<"video" | number> = [
    ...(video ? (["video"] as const) : []),
    ...safeImages.map((_, i) => i as number),
  ];
  const activeIndex = slides.indexOf(active);

  const goTo = useCallback(
    (idx: number) => {
      const clamped = (idx + slides.length) % slides.length;
      setActive(slides[clamped]);
    },
    [slides]
  );

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  // Auto-scroll thumbs strip to keep active thumb visible
  useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip) return;
    const activeThumb = strip.children[activeIndex] as HTMLElement | undefined;
    if (!activeThumb) return;
    const stripLeft = strip.scrollLeft;
    const stripRight = stripLeft + strip.clientWidth;
    const thumbLeft = activeThumb.offsetLeft;
    const thumbRight = thumbLeft + activeThumb.offsetWidth;
    if (thumbLeft < stripLeft) {
      strip.scrollTo({ left: thumbLeft - 8, behavior: "smooth" });
    } else if (thumbRight > stripRight) {
      strip.scrollTo({ left: thumbRight - strip.clientWidth + 8, behavior: "smooth" });
    }
  }, [activeIndex]);

  // When viewing a photo and video exists, return to video after 30s of inactivity
  useEffect(() => {
    if (!video || active === "video") return;
    idleTimer.current = setTimeout(() => setActive("video"), 30_000);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [active, video]);

  const hasColorPicker = !!(colors && colors.length > 0 && colorImages);

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    if (colorImages?.[color]) {
      const idx = safeImages.indexOf(colorImages[color]);
      if (idx >= 0) setActive(idx);
    }
  };

  // Sync gallery image when color changes via ProductActions color picker
  useEffect(() => {
    if (!hasColorPicker || !selectedColor) return;
    if (colorImages?.[selectedColor]) {
      const idx = safeImages.indexOf(colorImages[selectedColor]);
      if (idx >= 0) setActive(idx);
    }
  }, [selectedColor]);

  // A gallery thumbnail is also a variant selector. Keep the selected color
  // synchronized when customers click or swipe directly to a color image.
  useEffect(() => {
    if (!hasColorPicker || typeof active !== "number" || !colorImages) return;
    const activeImage = safeImages[active];
    const matchingColor = Object.entries(colorImages).find(([, image]) => image === activeImage)?.[0];
    if (matchingColor && matchingColor !== selectedColor) setSelectedColor(matchingColor);
  }, [active, hasColorPicker, colorImages, safeImages, selectedColor, setSelectedColor]);

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Main view */}
      <div data-main-gallery-img className="relative aspect-square bg-neutral-100 overflow-hidden group">
        {active === "video" && video ? (
          isYouTube(video) ? (
            <iframe
              key={video}
              src={`https://www.youtube.com/embed/${getYouTubeId(video)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeId(video)}&controls=1&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
          <video
            key={video}
            src={video}
            autoPlay
            muted
            loop
            playsInline
            poster={safeImages[0]}
            className="absolute inset-0 w-full h-full object-cover"
          />
          )
        ) : (
          <Image
            src={safeImages[active as number]}
            alt={name}
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            priority
          />
        )}
        {/* Badges overlay (only on images) */}
        {active !== "video" && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {discount && (
              <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 uppercase tracking-wide">
                -{discount}%
              </span>
            )}
            {badge && (
              <span className="bg-black text-white text-[11px] font-black px-2.5 py-1 uppercase tracking-wide">
                {badge}
              </span>
            )}
          </div>
        )}
        {/* Main image prev/next arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goPrev}
              aria-label="Image précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black hover:text-white hover:border-black transition-all duration-200 shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={goNext}
              aria-label="Image suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black hover:text-white hover:border-black transition-all duration-200 shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip with prev/next arrows */}
      <div className="relative flex items-center gap-2">
        {/* Prev arrow */}
        <button
          onClick={goPrev}
          aria-label="Image précédente"
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border border-neutral-200 bg-white hover:bg-black hover:text-white hover:border-black transition-all duration-200 ${
            slides.length <= 1 ? "opacity-0 pointer-events-none" : ""
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Thumbnails */}
        <div ref={thumbsRef} className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {/* Video thumbnail */}
          {video && (
            <button
              onClick={() => setActive("video")}
              className={`relative flex-shrink-0 w-[72px] h-[72px] bg-neutral-900 border-2 transition-colors overflow-hidden flex items-center justify-center ${
                active === "video"
                  ? "border-black"
                  : "border-transparent hover:border-neutral-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isYouTube(video) ? `https://img.youtube.com/vi/${getYouTubeId(video)}/mqdefault.jpg` : safeImages[0]}
                alt="Vidéo"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <span className="relative z-10 text-white text-2xl leading-none">▶</span>
            </button>
          )}
          {safeImages.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-[72px] h-[72px] bg-neutral-100 border-2 transition-colors overflow-hidden ${
                active === i
                  ? "border-black"
                  : "border-transparent hover:border-neutral-300"
              }`}
            >
              <Image
                src={src}
                alt={`${name} vue ${i + 1}`}
                fill
                sizes="72px"
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {/* Next arrow */}
        <button
          onClick={goNext}
          aria-label="Image suivante"
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border border-neutral-200 bg-white hover:bg-black hover:text-white hover:border-black transition-all duration-200 ${
            slides.length <= 1 ? "opacity-0 pointer-events-none" : ""
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
