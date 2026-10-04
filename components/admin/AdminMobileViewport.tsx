"use client";
import { useEffect } from 'react';

/** Fit mobile overlays to the visible area when the on-screen keyboard opens. */
export default function AdminMobileViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty('--admin-visible-height', `${Math.max(120, Math.round(viewport.height))}px`);
      root.style.setProperty('--admin-visible-top', `${Math.max(0, Math.round(viewport.offsetTop))}px`);
    };
    update(); viewport.addEventListener('resize', update); viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--admin-visible-height'); root.style.removeProperty('--admin-visible-top');
    };
  }, []);
  return null;
}
