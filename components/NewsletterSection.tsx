"use client";

import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="mt-20 mb-4">
      {/* Full-bleed dark band */}
      <div className="relative overflow-hidden bg-neutral-950 px-6 py-16 md:py-20">
        {/* Subtle green glow top-left */}
        <div
          className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #3ecf4c 0%, transparent 70%)" }}
        />
        {/* Subtle green glow bottom-right */}
        <div
          className="pointer-events-none absolute -bottom-20 -right-10 w-60 h-60 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #3ecf4c 0%, transparent 70%)" }}
        />

        <div className="relative max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-5 h-[1px] bg-[#3ecf4c]" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#3ecf4c]">
              Newsletter
            </p>
            <span className="w-5 h-[1px] bg-[#3ecf4c]" />
          </div>

          {/* Headline */}
          <h2 className="h-display text-3xl md:text-4xl text-white leading-tight mb-3">
            Restez dans la boucle
          </h2>
          <p className="text-neutral-400 text-[14px] leading-relaxed max-w-md mx-auto mb-8">
            Recevez en avant-première nos nouveautés, offres exclusives et conseils — directement dans votre boîte mail.
          </p>

          {/* Form */}
          {status === "success" ? (
            <div className="inline-flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#3ecf4c]/15 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-white font-black text-[15px]">Inscription confirmée !</p>
              <p className="text-neutral-400 text-[12px]">Merci de rejoindre la communauté L&apos;ecomax.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 7L2 7" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                  placeholder="votre@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 text-white text-[13px] placeholder:text-neutral-500 focus:outline-none focus:border-[#3ecf4c] transition-colors duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex-none inline-flex items-center justify-center gap-2 bg-[#3ecf4c] text-black px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.18em] hover:bg-[#2db83a] active:scale-[0.97] transition-all duration-200 disabled:opacity-60"
              >
                {status === "loading" ? (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <>
                    S&apos;inscrire
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="mt-3 text-red-400 text-[12px]">Une erreur est survenue. Veuillez réessayer.</p>
          )}

          {/* Trust line */}
          <p className="mt-6 text-neutral-600 text-[11px] flex items-center justify-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Aucun spam. Désinscription en un clic.
          </p>
        </div>
      </div>
    </section>
  );
}
