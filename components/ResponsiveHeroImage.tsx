"use client";

import { getImageProps } from 'next/image';
import { useState } from 'react';

export function resolveHeroSource(src: string) {
  // Existing settings may still reference the shipped PNG defaults.
  const defaults: Record<string, string> = {
    '/images/hero secrtion/hero section web version.png': '/images/hero-desktop-v2.webp',
    '/images/hero secrtion/hero section mobile version.png': '/images/hero-mobile-v2.webp',
  };
  try { return defaults[decodeURIComponent(src)] ?? src; } catch { return src; }
}

/** Keep in sync with next.config.js remotePatterns; other hosts use their original URL. */
export function canOptimizeHero(src: string) {
  if (src.startsWith('/') && !src.startsWith('//')) return true;
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && (
      ['images.unsplash.com', 'picsum.photos'].includes(url.hostname) ||
      url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')
    );
  } catch { return false; }
}

export default function ResponsiveHeroImage({ desktop, mobile, priority }: {
  desktop: string; mobile: string; priority: boolean;
}) {
  const [original, setOriginal] = useState(false);
  const propsFor = (src: string) => getImageProps({
    src, alt: '', fill: true, sizes: '100vw', quality: 75,
    unoptimized: original || !canOptimizeHero(src),
  }).props;
  const desktopProps = propsFor(resolveHeroSource(desktop));
  const mobileProps = propsFor(resolveHeroSource(mobile));
  return <>
    {priority && <>
      <link rel="preload" as="image" media="(min-width: 768px)" imageSrcSet={desktopProps.srcSet} imageSizes="100vw" href={desktopProps.srcSet ? undefined : desktopProps.src} fetchPriority="high" />
      <link rel="preload" as="image" media="(max-width: 767px)" imageSrcSet={mobileProps.srcSet} imageSizes="100vw" href={mobileProps.srcSet ? undefined : mobileProps.src} fetchPriority="high" />
    </>}
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopProps.srcSet || desktopProps.src} sizes="100vw" />
      {/* A single picture lets the browser fetch only the matching viewport asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...mobileProps} alt="" loading="eager" fetchPriority={priority ? 'high' : 'auto'}
        className="object-cover object-top md:object-[center_65%]"
        onError={() => { if (!original) setOriginal(true); }} />
    </picture>
  </>;
}
