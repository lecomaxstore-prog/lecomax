"use client";

import { useEffect } from "react";
import Link from "next/link";
import EcomediaWordmark from "./EcomediaWordmark";

interface Props {
  onClose: () => void;
  action?: "like" | "comment" | "reply" | "post" | "save";
  redirectPath?: string;
}

const BENEFITS = [
  { title: "Publiez", sub: "Photos et idées", path: "M12 5v14M5 12h14" },
  { title: "Échangez", sub: "Commentaires et réponses", path: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10Z" },
  { title: "Profitez", sub: "Offres en avant-première", path: "M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" },
];

export default function EcomediaAuthPrompt({ onClose, action = "like", redirectPath = "/ecomedia" }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);

  const isComment = action === "comment" || action === "reply";
  const isPost = action === "post";
  const isSave = action === "save";
  const encoded = encodeURIComponent(redirectPath);
  const title = isPost ? "Partagez ce qui vous inspire" : isComment ? (action === "reply" ? "Prenez part à l’échange" : "Rejoignez la conversation") : isSave ? "Retrouvez vos favoris" : "Soutenez cette publication";
  const description = isPost
    ? "Publiez vos photos et vos idées auprès de la communauté L’ecomax."
    : isComment
      ? "Toutes les discussions sont publiques. Connectez-vous pour commenter ou répondre."
      : isSave
        ? "Enregistrez cette publication et retrouvez-la facilement dans votre espace."
        : "Connectez-vous pour aimer cette publication et encourager son auteur.";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="ecomedia-auth-title">
      <button type="button" className="absolute inset-0 h-full w-full bg-black/65 backdrop-blur-md" onClick={onClose} aria-label="Fermer" />

      <div className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-[30px] border border-white/10 bg-white shadow-[0_32px_100px_rgba(0,0,0,.4)] sm:max-w-[510px] sm:rounded-[30px]">
        <div className="flex justify-center pb-1 pt-3 sm:hidden"><span className="h-1 w-10 rounded-full bg-neutral-200" /></div>

        <div className="relative overflow-hidden bg-[#0a0d0b] px-6 pb-8 pt-6 text-white sm:px-8 sm:pb-9 sm:pt-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#3ecf4c]/15 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-[#16b277]/10 blur-[80px]" />
          <div className="pointer-events-none absolute inset-0 opacity-[.035]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize: "38px 38px" }} />

          <div className="relative flex items-start justify-between">
            <EcomediaWordmark size="sm" dark />
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[.07] text-white/65 transition hover:bg-white/15 hover:text-white active:scale-95" aria-label="Fermer la fenêtre"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
          </div>

          <div className="relative mt-9 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#3ecf4c]/30 bg-[#3ecf4c]/10 text-[#3ecf4c] shadow-[0_0_35px_rgba(62,207,76,.12)]">
              {isPost ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/></svg>
              ) : isComment ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10Z"/></svg>
              ) : isSave ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m19 21-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16Z"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8a5.5 5.5 0 000-7.8Z"/></svg>
              )}
            </div>
            <div className="min-w-0 pt-0.5"><p className="text-[9px] font-black uppercase tracking-[.25em] text-[#3ecf4c]">Réservé aux membres</p><h2 id="ecomedia-auth-title" className="mt-2 text-[25px] font-black leading-[1.05] tracking-[-.025em]">{title}</h2><p className="mt-3 max-w-sm text-[12px] leading-5 text-white/50">{description}</p></div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-7">
          <div className="grid grid-cols-3 gap-2">
            {BENEFITS.map(benefit => (
              <div key={benefit.title} className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 text-center">
                <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-[#16b277]"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={benefit.path}/></svg></span>
                <p className="mt-2.5 text-[10px] font-black text-neutral-900">{benefit.title}</p><p className="mt-1 hidden text-[8px] leading-3 text-neutral-400 sm:block">{benefit.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2.5">
            <Link href={`/connexion?redirect=${encoded}`} className="group flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#3ecf4c] px-5 py-4 text-[13px] font-black text-black shadow-[0_12px_30px_rgba(62,207,76,.18)] transition hover:bg-[#16b277] hover:text-white active:scale-[.98]">
              Se connecter
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
            <Link href={`/inscription?redirect=${encoded}`} className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-[13px] font-black text-neutral-900 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white active:scale-[.98]">Créer un compte gratuit</Link>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
            <button type="button" onClick={onClose} className="text-[10px] font-bold text-neutral-400 transition hover:text-neutral-900">Continuer en lecture seule</button>
            <span className="flex items-center gap-1.5 text-[9px] text-neutral-400"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16b277" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>Gratuit et sécurisé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
