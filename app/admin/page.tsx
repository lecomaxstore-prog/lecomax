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
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Restore saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError("Email ou mot de passe incorrect.");
    } else {
      if (rememberMe) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
      document.cookie = "admin_session=1; path=/; max-age=86400; SameSite=Strict";
      router.replace("/admin/dashboard");
    }
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
            <div className="w-9 h-9 bg-[#3ecf4c] rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-sm">E</span>
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
            <div className="w-9 h-9 bg-[#3ecf4c] rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-sm">E</span>
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
