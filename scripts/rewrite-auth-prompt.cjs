const fs = require('fs');

const content = `"use client";
import { useEffect } from "react";
import Link from "next/link";
import EcomediaWordmark from "./EcomediaWordmark";

interface Props {
  onClose: () => void;
  action?: "like" | "comment";
  redirectPath?: string;
}

const BENEFITS = [
  { icon: "\u2764\uFE0F", title: "Likez", sub: "R\u00e9agissez aux posts" },
  { icon: "\uD83D\uDCAC", title: "Commentez", sub: "Rejoignez la discussion" },
  { icon: "\uD83D\uDD14", title: "Alertes", sub: "Offres en avant-premi\u00e8re" },
];

export default function EcomediaAuthPrompt({ onClose, action = "like", redirectPath = "/ecomedia" }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const isComment = action === "comment";
  const encoded = encodeURIComponent(redirectPath);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="relative mt-auto bg-white rounded-t-[32px] shadow-2xl overflow-hidden">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-200" />
        </div>

        {/* Dark hero banner */}
        <div className="relative bg-[#0d0d0d] mx-4 mb-4 rounded-3xl px-6 pt-6 pb-7 overflow-hidden">
          {/* Green ambient glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: "radial-gradient(circle, #3ecf4c 0%, transparent 70%)" }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-90"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div className="flex flex-col items-center gap-4 relative z-10">
            <EcomediaWordmark size="md" dark />

            {/* Action icon with glow ring */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full blur-xl opacity-30" style={{ background: "#3ecf4c" }} />
              <div className="relative w-16 h-16 rounded-2xl border border-[#3ecf4c]/30 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(62,207,76,0.15) 0%, rgba(22,178,119,0.08) 100%)" }}>
                {isComment ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                )}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">
                {isComment ? "Rejoignez la discussion" : "Montrez votre soutien"}
              </h2>
              <p className="text-[12px] text-white/50 mt-1.5 max-w-[250px] mx-auto leading-relaxed">
                {isComment
                  ? "Connectez-vous pour commenter et rejoindre la communaut\u00e9 L'ecomax."
                  : "Connectez-vous pour liker et interagir avec la communaut\u00e9 L'ecomax."}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 pb-8">
          {/* Benefits row */}
          <div className="flex gap-2 mb-5">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex-1 bg-neutral-50 rounded-2xl py-3.5 px-2 text-center border border-neutral-100">
                <div className="text-2xl mb-1.5">{b.icon}</div>
                <p className="text-[11px] font-black text-black leading-tight">{b.title}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">{b.sub}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="space-y-2.5">
            <Link
              href={"/connexion?redirect=" + encoded}
              className="flex items-center justify-center gap-2.5 w-full bg-[#3ecf4c] text-black font-black text-[15px] py-4 rounded-2xl hover:bg-[#16b277] hover:text-white active:scale-[0.97] transition-all shadow-lg shadow-green-200/50"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              </svg>
              Se connecter
            </Link>
            <Link
              href={"/inscription?redirect=" + encoded}
              className="flex items-center justify-center gap-2.5 w-full bg-[#0d0d0d] text-white font-black text-[15px] py-4 rounded-2xl hover:bg-neutral-800 active:scale-[0.97] transition-all"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Cr\u00e9er un compte gratuit
            </Link>
          </div>

          <p className="text-[11px] text-neutral-400 text-center mt-3.5">
            100% gratuit \u00b7 Aucune carte requise
          </p>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('components/ecomedia/EcomediaAuthPrompt.tsx', content, 'utf8');
console.log('Written OK, lines:', content.split('\n').length);
