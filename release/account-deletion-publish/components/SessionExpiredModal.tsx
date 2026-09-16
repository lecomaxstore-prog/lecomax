"use client";

import Link from "next/link";

export default function SessionExpiredModal({ returnTo }: { returnTo: string }) {
  const loginHref = `/connexion?reason=session_expired&redirect=${encodeURIComponent(returnTo)}`;

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/55 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="session-expired-title">
      <div className="w-full max-w-[470px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_32px_100px_rgba(0,0,0,.35)]">
        <div className="relative bg-[#0b1510] px-8 pb-8 pt-9 text-white">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#3ecf4c]/20 blur-3xl" />
          <div className="relative mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#3ecf4c]/30 bg-[#3ecf4c]/10 text-[#63e36f]">
            <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" />
            </svg>
          </div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[.28em] text-[#63e36f]">Sécurité du compte</p>
          <h2 id="session-expired-title" className="text-2xl font-black tracking-tight">Votre session a expiré</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">Reconnectez-vous pour protéger vos informations et continuer exactement là où vous étiez.</p>
        </div>

        <div className="p-8">
          <div className="mb-7 flex gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">
            <svg className="mt-0.5 shrink-0 text-green-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
            <p className="text-xs leading-5 text-green-900"><strong>Votre panier est conservé.</strong> Aucun article ne sera perdu pendant la reconnexion.</p>
          </div>
          <Link href={loginHref} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 text-xs font-black uppercase tracking-[.16em] text-white transition hover:bg-[#18271e] focus:outline-none focus:ring-4 focus:ring-green-200">
            Se reconnecter
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
          <Link href="/" className="mt-3 flex w-full items-center justify-center rounded-xl px-5 py-3 text-xs font-bold text-neutral-500 transition hover:bg-neutral-50 hover:text-black">Retour à l’accueil</Link>
          <p className="mt-4 text-center text-[10px] text-neutral-400">Cette déconnexion automatique protège vos données personnelles.</p>
        </div>
      </div>
    </div>
  );
}
