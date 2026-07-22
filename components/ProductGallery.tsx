"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const [active, setActive] = useState<number | "video">(0);
  const [videoPlaybackKey, setVideoPlaybackKey] = useState(0);
  const [mainControlsVisible, setMainControlsVisible] = useState(false);
  const { color: selectedColor, setColor: setSelectedColor } = useProductColor();
  const thumbsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Filter out empty/invalid image strings and ensure at least a placeholder
  const safeImages = useMemo(() => {
    const validImages = images.filter(Boolean);
    return validImages.length > 0 ? validImages : ["/images/no-image.svg"];
  }, [images]);

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

      // Gallery navigation is an explicit customer action. When the selected
      // slide belongs to a color variant, update the shared color once here
      // instead of running a second effect that can fight the color picker.
      if (typeof slide !== "number" || !colorImages) return;
      const image = safeImages[slide];
      const matchingColor = Object.entries(colorImages).find(([, src]) => src === image)?.[0];
      if (matchingColor && matchingColor !== selectedColor) {
        setSelectedColor(matchingColor);
      }
    },
    [colorImages, safeImages, selectedColor, setSelectedColor]
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

  const hasColorPicker = !!(colors && colors.length > 0 && colorImages);

  // Sync gallery image when color changes via ProductActions color picker
  useEffect(() => {
    if (!hasColorPicker || !selectedColor) return;
    if (colorImages?.[selectedColor]) {
      const idx = safeImages.indexOf(colorImages[selectedColor]);
      if (idx >= 0) setActive(idx);
    }
  }, [colorImages, hasColorPicker, safeImages, selectedColor]);

  return (
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
              src={`https://www.youtube.com/embed/${getYouTubeId(video)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeId(video)}&controls=1&rel=0&modestbranding=1`}
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
            preload="metadata"
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
        {slides.length > 1 && mainControlsVisible && (
          <>
            <button
              onClick={goPrev}
              aria-label="Image précédente"
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-black/10 bg-white/90 text-neutral-950 opacity-100 shadow-[0_8px_24px_rgba(0,0,0,.12)] backdrop-blur-sm transition-all duration-200 hover:border-black hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:left-3 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={goNext}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-black/10 bg-white/90 text-neutral-950 opacity-100 shadow-[0_8px_24px_rgba(0,0,0,.12)] backdrop-blur-sm transition-all duration-200 hover:border-black hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:right-3 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip with prev/next arrows */}
      <div className="relative flex w-full min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:gap-2 sm:p-2">
        {/* Prev arrow */}
        {slides.length > 1 && (
          <button
            onClick={goPrev}
            aria-label="Image précédente"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:h-11 sm:w-11"
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
          <div className="mx-auto flex w-max min-w-max items-center gap-1.5 sm:gap-2">
            {/* Video thumbnail */}
            {video && (
              <button
                type="button"
                onClick={() => selectSlide("video")}
                data-gallery-thumb="0"
                aria-label="Voir la vidéo du produit"
                aria-pressed={active === "video"}
                className={`relative flex h-16 w-16 flex-shrink-0 snap-center items-center justify-center overflow-hidden rounded-xl border bg-neutral-900 shadow-sm transition-all duration-200 sm:h-[72px] sm:w-[72px] ${
                  active === "video"
                    ? "z-[1] border-neutral-950 ring-2 ring-neutral-950 ring-offset-2 ring-offset-neutral-50"
                    : "border-neutral-200 opacity-80 hover:-translate-y-0.5 hover:border-neutral-400 hover:opacity-100 hover:shadow-md"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isYouTube(video) ? `https://img.youtube.com/vi/${getYouTubeId(video)}/mqdefault.jpg` : safeImages[0]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-50"
                />
                <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 pl-0.5 text-[13px] leading-none text-black shadow-sm">▶</span>
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
                  className={`relative h-16 w-16 flex-shrink-0 snap-center overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 sm:h-[72px] sm:w-[72px] ${
                    active === i
                      ? "z-[1] border-neutral-950 ring-2 ring-neutral-950 ring-offset-2 ring-offset-neutral-50"
                      : "border-neutral-200 opacity-80 hover:-translate-y-0.5 hover:border-neutral-400 hover:opacity-100 hover:shadow-md"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 639px) 64px, 72px"
                    className="object-contain p-1.5 transition-transform duration-300 hover:scale-105"
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
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all duration-200 hover:translate-x-0.5 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:h-11 sm:w-11"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
