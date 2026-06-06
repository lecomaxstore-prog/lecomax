"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const WHATSAPP_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function NousContacterPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  // Shared form content (used by both mobile and desktop)
  const formCard = (
    <>
      {status === "success" ? (
        <div className="rounded-3xl border border-[#3ecf4c]/20 p-8 text-center" style={{ background: "rgba(18,18,18,0.98)" }}>
          <div className="w-14 h-14 rounded-full bg-[#3ecf4c]/15 border border-[#3ecf4c]/30 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="font-black text-lg uppercase tracking-tighter text-white mb-2">Message envoyé !</h2>
          <p className="text-white/40 text-[13px] mb-6">On vous répond dans les plus brefs délais.</p>
          <button onClick={() => setStatus("idle")} className="bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#2db83a] transition-colors">
            Nouveau message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(160deg, rgba(22,22,22,0.98) 0%, rgba(10,10,10,0.99) 100%)", boxShadow: "0 0 0 1px rgba(62,207,76,0.18), 0 24px 60px rgba(0,0,0,0.8)" }}>
          {/* Green shimmer top bar */}
          <div className="h-[2px]" style={{ background: "linear-gradient(to right, transparent 0%, #3ecf4c 50%, transparent 100%)" }} />
          {/* Header */}
          <div className="py-5 px-6 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="font-black text-[17px] sm:text-[18px] uppercase tracking-tight text-white">
              Formulaire de <span className="text-[#3ecf4c]">Contact</span>
            </h2>
            <p className="text-white/25 text-[10px] mt-0.5 tracking-wide">Tous les champs sont obligatoires</p>
          </div>
          {/* Fields */}
          <div className="p-4 sm:p-6 space-y-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-white/35 mb-1.5">Votre Nom</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Youssef Alami" required
                  className="w-full rounded-xl pl-9 pr-4 py-3 text-white text-[14px] placeholder-white/20 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(62,207,76,0.5)"; e.currentTarget.style.background = "rgba(62,207,76,0.04)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-white/35 mb-1.5">Votre Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="vous@exemple.com" required
                  className="w-full rounded-xl pl-9 pr-4 py-3 text-white text-[14px] placeholder-white/20 focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(62,207,76,0.5)"; e.currentTarget.style.background = "rgba(62,207,76,0.04)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-white/35 mb-1.5">Sujet</label>
              <div className="relative">
                <select value={form.subject} onChange={(e) => set("subject", e.target.value)} required
                  className="w-full rounded-xl px-4 py-3 text-[14px] focus:outline-none transition-all appearance-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: form.subject ? "white" : "rgba(255,255,255,0.25)" }}>
                  <option value="" disabled style={{ color: "#666", background: "#111" }}>Choisir un sujet…</option>
                  <option value="Question sur une commande" style={{ color: "white", background: "#111" }}>Question sur une commande</option>
                  <option value="Question sur un produit" style={{ color: "white", background: "#111" }}>Question sur un produit</option>
                  <option value="Retour / Remboursement" style={{ color: "white", background: "#111" }}>Retour / Remboursement</option>
                  <option value="Partenariat" style={{ color: "white", background: "#111" }}>Partenariat</option>
                  <option value="Autre" style={{ color: "white", background: "#111" }}>Autre</option>
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3ecf4c]/60 pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-white/35 mb-1.5">Votre Message</label>
              <textarea value={form.message} onChange={(e) => set("message", e.target.value)}
                placeholder="Décrivez votre demande en détail…" required rows={4}
                className="w-full rounded-xl px-4 py-3 text-white text-[14px] placeholder-white/20 focus:outline-none transition-all resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(62,207,76,0.5)"; e.currentTarget.style.background = "rgba(62,207,76,0.04)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              />
            </div>
            {status === "error" && (
              <p className="text-red-400 text-[11px] font-semibold">Erreur. Réessayez ou contactez-nous sur WhatsApp.</p>
            )}
            <button type="submit" disabled={status === "loading"}
              className="w-full text-black font-black text-[13px] uppercase tracking-widest py-3.5 rounded-xl disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #3ecf4c 0%, #2db83a 100%)", boxShadow: "0 4px 20px rgba(62,207,76,0.3)" }}>
              {status === "loading" ? (
                <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Envoi en cours…</>
              ) : (
                <>Envoyer le message <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></>
              )}
            </button>
            <p className="text-center text-white/20 text-[10px] flex items-center justify-center gap-1.5 pb-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Vos données sont protégées et ne seront jamais partagées
            </p>
          </div>
        </form>
      )}
    </>
  );

  return (
    <main className="bg-[#0a0a0a]">

      {/* ══════════════════════════════════════════════════════
          MOBILE LAYOUT (hidden on sm+)
      ══════════════════════════════════════════════════════ */}
      <div className="sm:hidden">
        {/* Hero photo strip — shows the store */}
        <div className="relative h-56 overflow-hidden">
          <Image
            src="/images/pages/contatc us.png"
            alt="L'ecomax store"
            fill
            className="object-cover"
            style={{ objectPosition: "75% center" }}
            priority
          />
          {/* Fade bottom to #0a0a0a */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.65) 55%, #0a0a0a 100%)" }} />
          {/* Fade left for text legibility */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.4) 55%, transparent 100%)" }} />

          {/* Branding overlaid on photo, bottom-left */}
          <div className="absolute bottom-6 left-5">
            <Link href="/" className="inline-block mb-1">
              <span className="font-black text-[28px] text-white tracking-tight leading-none">
                L&apos;eco<span className="text-[#3ecf4c]">max</span>
              </span>
            </Link>
            <p className="text-white/80 font-black text-[11px] uppercase tracking-wider leading-tight">Une marque. Un style.</p>
            <p className="text-[#3ecf4c] font-black text-[11px] uppercase tracking-wider leading-tight">Une communauté.</p>
          </div>
        </div>

        {/* Dark content zone */}
        <div className="px-4 pb-16" style={{ background: "#0a0a0a" }}>
          {/* 3 contact quick-action pills */}
          <div className="flex gap-2 py-4">
            <a href="https://wa.me/212699289568" target="_blank" rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl"
              style={{ background: "rgba(37,211,102,0.09)", border: "1px solid rgba(37,211,102,0.28)" }}>
              <div className="w-8 h-8 rounded-xl bg-[#25D366]/20 flex items-center justify-center">{WHATSAPP_ICON}</div>
              <span className="text-[#25D366] text-[9px] font-black uppercase tracking-wider">WhatsApp</span>
              <span className="text-white/30 text-[8px]">Réponse &lt; 2h</span>
            </a>
            <a href="mailto:contact@lecomax.com"
              className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <span className="text-white/60 text-[9px] font-black uppercase tracking-wider">E-mail</span>
              <span className="text-white/25 text-[8px]">Réponse rapide</span>
            </a>
            <div className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl"
              style={{ background: "rgba(62,207,76,0.06)", border: "1px solid rgba(62,207,76,0.2)" }}>
              <div className="w-8 h-8 rounded-xl bg-[#3ecf4c]/15 flex items-center justify-center text-[#3ecf4c]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span className="text-[#3ecf4c] text-[9px] font-black uppercase tracking-wider">Boutique</span>
              <span className="text-white/25 text-[8px]">Sidi Bennour</span>
            </div>
          </div>

          {/* Form */}
          {formCard}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP LAYOUT (hidden on mobile)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden sm:block relative min-h-screen overflow-hidden">
        {/* Full-screen background photo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/pages/contatc us.png"
            alt="L'ecomax store"
            fill
            className="object-cover"
            style={{ objectPosition: "right center" }}
            priority
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #050505 0%, #050505 40%, rgba(5,5,5,0.92) 52%, rgba(5,5,5,0.55) 65%, rgba(5,5,5,0.15) 80%, transparent 100%)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col justify-center px-12 lg:px-20 py-28">
          <div className="max-w-screen-xl mx-auto w-full">
            <div className="grid lg:grid-cols-[320px_420px] gap-8 lg:gap-16 items-center">

              {/* Left: branding + contact cards */}
              <div>
                <Link href="/" className="inline-block mb-6">
                  <span className="font-black text-[28px] text-white tracking-tight">
                    L&apos;eco<span className="text-[#3ecf4c]">max</span>
                  </span>
                </Link>
                <div className="mb-8">
                  <p className="text-white font-black text-[18px] leading-tight uppercase tracking-tight">Une marque. Un style.</p>
                  <p className="text-[#3ecf4c] font-black text-[18px] leading-tight uppercase tracking-tight">Une communauté.</p>
                  <div className="w-10 h-[2px] bg-[#3ecf4c] mt-3" />
                </div>

                <div className="flex flex-col gap-2.5">
                  <a href="https://wa.me/212699289568" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-[#25D366]/40 backdrop-blur-sm transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div>
                      <p className="text-white font-black text-[13px] uppercase tracking-wide">WhatsApp</p>
                      <p className="text-white/50 text-[11px]">+212 699 289 568</p>
                      <p className="text-[#25D366] text-[10px] font-bold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] inline-block" />Réponse &lt; 2h
                      </p>
                    </div>
                  </a>

                  <a href="mailto:contact@lecomax.com"
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-white/25 backdrop-blur-sm transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <div>
                      <p className="text-white font-black text-[13px] uppercase tracking-wide">E-mail</p>
                      <p className="text-white/50 text-[11px]">contact@lecomax.com</p>
                      <p className="text-white/30 text-[10px] font-bold mt-0.5">Nous répondons rapidement</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#3ecf4c]/15 border border-[#3ecf4c]/25 flex items-center justify-center shrink-0 text-[#3ecf4c]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div>
                      <p className="text-white font-black text-[13px] uppercase tracking-wide">Boutique</p>
                      <p className="text-white/50 text-[11px]">Sidi Bennour, Maroc</p>
                      <p className="text-[#3ecf4c] text-[10px] font-bold mt-0.5">Visitez-nous</p>
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div className="mt-5 px-1">
                  <p className="flex items-center gap-2 text-[#3ecf4c] font-black text-[11px] uppercase tracking-widest mb-3">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Horaires
                  </p>
                  <div className="space-y-1.5">
                    {[{ day: "Lun – Ven", h: "9h – 19h" }, { day: "Samedi", h: "9h – 17h" }, { day: "Dimanche", h: "Fermé", green: true }].map((r) => (
                      <div key={r.day} className="flex justify-between">
                        <span className="text-white/50 text-[13px]">{r.day}</span>
                        <span className={`text-[13px] font-semibold ${r.green ? "text-[#3ecf4c]" : "text-white"}`}>{r.h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: form */}
              <div>{formCard}</div>

            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
