"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { safeAuthReturnPath, startGoogleSignIn } from "@/lib/google-auth";

export default function RegisterPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const resetGoogleLoading = () => setGoogleLoading(false);
    window.addEventListener("pageshow", resetGoogleLoading);
    return () => window.removeEventListener("pageshow", resetGoogleLoading);
  }, []);

  const returnPath = () => {
    const value = new URLSearchParams(window.location.search).get("redirect") ?? "/compte";
    return safeAuthReturnPath(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, prenom, nom }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Une erreur est survenue.");
      } else {
        setSuccess("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
      }
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading || loading) return;
    setError("");
    setGoogleLoading(true);
    try {
      await startGoogleSignIn(returnPath());
    } catch {
      setError("La connexion Google n’a pas pu démarrer. Veuillez réessayer.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16 bg-white">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo /></Link>
        </div>

        {/* Heading */}
        <h1 className="font-black text-[28px] tracking-tight uppercase text-center mb-1">
          Créer un compte
        </h1>
        <p className="text-sm text-neutral-500 text-center mb-8">
          Rejoignez L&apos;ecomax et profitez d&apos;avantages exclusifs
        </p>

        {/* Error / Success */}
        {error && (
          <div className="mb-4 px-4 py-3 border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 border border-green-200 bg-green-50 text-green-700 text-sm">
            {success}
            <Link href={`/connexion?redirect=${encodeURIComponent(typeof window === "undefined" ? "/ecomedia" : returnPath())}`} className="block mt-3 text-center font-bold text-sm text-black underline underline-offset-2 hover:text-neutral-700 transition-colors">
              Aller à la page de connexion →
            </Link>
          </div>
        )}

        {!success && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prenom" className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Prénom</label>
                <input
                  id="prenom" type="text" autoComplete="given-name" required
                  value={prenom} onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Zakaria"
                  className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nom" className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Nom</label>
                <input
                  id="nom" type="text" autoComplete="family-name" required
                  value={nom} onChange={(e) => setNom(e.target.value)}
                  placeholder="Zemzami"
                  className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Adresse email</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Mot de passe</label>
              <input
                id="password" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password-confirm" className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Confirmer le mot de passe</label>
              <input
                id="password-confirm" type="password" autoComplete="new-password" required
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-black text-white font-bold uppercase text-sm tracking-widest py-4 hover:bg-neutral-800 active:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px bg-neutral-200" />
          <span className="text-[11px] text-neutral-400 uppercase tracking-widest">ou</span>
          <span className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 border border-neutral-200 py-3.5 text-sm font-semibold text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 active:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          {googleLoading ? "Redirection…" : "Continuer avec Google"}
        </button>

        {/* Login CTA */}
        <p className="text-sm text-neutral-500 text-center mt-6">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-bold text-black hover:underline underline-offset-2 transition-colors">
            Se connecter
          </Link>
        </p>

        {/* Terms */}
        <p className="text-[11px] text-neutral-400 text-center mt-6 leading-relaxed">
          En créant un compte, vous acceptez nos{" "}
          <Link href="/conditions-utilisation" className="underline underline-offset-2 hover:text-black transition-colors">Conditions d&apos;utilisation</Link>{"\ "}
          et notre{"\ "}
          <Link href="/politique-confidentialite" className="underline underline-offset-2 hover:text-black transition-colors">Politique de confidentialité</Link>.
        </p>

      </div>
    </div>
  );
}
