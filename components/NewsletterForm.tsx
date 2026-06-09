"use client";
import { useState } from "react";

export default function NewsletterForm() {
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

  if (status === "success") {
    return (
      <div className="flex items-center gap-4 p-5 border border-[#3ecf4c]/30 bg-[#3ecf4c]/8">
        <div className="w-10 h-10 shrink-0 border border-[#3ecf4c]/40 bg-[#3ecf4c]/15 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div>
          <p className="text-white font-black text-[14px] h-display leading-tight">Bienvenue dans la famille !</p>
          <p className="text-neutral-400 text-[12px] mt-0.5">Votre inscription a bien été prise en compte.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
          </svg>
          <input
            type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            placeholder="votre@email.com" required
            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 text-white text-[13px] placeholder:text-neutral-600 focus:outline-none focus:border-[#3ecf4c] focus:bg-[#3ecf4c]/5 transition-all duration-200"
          />
        </div>
        <button
          type="submit" disabled={status === "loading"}
          className="w-full inline-flex items-center justify-center gap-2.5 bg-[#3ecf4c] text-black py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#2db83a] active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
        >
          {status === "loading" ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          ) : (
            <>S&apos;abonner <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
          )}
        </button>
      </form>
      {status === "error" && <p className="text-red-400 text-[12px] mt-2">Une erreur est survenue. Réessayez.</p>}
    </>
  );
}
