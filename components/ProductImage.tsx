"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/images/no-image.svg";

/** Retry the original file if optimization fails, then show a local placeholder. */
export default function ProductImage(props: ImageProps) {
  return <RecoverableImage key={String(props.src)} {...props} />;
}

function RecoverableImage({ src, alt, onError, unoptimized, ...props }: ImageProps) {
  const [attempt, setAttempt] = useState(0);
  const source = typeof src === "string" && !src.trim() ? PLACEHOLDER : src;
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
