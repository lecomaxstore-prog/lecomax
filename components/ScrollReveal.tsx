"use client";

import { useEffect, useRef, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Extra Tailwind/CSS classes applied to the wrapper div */
  className?: string;
  /** Delay before the transition fires (ms) — for manual stagger */
  delay?: number;
  /** Animation direction */
  direction?: "up" | "left" | "right" | "scale";
  /** How far from the bottom edge the element must be before triggering */
  rootMargin?: string;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  rootMargin = "0px 0px -48px 0px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Server HTML and already visible content must never wait for hydration.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.add('sr-pending');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Apply delay via inline style so the base transition picks it up
          el.style.transitionDelay = delay > 0 ? `${Math.min(delay, 150)}ms` : "";
          el.classList.remove('sr-pending');
          el.classList.add("in");
          observer.unobserve(el);
        }
      },
      { threshold: 0.06, rootMargin }
    );

    observer.observe(el);
    return () => { observer.disconnect(); el.classList.remove('sr-pending'); };
  }, [delay, rootMargin]);

  return (
    <div ref={ref} className={`sr sr-${direction} ${className}`}>
      {children}
    </div>
  );
}
