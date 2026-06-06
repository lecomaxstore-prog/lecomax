"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Consent = { essential: true; analytics: boolean; preferences: boolean };

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lecomax_cookie_consent");
      if (!saved) {
        // If intro already done (return visit), show after short delay
        if (sessionStorage.getItem("intro_done")) {
          const t = setTimeout(() => setVisible(true), 400);
          return () => clearTimeout(t);
        }
        // First visit — wait for intro animation to signal completion
        const onIntroDone = () => setTimeout(() => setVisible(true), 300);
        window.addEventListener("introDone", onIntroDone, { once: true });
        return () => window.removeEventListener("introDone", onIntroDone);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const save = (consent: Consent) => {
    try {
      localStorage.setItem("lecomax_cookie_consent", JSON.stringify(consent));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const acceptAll = () => save({ essential: true, analytics: true, preferences: true });
  const rejectAll = () => save({ essential: true, analytics: false, preferences: false });
  const saveCustom = () => save({ essential: true, analytics, preferences });

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestion des cookies"
      className="fixed bottom-0 left-0 right-0 z-[10000] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="max-w-2xl mx-auto bg-white border border-neutral-200 shadow-[0_-4px_40px_rgba(0,0,0,0.12)]">

        {/* Top accent */}
        <div className="h-[3px] bg-[#3ecf4c]" />

        <div className="p-5 sm:p-6">

          {!showDetails ? (
            /* ── Compact view ── */
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[18px]">🍪</span>
                  <p className="font-black text-[13px] uppercase tracking-widest">Cookies & confidentialité</p>
                </div>
                <p className="text-[12px] text-neutral-500 leading-relaxed">
                  Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic.
                  En continuant, vous acceptez notre{" "}
                  <Link href="/cookies" className="underline underline-offset-2 hover:text-black transition-colors">
                    politique de cookies
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-[11px] font-black uppercase tracking-widest text-neutral-500 hover:text-black transition-colors px-4 py-3 border border-neutral-200 hover:border-neutral-400 whitespace-nowrap"
                >
                  Personnaliser
                </button>
                <button
                  onClick={rejectAll}
                  className="text-[11px] font-black uppercase tracking-widest text-neutral-700 hover:text-black transition-colors px-4 py-3 border border-neutral-300 hover:border-neutral-500 whitespace-nowrap"
                >
                  Refuser
                </button>
                <button
                  onClick={acceptAll}
                  className="text-[11px] font-black uppercase tracking-widest bg-black text-white hover:bg-neutral-800 transition-colors px-6 py-3 whitespace-nowrap"
                >
                  Tout accepter
                </button>
              </div>
            </div>
          ) : (
            /* ── Detailed view ── */
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[18px]">🍪</span>
                <p className="font-black text-[13px] uppercase tracking-widest">Personnaliser mes choix</p>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                {/* Essential — always on */}
                <div className="flex items-center justify-between bg-neutral-50 border border-neutral-100 px-4 py-3">
                  <div>
                    <p className="font-black text-[12px] uppercase tracking-widest mb-0.5">Cookies essentiels</p>
                    <p className="text-[11px] text-neutral-500">Panier, session, sécurité — indispensables au fonctionnement.</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-[#3ecf4c] text-black px-2 py-1 shrink-0">
                    Toujours actifs
                  </span>
                </div>

                {/* Analytics */}
                <label className="flex items-center justify-between bg-neutral-50 border border-neutral-100 px-4 py-3 cursor-pointer hover:border-neutral-300 transition-colors">
                  <div>
                    <p className="font-black text-[12px] uppercase tracking-widest mb-0.5">Cookies analytiques</p>
                    <p className="text-[11px] text-neutral-500">Nous aident à comprendre le comportement des visiteurs (anonyme).</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analytics}
                    onClick={() => setAnalytics(!analytics)}
                    className={`relative shrink-0 w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3ecf4c] focus:ring-offset-1 ${analytics ? "bg-[#3ecf4c]" : "bg-neutral-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${analytics ? "translate-x-5" : ""}`} />
                  </button>
                </label>

                {/* Preferences */}
                <label className="flex items-center justify-between bg-neutral-50 border border-neutral-100 px-4 py-3 cursor-pointer hover:border-neutral-300 transition-colors">
                  <div>
                    <p className="font-black text-[12px] uppercase tracking-widest mb-0.5">Cookies de préférences</p>
                    <p className="text-[11px] text-neutral-500">Mémorisent vos tailles, couleurs et préférences.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences}
                    onClick={() => setPreferences(!preferences)}
                    className={`relative shrink-0 w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3ecf4c] focus:ring-offset-1 ${preferences ? "bg-[#3ecf4c]" : "bg-neutral-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${preferences ? "translate-x-5" : ""}`} />
                  </button>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-[11px] font-black uppercase tracking-widest text-neutral-500 hover:text-black transition-colors px-4 py-3 border border-neutral-200 hover:border-neutral-400"
                >
                  Retour
                </button>
                <button
                  onClick={rejectAll}
                  className="text-[11px] font-black uppercase tracking-widest text-neutral-700 px-4 py-3 border border-neutral-300 hover:border-neutral-500 transition-colors"
                >
                  Tout refuser
                </button>
                <button
                  onClick={saveCustom}
                  className="text-[11px] font-black uppercase tracking-widest bg-neutral-800 text-white hover:bg-neutral-700 transition-colors px-5 py-3"
                >
                  Enregistrer mes choix
                </button>
                <button
                  onClick={acceptAll}
                  className="text-[11px] font-black uppercase tracking-widest bg-black text-white hover:bg-neutral-800 transition-colors px-6 py-3"
                >
                  Tout accepter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
