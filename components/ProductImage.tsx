"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/images/no-image.svg";
// Versioned card photography; retain the original product/gallery assets.
const CARD_PHOTOS: Record<string, string> = {
  "https://yddqwgdgeljkzfsmtein.supabase.co/storage/v1/object/public/product-images/admin/2026-10-17/79f8b607-3ec7-4c66-8e32-ec08c1ad7578.webp": "/images/products/studio/stronger-with-you-v2.webp",
  "https://yddqwgdgeljkzfsmtein.supabase.co/storage/v1/object/public/product-images/admin/2026-09-17/292f723c-74cc-4afc-99bc-10cdbb706e6b.avif": "/images/products/studio/denim-sherpa-v2.webp",
  "https://yddqwgdgeljkzfsmtein.supabase.co/storage/v1/object/public/product-images/admin/2026-09-17/6c0c3322-456e-44f8-9aec-ba5b1695081e.avif": "/images/products/studio/varsity-rust-v2.webp",
};

/** Retry the original file if optimization fails, then show a local placeholder. */
export default function ProductImage(props: ImageProps) {
  return <RecoverableImage key={String(props.src)} {...props} />;
}

function RecoverableImage({ src, alt, onError, unoptimized, ...props }: ImageProps) {
  const [attempt, setAttempt] = useState(0);
  const original = typeof src === "string" && !src.trim() ? PLACEHOLDER : src;
  const source = attempt === 0 && typeof original === "string"
    ? CARD_PHOTOS[original] ?? original
    : original;
  const fallback = attempt >= 2;

  return (
    <Image
      {...props}
      alt={alt}
      src={fallback ? PLACEHOLDER : source}
      unoptimized={unoptimized || attempt > 0}
      onError={(event) => {
        setAttempt((current) => Math.min(2, current + (unoptimized ? 2 : 1)));
        onError?.(event);
      }}
    />
  );
}
