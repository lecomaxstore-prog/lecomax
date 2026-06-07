"use client";
import { useState } from "react";

export default function JobApplyButton({ title }: { title: string }) {
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-full">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Non disponible pour l&apos;instant
      </span>
    );
  }

  return (
    <button
      onClick={() => setClicked(true)}
      className="inline-flex items-center gap-2 shrink-0 bg-neutral-950 text-white font-black text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-neutral-700 active:scale-95 transition-all"
    >
      Postuler
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
      </svg>
    </button>
  );
}

