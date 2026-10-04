"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SAVED_EMAIL_KEY = "admin_saved_email";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState(false);
  const [loading, setLoading] = useState(false);
  // Honeypot: bots fill hidden fields; humans never see them
  const [_hp, setHp] = useState("");

  // Restore saved email on mount (localStorage — persists across sessions)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_EMAIL_KEY);
      if (saved) { setEmail(saved); setRememberMe(true); }
    } catch {}
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // If the honeypot field was filled, this is a bot — fail silently
    if (_hp) { setLoading(false); return; }
    if (loading) return;
    setLoading(true);
    try {
      const { data: authData, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.status === 400 || err.code === "invalid_credentials"
          ? "Email ou mot de passe incorrect."
          : "Connexion indisponible pour le moment. Vérifiez votre connexion et réessayez.");
        return;
      }
      if (!authData.session?.access_token || !authData.user?.email) {
        setError("Session introuvable. Réessayez de vous connecter.");
        return;
      }

      const sessionRes = await fetch("/api/admin/auth/session/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          access_token: authData.session.access_token,
          email: authData.user.email,
          rememberMe,
        }),
      });
      if (!sessionRes.ok) {
        const body = await sessionRes.json().catch(() => ({}));
        if (body?.code === "STAFF_REMOVED") {
          setRemoved(true);
          return;
        }
        setError(typeof body?.error === "string"
          ? body.error
          : "Erreur lors de la création de la session. Réessayez.");
        return;
      }

      try {
        if (rememberMe) localStorage.setItem(SAVED_EMAIL_KEY, email.trim());
        else localStorage.removeItem(SAVED_EMAIL_KEY);
      } catch {}

      // Read the newly issued HttpOnly cookie on a fresh document request.
      // A prefetched dashboard may still contain the unauthenticated redirect.
      window.location.replace("/admin/dashboard/");
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (removed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

        <div className="relative z-10 max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              <img src="/favicon.png?v=5" alt="L'ecomax" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-black tracking-wide text-sm">L&apos;ECOMAX</p>
              <p className="text-white/25 text-[10px] uppercase tracking-widest">Administration</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-10 text-center backdrop-blur-sm">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>

            <h1 className="text-2xl font-black text-white mb-3">Accès révoqué</h1>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Votre compte n&apos;est plus associé à l&apos;espace d&apos;administration de L&apos;Ecomax.
              Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter le responsable.
            </p>

            {/* Info strip */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 text-left mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff60" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold mb-0.5">Identifiant</p>
                  <p className="text-white/60 text-sm font-mono truncate">{email}</p>
                </div>
              </div>
            </div>

            <a
              href="mailto:contact@lecomax.com"
              className="flex items-center justify-center gap-2 w-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white text-sm font-bold py-3 rounded-2xl transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Contacter l&apos;administrateur
            </a>
          </div>

          <p className="text-center text-[10px] text-white/15 mt-8 uppercase tracking-widest">
            L&apos;ECOMAX © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#0a0a0a] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#3ecf4c] to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              <img src="/favicon.png?v=5" alt="L'ecomax" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-black tracking-wide text-sm">L&apos;ECOMAX</p>
              <p className="text-white/25 text-[10px] uppercase tracking-widest">Administration</p>
            </div>
          </div>

          <h2 className="text-[2.6rem] font-black text-white leading-[1.1] mb-5">
            Gérez votre<br />boutique<br /><span className="text-[#3ecf4c]">en toute simplicité.</span>
          </h2>
          <p className="text-white/35 text-sm leading-relaxed max-w-xs">
            Commandes, produits, clients et analytiques — tout depuis un seul tableau de bord.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[["Commandes", "Toutes vos ventes"], ["Produits", "Catalogue complet"], ["Analytiques", "Données en temps réel"]].map(([title, sub]) => (
            <div key={title} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] mb-2" />
              <p className="text-white text-[12px] font-bold">{title}</p>
              <p className="text-white/30 text-[10px] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-[#f8f8f7] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              <img src="/favicon.png?v=5" alt="L'ecomax" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black tracking-wide text-sm">L&apos;ECOMAX</p>
              <p className="text-neutral-400 text-[10px] uppercase tracking-widest">Administration</p>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-[1.75rem] font-black tracking-tight mb-1">Connexion</h1>
            <p className="text-neutral-400 text-sm">Accédez à votre espace administrateur</p>
          </div>

          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Honeypot trap — invisible to humans, bots fill it and get blocked */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={_hp}
                onChange={(e) => setHp(e.target.value)}
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
              />

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez votre identifiant ou email"
                  required
                  autoComplete="email"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white placeholder:text-neutral-300"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all bg-neutral-50 focus:bg-white placeholder:text-neutral-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-600 transition-colors"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div
                  onClick={() => setRememberMe((v) => !v)}
                  className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-all shrink-0 ${
                    rememberMe ? "bg-black border-black" : "border-neutral-300 group-hover:border-neutral-400"
                  }`}
                >
                  {rememberMe && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-neutral-500 group-hover:text-neutral-700 transition-colors">
                  Se souvenir de moi
                </span>
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-[12px] px-3.5 py-2.5 rounded-xl">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connexion…</>
                ) : (
                  <>
                    Se connecter
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[10px] text-neutral-300 mt-6 uppercase tracking-widest">
            L&apos;ECOMAX © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
