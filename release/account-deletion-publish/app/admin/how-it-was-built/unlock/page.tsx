"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function HowBuiltUnlockPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/how-built-pin", { cache: "no-store" }).then((response) => {
      if (response.ok) router.replace("/admin/how-it-was-built");
      else { setChecking(false); window.setTimeout(() => inputRef.current?.focus(), 50); }
    }).catch(() => setChecking(false));
  }, [router]);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{4}$/.test(pin)) { setError("Saisissez les 4 chiffres du code PIN."); return; }
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/admin/how-built-pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Impossible de vérifier le code.");
      router.replace("/admin/how-it-was-built"); router.refresh();
    } catch (unlockError) { setError(unlockError instanceof Error ? unlockError.message : "Code incorrect."); setPin(""); inputRef.current?.focus(); }
    finally { setSubmitting(false); }
  }

  if (checking) return <div className="flex min-h-[60dvh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" /></div>;

  return <div className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-5xl items-center justify-center px-0 py-6 sm:px-4">
    <section className="relative w-full max-w-lg overflow-hidden rounded-[30px] bg-neutral-950 p-6 text-white shadow-2xl sm:p-9">
      <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#3ecf4c]/20 blur-3xl" />
      <div className="relative">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#3ecf4c]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></span>
        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#65df70]">Zone privée du propriétaire</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Comment le site a été construit</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">Cette section contient l’architecture, le code et les explications techniques du projet. Saisissez votre code PIN administrateur pour continuer.</p>

        <form onSubmit={unlock} className="mt-7">
          <label htmlFor="how-built-pin" className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.14em] text-white/55">Code PIN à 4 chiffres</label>
          <input id="how-built-pin" ref={inputRef} type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} aria-invalid={Boolean(error)} className="min-h-14 w-full rounded-2xl border border-white/15 bg-white/[.08] px-5 text-center font-mono text-2xl font-black tracking-[.55em] text-white outline-none transition focus:border-[#3ecf4c] focus:ring-4 focus:ring-[#3ecf4c]/10" placeholder="••••" />
          {error && <p role="alert" className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-300">{error}</p>}
          <button type="submit" disabled={submitting || pin.length !== 4} className="mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#3ecf4c] px-5 text-sm font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">{submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />}{submitting ? "Vérification…" : "Déverrouiller la section"}</button>
        </form>
        <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold text-white/35"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Accès chiffré, limité au propriétaire et valable 8 heures.</div>
      </div>
    </section>
  </div>;
}
