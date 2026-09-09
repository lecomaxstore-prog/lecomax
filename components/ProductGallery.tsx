"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image, { getImageProps } from "next/image";
import { createPortal } from "react-dom";
import { useProductColor } from "./ProductColorContext";
import { resolveProductGalleryImages } from "@/lib/product-gallery-images";

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
  colorImageGalleries,
  video,
}: {
  images: string[];
  name: string;
  badge?: string;
  discount?: number;
  colors?: string[];
  colorImages?: Record<string, string>;
  colorImageGalleries?: Record<string, string[]>;
  video?: string;
}) {
  // active: index into images, or "video" sentinel
  const [active, setActive] = useState<number | "video">(0);
  const [videoPlaybackKey, setVideoPlaybackKey] = useState(0);
  const [mainControlsVisible, setMainControlsVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const { color: selectedColor } = useProductColor();
  const thumbsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Promote the selected option's photos without hiding the rest of the
  // product gallery. This keeps every angle available after variant changes.
  const safeImages = useMemo(() => {
    return resolveProductGalleryImages({
      images,
      selectedColor,
      colors,
      colorImages,
      colorImageGalleries,
    });
  }, [colorImageGalleries, colorImages, colors, images, selectedColor]);
  const activeImage = typeof active === "number" ? safeImages[active] ?? safeImages[0] : safeImages[0];

  // Build the full list of "slides": video first (if any), then images
  const slides = useMemo<Array<"video" | number>>(
    () => [
      ...(video ? (["video"] as const) : []),
      ...safeImages.map((_, i) => i as number),
    ],
    [safeImages, video]
  );
  const activeIndex = slides.indexOf(active);

  const selectSlide = useCallback(
    (slide: "video" | number) => {
      if (slide === "video") {
        // Incrementing the key remounts the player, so clicking an already
        // selected video thumbnail reliably restarts playback as well.
        setVideoPlaybackKey((key) => key + 1);
      }
      setActive(slide);

    },
    []
  );

  const goTo = useCallback(
    (idx: number) => {
      const clamped = (idx + slides.length) % slides.length;
      selectSlide(slides[clamped]);
    },
    [selectSlide, slides]
  );

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    resetZoom();
  }, [resetZoom]);

  const changeLightboxImage = useCallback((direction: -1 | 1) => {
    if (safeImages.length < 2 || typeof active !== "number") return;
    selectSlide((active + direction + safeImages.length) % safeImages.length);
    resetZoom();
  }, [active, resetZoom, safeImages.length, selectSlide]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") changeLightboxImage(-1);
      if (event.key === "ArrowRight") changeLightboxImage(1);
      if (event.key === "+" || event.key === "=") setZoom((value) => Math.min(4, value + 0.5));
      if (event.key === "-") setZoom((value) => Math.max(1, value - 0.5));
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [changeLightboxImage, closeLightbox, lightboxOpen]);

  // Auto-scroll thumbs strip to keep active thumb visible
  useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip) return;
    const activeThumb = strip.querySelector<HTMLElement>(`[data-gallery-thumb="${activeIndex}"]`);
    if (!activeThumb) return;
    activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setMainControlsVisible(true);
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 48) return;
    if (distance > 0) goPrev();
    else goNext();
  };

  // The video element mounts after the click state update. Calling play here
  // makes playback reliable across browsers while muted autoplay remains safe.
  useEffect(() => {
    if (active !== "video" || !video || isYouTube(video)) return;
    const player = videoRef.current;
    if (!player) return;
    player.currentTime = 0;
    void player.play().catch(() => {
      // A later click on the video thumbnail retries playback.
    });
  }, [active, video, videoPlaybackKey]);

  const hasColorPicker = !!(colors && colors.length > 0 && (colorImageGalleries || colorImages));

  // Each color owns an independent ordered gallery. Always start on its
  // primary image, without changing scroll position or reopening the video.
  useEffect(() => {
    if (!hasColorPicker || !selectedColor) return;
    setActive(0);
    resetZoom();
  }, [hasColorPicker, resetZoom, selectedColor]);

  // Preload only the primary image of the other variants for fast swatches
  // without downloading every secondary gallery image up front.
  useEffect(() => {
    if (!colorImageGalleries) return;
    for (const [variantColor, variantImages] of Object.entries(colorImageGalleries)) {
      if (variantColor === selectedColor || !variantImages[0]) continue;
      const { props } = getImageProps({
        src: variantImages[0],
        alt: "",
        width: 960,
        height: 960,
        sizes: "(min-width: 1024px) 55vw, 100vw",
      });
      const preload = new window.Image();
      preload.srcset = props.srcSet ?? "";
      preload.sizes = props.sizes ?? "";
      preload.src = String(props.src);
    }
  }, [colorImageGalleries, selectedColor]);

  return (
    <>
    <div className="flex flex-col gap-3 min-w-0">
      {/* Main view */}
      <div
        data-main-gallery-img
        className="group relative aspect-square touch-pan-y overflow-hidden bg-neutral-100"
        onMouseEnter={() => setMainControlsVisible(true)}
        onMouseLeave={() => setMainControlsVisible(false)}
        onClick={() => setMainControlsVisible(true)}
        onFocusCapture={() => setMainControlsVisible(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setMainControlsVisible(false);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {active === "video" && video ? (
          isYouTube(video) ? (
            <iframe
              key={`${video}-${videoPlaybackKey}`}
              src={`https://www.youtube.com/embed/${getYouTubeId(video)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeId(video)}&controls=1&rel=0&modestbranding=1&vq=hd1080`}
              title={`${name} — vidéo du produit`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
          <video
            ref={videoRef}
            key={`${video}-${videoPlaybackKey}`}
            src={video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={safeImages[0]}
            onCanPlay={(event) => {
              void event.currentTarget.play().catch(() => {
                // A later click on the video thumbnail retries playback.
              });
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          )
        ) : (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Agrandir l'image de ${name}`}
            className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black"
          >
            <Image
              src={activeImage}
              alt={name}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              priority
            />
            <span className="absolute bottom-4 right-4 flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 text-[10px] font-bold uppercase tracking-[.08em] text-neutral-800 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M11 8v6M8 11h6" />
              </svg>
              Agrandir
            </span>
          </button>
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
        {slides.length > 1 && mainControlsVisible && (
          <>
            <button
              onClick={goPrev}
              aria-label="Image précédente"
              className="absolute left-2 top-1/2 z-10 hidden sm:flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-black/10 bg-white/90 text-neutral-950 opacity-100 shadow-[0_8px_24px_rgba(0,0,0,.12)] backdrop-blur-sm transition-all duration-200 hover:border-black hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:left-3 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={goNext}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 z-10 hidden sm:flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-black/10 bg-white/90 text-neutral-950 opacity-100 shadow-[0_8px_24px_rgba(0,0,0,.12)] backdrop-blur-sm transition-all duration-200 hover:border-black hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:right-3 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip with prev/next arrows */}
      <div className="relative flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-[22px] border border-neutral-200/80 bg-neutral-50/90 p-2 shadow-[0_10px_32px_rgba(15,23,42,.07)] sm:gap-2.5 sm:p-2.5">
        {/* Prev arrow */}
        {slides.length > 1 && (
          <button
            onClick={goPrev}
            aria-label="Image précédente"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-700 shadow-[0_3px_10px_rgba(15,23,42,.07)] transition-all duration-200 hover:scale-105 hover:border-neutral-300 hover:bg-neutral-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:h-11 sm:w-11"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Thumbnails */}
        <div
          ref={thumbsRef}
          className="w-0 min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth px-0.5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="mx-auto flex w-max min-w-max items-center gap-2 sm:gap-2.5">
            {/* Video thumbnail */}
            {video && (
              <button
                type="button"
                onClick={() => selectSlide("video")}
                data-gallery-thumb="0"
                aria-label="Voir la vidéo du produit"
                aria-pressed={active === "video"}
                className={`relative flex h-[62px] w-[62px] flex-shrink-0 snap-center items-center justify-center overflow-hidden rounded-2xl border bg-neutral-900 transition-all duration-200 sm:h-[70px] sm:w-[70px] ${
                  active === "video"
                    ? "z-[1] border-2 border-neutral-950 shadow-[0_5px_14px_rgba(15,23,42,.18)]"
                    : "border-white opacity-90 shadow-sm hover:-translate-y-0.5 hover:opacity-100 hover:shadow-md"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isYouTube(video) ? `https://img.youtube.com/vi/${getYouTubeId(video)}/mqdefault.jpg` : safeImages[0]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-65"
                />
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 pl-0.5 text-[11px] leading-none text-black shadow-md">▶</span>
              </button>
            )}
            {safeImages.map((src, i) => {
              const slideIndex = video ? i + 1 : i;
              return (
                <button
                  type="button"
                  key={`${src}-${i}`}
                  onClick={() => selectSlide(i)}
                  data-gallery-thumb={slideIndex}
                  aria-label={`${name}, vue ${i + 1}`}
                  aria-pressed={active === i}
                  aria-current={active === i ? "true" : undefined}
                  className={`relative h-[62px] w-[62px] flex-shrink-0 snap-center overflow-hidden rounded-2xl border bg-white transition-all duration-200 sm:h-[70px] sm:w-[70px] ${
                    active === i
                      ? "z-[1] border-2 border-neutral-950 shadow-[0_5px_14px_rgba(15,23,42,.18)]"
                      : "border-white shadow-sm hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-md"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 639px) 62px, 70px"
                    className="object-cover transition-transform duration-300 hover:scale-[1.04]"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Next arrow */}
        {slides.length > 1 && (
          <button
            onClick={goNext}
            aria-label="Image suivante"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-700 shadow-[0_3px_10px_rgba(15,23,42,.07)] transition-all duration-200 hover:scale-105 hover:border-neutral-300 hover:bg-neutral-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:h-11 sm:w-11"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
      {mounted && lightboxOpen && typeof active === "number" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galerie agrandie de ${name}`}
          className="fixed inset-0 z-[1000] flex flex-col bg-[#f4f5f5]"
        >
          <div className="absolute left-4 top-4 z-30 rounded-full bg-white/90 px-3 py-2 text-[11px] font-semibold tabular-nums text-neutral-600 shadow-sm backdrop-blur">
            {active + 1} / {safeImages.length}
          </div>

          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Fermer la galerie"
            className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-900 shadow-sm transition hover:scale-105 hover:bg-neutral-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => changeLightboxImage(-1)}
                aria-label="Image précédente"
                className="absolute left-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-sm transition hover:bg-neutral-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black sm:left-6"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button
                type="button"
                onClick={() => changeLightboxImage(1)}
                aria-label="Image suivante"
                className="absolute right-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 shadow-sm transition hover:bg-neutral-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black sm:right-6"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </>
          )}

          <div
            className={`relative min-h-0 flex-1 overflow-hidden ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
            onWheel={(event) => {
              event.preventDefault();
              const nextZoom = Math.max(1, Math.min(4, zoom + (event.deltaY < 0 ? 0.25 : -0.25)));
              setZoom(nextZoom);
              if (nextZoom === 1) setPan({ x: 0, y: 0 });
            }}
            onPointerDown={(event) => {
              if (zoom <= 1) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
            }}
            onPointerMove={(event) => {
              if (!dragRef.current || zoom <= 1) return;
              setPan({
                x: dragRef.current.panX + event.clientX - dragRef.current.x,
                y: dragRef.current.panY + event.clientY - dragRef.current.y,
              });
            }}
            onPointerUp={() => { dragRef.current = null; }}
            onPointerCancel={() => { dragRef.current = null; }}
            onDoubleClick={() => {
              if (zoom > 1) resetZoom();
              else setZoom(2);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={`${name}, vue ${active + 1}`}
              draggable={false}
              className="h-full w-full select-none object-contain p-4 pb-24 pt-16 transition-transform duration-200 ease-out sm:p-8 sm:pb-28 sm:pt-20"
              style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex flex-col items-center gap-3 px-4">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-neutral-200 bg-white/95 p-1.5 shadow-[0_10px_35px_rgba(15,23,42,.13)] backdrop-blur">
              <button type="button" onClick={() => { setZoom((value) => Math.max(1, value - 0.5)); if (zoom <= 1.5) setPan({ x: 0, y: 0 }); }} aria-label="Réduire" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 disabled:opacity-30" disabled={zoom <= 1}>−</button>
              <button type="button" onClick={resetZoom} className="min-w-14 rounded-full px-2 py-2 text-[11px] font-bold tabular-nums hover:bg-neutral-100" aria-label="Réinitialiser le zoom">{Math.round(zoom * 100)}%</button>
              <button type="button" onClick={() => setZoom((value) => Math.min(4, value + 0.5))} aria-label="Agrandir" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 disabled:opacity-30" disabled={zoom >= 4}>+</button>
            </div>
            {safeImages.length > 1 && (
              <div className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-neutral-200 bg-white/95 p-1.5 shadow-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {safeImages.map((src, index) => (
                  <button
                    key={`${src}-lightbox-${index}`}
                    type="button"
                    onClick={() => { selectSlide(index); resetZoom(); }}
                    aria-label={`Voir l'image ${index + 1}`}
                    className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 transition sm:h-14 sm:w-14 ${active === index ? "ring-2 ring-neutral-950 ring-offset-1" : "opacity-65 hover:opacity-100"}`}
                  >
                    <Image src={src} alt="" fill sizes="56px" className="object-contain p-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
}
