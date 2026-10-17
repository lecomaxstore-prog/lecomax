"use client";

import { useState } from "react";
import { productVideoMedia } from "@/lib/product-video";

export default function ProductVideo({ url, poster, autoPlay = false }: { url: string; poster?: string; autoPlay?: boolean }) {
  const media = productVideoMedia(url, poster);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(media.error ?? "");
  const [attempt, setAttempt] = useState(0);
  const [posterFailed, setPosterFailed] = useState(false);
  return (
    <div className="absolute inset-0 h-full w-full bg-neutral-100">
      {/* Probe the poster so a missing Cloudinary derivative falls back to a product photo. */}
      {media.poster && !posterFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.poster} alt="" hidden onError={() => setPosterFailed(true)} />
      )}
      <video
        key={`${media.src}-${attempt}`}
        src={media.src || undefined}
        poster={posterFailed ? poster : media.poster}
        controls playsInline preload="metadata"
        autoPlay={autoPlay} muted={autoPlay} loop={autoPlay}
        onLoadStart={() => { setLoading(true); }}
        onLoadedData={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => { setLoading(false); setError(""); }}
        onWaiting={() => setLoading(true)}
        onPause={() => setLoading(false)}
        onError={(event) => {
          setLoading(false);
          const code = event.currentTarget.error?.code;
          setError(code === 2 ? "Connexion interrompue. Réessayez." : "Impossible de lire cette vidéo. Réessayez.");
        }}
        className="absolute inset-0 h-full w-full object-contain"
      />
      {loading && !error && <span role="status" className="pointer-events-none absolute left-3 top-3 rounded bg-white/90 px-3 py-2 text-xs text-neutral-800">Chargement de la vidéo…</span>}
      {error && <div role="alert" className="absolute inset-x-3 top-3 rounded bg-white/95 p-3 text-center text-sm text-neutral-800">
        <p>{error}</p>
        <button type="button" className="mt-2 underline" onClick={() => { setError(media.error ?? ""); setLoading(false); setAttempt(value => value + 1); }}>Réessayer</button>
      </div>}
    </div>
  );
}
