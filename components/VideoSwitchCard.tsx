"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export type VideoTrack = {
  id: string;
  label: string;
  src: string;
};

export type VideoSwitchCardProps = {
  photoSrc?: string;
  videoSrc?: string;
  badgeText?: string;
  brandName?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  tracks?: VideoTrack[];
  className?: string;
};

const DEFAULT_TRACKS: VideoTrack[] = [
  {
    id: "lookbook",
    label: "Lookbook Motion",
    src: "https://assets.mixkit.co/videos/preview/mixkit-models-walking-on-a-catwalk-41480-large.mp4",
  },
  {
    id: "outdoor",
    label: "Performance Tech",
    src: "https://assets.mixkit.co/videos/preview/mixkit-man-runs-on-the-beach-at-sunset-41484-large.mp4",
  },
];

export default function VideoSwitchCard({
  photoSrc = "/images/ecomax_smiling_couple.jpg",
  videoSrc,
  badgeText = "NEW COLLECTION",
  brandName = "L ' E C O M A X",
  title = "Move more.\nLive better.",
  subtitle = "Performance, style, and innovation for every day.",
  ctaLabel = "Discover",
  ctaHref = "/boutique",
  tracks = DEFAULT_TRACKS,
  className = "",
}: VideoSwitchCardProps) {
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [isMuted, setIsMuted] = useState(true);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(videoSrc || tracks[0]?.src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTrackMenu, setShowTrackMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleModeChange = (newMode: "photo" | "video") => {
    setMode(newMode);
    if (newMode === "video") {
      if (videoRef.current) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setShowTrackMenu(false);
    }
  };

  const toggleSound = () => {
    if (mode !== "video" || !videoRef.current) return;
    const nextMuteState = !isMuted;
    videoRef.current.muted = nextMuteState;
    setIsMuted(nextMuteState);
  };

  const selectTrack = (trackSrc: string) => {
    setCurrentVideoSrc(trackSrc);
    if (videoRef.current) {
      videoRef.current.src = trackSrc;
      videoRef.current.play().then(() => setIsPlaying(true));
    }
  };

  return (
    <div className={`relative w-full max-w-md mx-auto font-sans ${className}`}>
      {/* Top Floating Control Bar */}
      <div className="mb-3.5 flex items-center justify-between px-1">
        {/* Mode Switcher Pill */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-1 rounded-full flex items-center gap-1 shadow-2xl">
          <button
            type="button"
            onClick={() => handleModeChange("photo")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
              mode === "photo"
                ? "bg-white text-black shadow-md"
                : "text-white/70 hover:text-white"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("video")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
              mode === "video"
                ? "bg-white text-black shadow-md"
                : "text-white/70 hover:text-white"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Live Video</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ecf4c] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3ecf4c]"></span>
            </span>
          </button>
        </div>

        {/* Audio Mute/Unmute Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          disabled={mode !== "video"}
          className={`bg-neutral-900/80 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shadow-xl ${
            mode === "video"
              ? "text-white hover:border-white/30 cursor-pointer"
              : "text-white/40 cursor-not-allowed opacity-50"
          } ${!isMuted ? "border-[#3ecf4c]/50 bg-[#3ecf4c]/10 text-[#3ecf4c]" : ""}`}
        >
          {!isMuted ? (
            <div className="flex items-end gap-0.5 h-3.5">
              <span className="w-0.5 h-3 bg-[#3ecf4c] rounded-full animate-bounce"></span>
              <span className="w-0.5 h-2.5 bg-[#3ecf4c] rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-0.5 h-3.5 bg-[#3ecf4c] rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          ) : (
            <svg
              className="w-3.5 h-3.5 text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          )}
          <span className="text-[11px] font-medium">
            {mode === "video" ? (isMuted ? "Muted" : "Sound On") : "Photo"}
          </span>
        </button>
      </div>

      {/* Card Body */}
      <div className="relative w-full aspect-[4/5] rounded-[36px] overflow-hidden shadow-2xl border border-white/10 group">
        {/* Photo Background Layer */}
        <div
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            mode === "photo" ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
        >
          <Image
            src={photoSrc}
            alt="Collection Preview"
            fill
            sizes="(max-width: 768px) 100vw, 450px"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            unoptimized={photoSrc.startsWith("http") || photoSrc.startsWith("file://")}
          />
        </div>

        {/* Video Background Layer */}
        <div
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            mode === "video" ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
        >
          <video
            ref={videoRef}
            src={currentVideoSrc}
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Dark Vignette / Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />

        {/* Top Bar inside Card */}
        <div className="absolute top-5 inset-x-5 z-10 flex items-center justify-between">
          {/* Badge */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-[#3ecf4c] shadow-[0_0_8px_#3ecf4c]" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
              {badgeText}
            </span>
          </div>

          {/* Action / Track Toggle Button (↗) */}
          <button
            type="button"
            onClick={() => setShowTrackMenu(!showTrackMenu)}
            className="bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/25 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-transform active:scale-95 shadow-lg"
            title="Options video"
          >
            ↗
          </button>
        </div>

        {/* Video Track Selector Popup */}
        {showTrackMenu && mode === "video" && (
          <div className="absolute top-16 right-5 z-20 bg-neutral-900/90 backdrop-blur-2xl border border-white/15 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 w-44 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-bold text-white/50 uppercase tracking-wider">
              Vidéos disponibles
            </div>
            {tracks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  selectTrack(t.src);
                  setShowTrackMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                  currentVideoSrc === t.src
                    ? "bg-white text-black font-bold"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{t.label}</span>
                {currentVideoSrc === t.src && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Content Area */}
        <div className="absolute bottom-6 inset-x-6 z-10 flex flex-col justify-end text-white">
          <p className="text-[11px] font-black tracking-[0.4em] text-white/70 uppercase mb-1.5">
            {brandName}
          </p>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[0.95] text-white drop-shadow mb-2 whitespace-pre-line">
            {title}
          </h2>

          <p className="text-xs font-medium text-white/80 max-w-[280px] leading-relaxed mb-5 drop-shadow">
            {subtitle}
          </p>

          {/* CTA Row */}
          <div className="flex items-center justify-between">
            <Link
              href={ctaHref}
              className="group/btn bg-white hover:bg-white/90 text-black px-6 py-3 rounded-full flex items-center justify-between gap-4 font-bold text-xs shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full max-w-[210px]"
            >
              <span className="text-black font-black uppercase tracking-wider text-[11px]">
                {ctaLabel}
              </span>
              <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center transition-transform duration-300 group-hover/btn:translate-x-1">
                →
              </div>
            </Link>

            {/* Rec Badge for Video Mode */}
            {mode === "video" && (
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-extrabold text-white/90 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
