"use client";
import { useState } from "react";

export default function JobApplyButton({ title }: { title: string }) {
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <div className="w-full sm:w-auto flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-700 animate-fade-in">
        <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="font-black text-[11px] uppercase tracking-wider leading-tight">Poste non disponible</p>
          <p className="text-[11px] mt-0.5 leading-snug opacity-80">Ce poste n&apos;est pas disponible pour l&apos;instant. Revenez bientôt !</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setClicked(true)}
      className="w-full sm:w-auto shrink-0 bg-black text-white font-black text-[11px] uppercase tracking-widest px-5 py-3 rounded-full hover:bg-neutral-800 active:scale-95 transition-all text-center"
    >
      Postuler →
    </button>
  );
}
