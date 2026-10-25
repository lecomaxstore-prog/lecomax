"use client";

import { useState } from "react";
import { productVideoMedia } from "@/lib/product-video";

export default function ProductVideo({ url, poster, autoPlay = true, onAspectRatio }: { url: string; poster?: string; autoPlay?: boolean; onAspectRatio?: (ratio: number) => void }) {
  const media = productVideoMedia(url, poster);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(media.error ?? "");
  const [attempt, setAttempt] = useState(0);
  const [posterFailed, setPosterFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const displayPoster = posterFailed ? (fallbackFailed ? undefined : poster) : media.poster;
  return (
    <div className="absolute inset-0 isolate h-full w-full overflow-hidden bg-neutral-100">
      {/* Fill unused space without cropping the product or decoding a second video. */}
      {displayPoster && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayPoster}
            alt=""
            onError={() => posterFailed ? setFallbackFailed(true) : setPosterFailed(true)}
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
          />
          <div className="absolute inset-0 bg-white/25" />
        </div>
      )}
      <video
        key={`${media.src}-${attempt}`}
        src={media.src || undefined}
        poster={displayPoster}
        controls={false} playsInline preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        autoPlay={autoPlay} muted={autoPlay} loop={autoPlay}
        onLoadStart={() => { setLoading(true); }}
        onLoadedMetadata={(event) => {
          const { videoWidth, videoHeight } = event.currentTarget;
          if (videoWidth > 0 && videoHeight > 0) onAspectRatio?.(videoWidth / videoHeight);
        }}
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
