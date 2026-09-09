"use client";
import { useState } from "react";
import { useSettings } from "@/lib/use-settings";

export default function NewsletterForm({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const siteSettings = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading" || !email.trim() || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "product" }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setStatus(data?.alreadySubscribed ? "already" : "success");
        setEmail("");
      } else setStatus("error");
    } catch { setStatus("error"); }
  };

  if (siteSettings.enable_newsletter === "false") return null;

  if (status === "success" || status === "already") {
    return (
      <div role="status" className={`flex items-center gap-3.5 border border-[#3ecf4c]/30 p-4 ${variant === "light" ? "rounded-xl bg-emerald-50" : "bg-[#3ecf4c]/8"}`}>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center border border-[#3ecf4c]/30 bg-[#3ecf4c]/12 ${variant === "light" ? "rounded-xl" : ""}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div>
          <p className={`text-[13px] font-black leading-tight ${variant === "light" ? "text-neutral-950" : "text-white"}`}>
            {status === "already" ? "Vous êtes déjà inscrit(e)" : "Bienvenue dans la famille !"}
          </p>
          <p className={`mt-1 text-[11px] leading-4 ${variant === "light" ? "text-neutral-500" : "text-neutral-400"}`}>
            {status === "already" ? "Cette adresse e-mail reçoit déjà notre newsletter." : "Votre inscription a bien été prise en compte."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate={false}>
        <div className={`relative ${variant === "light" ? "flex-1" : ""}`}>
          <label htmlFor="newsletter-email" className="sr-only">Votre adresse e-mail</label>
          <svg className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${status === "error" ? "text-red-500" : "text-neutral-400"}`} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
          </svg>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            placeholder="votre@email.com"
            required
            readOnly={status === "loading"}
            aria-invalid={status === "error"}
            aria-describedby={status === "error" ? "newsletter-error" : undefined}
            className={`min-h-[50px] w-full border py-3 pl-12 pr-4 text-[16px] sm:text-[14px] font-medium transition-all duration-200 focus:border-[#3ecf4c] focus:outline-none focus:ring-4 focus:ring-[#3ecf4c]/10 sm:min-h-14 sm:py-3.5 ${variant === "light" ? `rounded-xl bg-white text-neutral-950 placeholder:font-normal placeholder:text-neutral-400 ${status === "error" ? "border-red-300 bg-red-50/40" : "border-neutral-200 hover:border-neutral-300"}` : "border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus:bg-[#3ecf4c]/5"}`}
          />
        </div>
        <button
          type="submit" disabled={status === "loading"}
          aria-busy={status === "loading"}
          className={`group inline-flex min-h-[50px] w-full items-center justify-center gap-2.5 px-5 py-3 transition-[background-color,box-shadow,transform] duration-300 ease-out active:scale-[0.985] motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-wait sm:min-h-14 sm:py-3.5 ${variant === "light" ? `rounded-xl text-[13px] font-semibold tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${status === "loading" ? "bg-emerald-700 shadow-[0_4px_16px_rgba(4,120,87,0.2)]" : "bg-neutral-950 hover:bg-neutral-800 active:bg-emerald-700"}` : "bg-[#3ecf4c] text-[10px] font-black uppercase tracking-[0.14em] sm:tracking-[0.18em] text-black hover:bg-[#2db83a] disabled:opacity-60"}`}
        >
          {status === "loading" ? (
            <><svg className="animate-spin motion-reduce:animate-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg><span>Inscription…</span></>
          ) : (
            <>
              <span>{variant === "light" ? "M\u2019inscrire" : "S\u2019abonner gratuitement"}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${variant === "light" ? "bg-transparent" : "bg-black/10"}`}>
                <svg className="transition-transform duration-200 group-hover:translate-x-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </span>
            </>
          )}
        </button>
      </form>
      {status === "error" && (
        <p id="newsletter-error" role="alert" className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[11px] font-semibold ${variant === "light" ? "border-red-100 bg-red-50 text-red-600" : "border-red-400/20 bg-red-400/10 text-red-300"}`}>
          <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 17h.01" /></svg>
          Une erreur est survenue. Veuillez réessayer.
        </p>
      )}
    </>
  );
}
