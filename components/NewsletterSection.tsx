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
      if (res.ok) { setStatus("success"); setEmail(""); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  const perks = [
    { icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", label: "Offres exclusives membres" },
    { icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", label: "Alertes nouveautés en avant-première" },
    { icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7", label: "Accès aux ventes privées" },
  ];

  return (
    <section className="mt-20 mb-4">
      <div className="relative overflow-hidden bg-neutral-950">
        {/* Decorative grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Green glow accents */}
        <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 -translate-y-1/2 rounded-full opacity-10 blur-3xl" style={{ background: "#3ecf4c" }} />
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-64 h-64 translate-y-1/2 rounded-full opacity-10 blur-3xl" style={{ background: "#3ecf4c" }} />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-[1fr_1px_1fr] gap-0 md:gap-12 items-center">

          {/* ── Left: copy + perks ── */}
          <div className="pb-10 md:pb-0 md:pr-4">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-[#3ecf4c]/25 bg-[#3ecf4c]/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#3ecf4c]">Newsletter L&apos;ecomax</p>
            </div>
            <h2 className="h-display text-4xl md:text-5xl text-white leading-[0.95] mb-4">
              Soyez<br />
              <span className="text-[#3ecf4c]">les premiers</span><br />
              informés.
            </h2>
            <p className="text-neutral-400 text-[13px] leading-relaxed max-w-xs mb-8">
              Rejoignez notre communauté et profitez d&apos;avantages exclusifs réservés aux abonnés.
            </p>
            <ul className="space-y-3.5">
              {perks.map((p) => (
                <li key={p.label} className="flex items-center gap-3">
                  <span className="w-8 h-8 shrink-0 border border-[#3ecf4c]/30 bg-[#3ecf4c]/10 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d={p.icon} />
                    </svg>
                  </span>
                  <span className="text-[12px] text-neutral-300 font-semibold">{p.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Divider ── */}
          <div className="hidden md:block w-[1px] self-stretch bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          {/* ── Right: form ── */}
          <div className="pt-10 md:pt-0 md:pl-4 border-t border-white/10 md:border-0">
            {status === "success" ? (
              <div className="flex flex-col items-start gap-4">
                <div className="w-14 h-14 border border-[#3ecf4c]/40 bg-[#3ecf4c]/10 flex items-center justify-center">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-black text-xl h-display">Bienvenue dans la famille !</p>
                  <p className="text-neutral-400 text-[13px] mt-1.5 leading-relaxed">Votre inscription a bien été prise en compte. Restez à l&apos;affût de votre boîte mail.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-neutral-300 text-[13px] leading-relaxed mb-6 border-l-2 border-[#3ecf4c] pl-4">
                  Entrez votre adresse e-mail pour recevoir en exclusivité nos dernières offres, nouveautés et conseils.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
                      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                      placeholder="votre@email.com"
                      required
                      className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 text-white text-[13px] placeholder:text-neutral-600 focus:outline-none focus:border-[#3ecf4c] focus:bg-[#3ecf4c]/5 transition-all duration-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full inline-flex items-center justify-center gap-2.5 bg-[#3ecf4c] text-black py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#2db83a] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 mt-1"
                  >
                    {status === "loading" ? (
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    ) : (
                      <>
                        Rejoindre la newsletter
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </>
                    )}
                  </button>
                  {status === "error" && (
                    <p className="text-red-400 text-[12px] flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Une erreur est survenue. Veuillez réessayer.
                    </p>
                  )}
                </form>
                <p className="mt-5 text-neutral-700 text-[11px] flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  Aucun spam. Désinscription en un clic, à tout moment.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

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
