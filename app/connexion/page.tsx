"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { CUSTOMER_SESSION_KEY } from "@/lib/customer-api";
import { safeAuthReturnPath, startGoogleSignIn } from "@/lib/google-auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const expired = new URLSearchParams(window.location.search).get("reason") === "session_expired";
    setSessionExpired(expired);
    if (expired) window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
    const resetGoogleLoading = () => setGoogleLoading(false);
    window.addEventListener("pageshow", resetGoogleLoading);
    return () => window.removeEventListener("pageshow", resetGoogleLoading);
  }, []);

  const returnPath = () => {
    const value = new URLSearchParams(window.location.search).get("redirect") ?? "/compte";
    return safeAuthReturnPath(value);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Entrez votre adresse email ci-dessus, puis cliquez sur « Mot de passe oublié ».");
      return;
    }
    setResetLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/mot-de-passe`,
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
      window.localStorage.setItem(CUSTOMER_SESSION_KEY, "1");
      router.push(returnPath());
    }
  };

  const handleGoogle = async () => {
    if (googleLoading || loading) return;
    setError("");
    setGoogleLoading(true);
    try {
      await startGoogleSignIn(returnPath());
    } catch {
      setError("La connexion Google n’a pas pu démarrer. Veuillez réessayer ou utiliser votre adresse email.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>

        {/* Logo */}
        <div className={styles.brand}>
          <Link href="/" aria-label="L’ecomax — Accueil"><Logo showWordmark /></Link>
        </div>

        {/* Heading */}
        <p className={styles.eyebrow}>VOTRE ESPACE PERSONNEL</p>
        <h1 className={styles.heading}>
          Heureux de vous revoir.
        </h1>
        <p className={styles.subtitle}>
          Connectez-vous pour retrouver vos commandes et vos envies.
        </p>

        {sessionExpired && (
          <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-950">
            <svg className="mt-0.5 shrink-0" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></svg>
            <div><p className="text-xs font-bold">Session expirée pour votre sécurité</p><p className="mt-1 text-[11px] leading-4 text-amber-800">Reconnectez-vous pour reprendre votre navigation. Votre panier a été conservé.</p></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div role="alert" className="mb-4 rounded-lg px-4 py-3 border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Reset sent */}
        {resetSent && (
          <div role="status" className="mb-4 rounded-lg px-4 py-3 border border-green-200 bg-green-50 text-green-700 text-sm">
            Un email de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte.
          </div>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
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
            <div className={styles.passwordField}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
            />
            <button type="button" className={styles.passwordToggle} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
                {showPassword && <path d="m3 3 18 18" />}
              </svg>
            </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className={styles.submit}
          >
            {loading ? "Connexion…" : "Se connecter"}
            {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>}
          </button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span className="flex-1 h-px bg-neutral-200" />
          <span>ou continuer avec</span>
          <span className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          aria-busy={googleLoading}
          className={styles.google}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          {googleLoading ? <><span className={styles.smallSpinner} aria-hidden="true" />Ouverture de Google…</> : "Continuer avec Google"}
        </button>
        <p className={styles.googleHint} role="status">{googleLoading ? "Choisissez votre compte Google. Nous vous retrouverons juste après." : "Choisissez votre compte Google, nous nous occupons de la suite."}</p>

        {/* Register CTA */}
        <p className={styles.register}>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-bold text-black hover:underline underline-offset-2 transition-colors">
            Créer un compte
          </Link>
        </p>

        {/* Terms */}
        <p className={styles.terms}>
          En vous connectant, vous acceptez nos{" "}
          <Link href="/conditions-utilisation" className="underline underline-offset-2 hover:text-black transition-colors">Conditions d&apos;utilisation</Link>{"\ "}
          et notre{"\ "}
          <Link href="/politique-confidentialite" className="underline underline-offset-2 hover:text-black transition-colors">Politique de confidentialité</Link>.
        </p>

        <p className={styles.support}>Une question ? <Link href="/nous-contacter">Contactez-nous</Link></p>

      </div>
    </div>
  );
}
