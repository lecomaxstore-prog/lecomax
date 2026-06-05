"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError("Email ou mot de passe incorrect.");
    } else {
      // Set a cookie the middleware can read (Supabase uses localStorage, not cookies)
      document.cookie = "admin_session=1; path=/; max-age=86400; SameSite=Strict";
      router.replace("/admin/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[46%] bg-black flex-col justify-between p-12 relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Green accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3ecf4c] via-[#6bdd6b] to-[#3ecf4c]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-[#3ecf4c] rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-sm">E</span>
            </div>
            <div>
              <p className="text-white font-black tracking-wide text-sm">L&apos;ECOMAX</p>
              <p className="text-white/30 text-[10px] uppercase tracking-widest">Administration</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Gérez votre<br />boutique<br /><span className="text-[#3ecf4c]">en toute simplicité.</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Commandes, produits, clients, promotions — tout depuis un seul tableau de bord.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          {[["500+", "Commandes"], ["4.8/5", "Satisfaction"], ["48H", "Livraison"]].map(([num, label]) => (
            <div key={label}>
              <p className="text-[#3ecf4c] font-black text-xl">{num}</p>
              <p className="text-white/30 text-[10px] uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-[#f6f6f4] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <div>
              <p className="font-black tracking-wide text-sm">L&apos;ECOMAX</p>
              <p className="text-neutral-400 text-[10px] uppercase tracking-widest">Administration</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight mb-1">Bienvenue</h1>
            <p className="text-neutral-500 text-sm">Connectez-vous à votre espace admin</p>
          </div>

          <div className="bg-white border border-neutral-100 rounded-2xl p-7 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lecomax.com"
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-neutral-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-neutral-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-xl">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connexion…</>
                ) : (
                  <>
                    Se connecter
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-neutral-400 mt-6 uppercase tracking-widest">
            L&apos;ECOMAX © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
