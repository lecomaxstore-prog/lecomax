"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Entrez votre adresse email ci-dessus, puis cliquez sur « Mot de passe oublié ».");
      return;
    }
    setResetLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/compte/profil`,
    });
    setResetLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect."
        : error.message);
    } else {
      router.push("/compte");
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/compte` },
    });
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
          Connexion
        </h1>
        <p className="text-sm text-neutral-500 text-center mb-8">
          Accédez à votre espace L&apos;ecomax
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Reset sent */}
        {resetSent && (
          <div className="mb-4 px-4 py-3 border border-green-200 bg-green-50 text-green-700 text-sm">
            Un email de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte.
          </div>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-[11px] text-neutral-500 hover:text-black underline underline-offset-2 transition-colors disabled:opacity-50"
              >
                {resetLoading ? "Envoi…" : "Mot de passe oublié ?"}
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-black text-white font-bold uppercase text-sm tracking-widest py-4 hover:bg-neutral-800 active:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

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

        {/* Register CTA */}
        <p className="text-sm text-neutral-500 text-center mt-6">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-bold text-black hover:underline underline-offset-2 transition-colors">
            Créer un compte
          </Link>
        </p>

        {/* Terms */}
        <p className="text-[11px] text-neutral-400 text-center mt-6 leading-relaxed">
          En vous connectant, vous acceptez nos{" "}
          <Link href="/conditions-utilisation" className="underline underline-offset-2 hover:text-black transition-colors">Conditions d&apos;utilisation</Link>{"\ "}
          et notre{"\ "}
          <Link href="/politique-confidentialite" className="underline underline-offset-2 hover:text-black transition-colors">Politique de confidentialité</Link>.
        </p>

      </div>
    </div>
  );
}
