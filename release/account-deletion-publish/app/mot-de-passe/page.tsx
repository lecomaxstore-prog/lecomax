"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "done">("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);

  useEffect(() => {
    let active = true;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.has("error") || fragment.has("error_code")) {
      window.history.replaceState(null, "", window.location.pathname);
      setState("invalid");
      return;
    }
    // getSession waits for Supabase to validate the recovery URL and establish
    // its session. Never update a password through an admin/service-role API.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (active) setState(!error && data.session ? "ready" : "invalid");
    }).catch(() => { if (active) setState("invalid"); });
    return () => { active = false; };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current || state !== "ready") return;
    if (password.length < 8) { setError("Utilisez au moins 8 caractères."); return; }
    if (password !== confirmation) { setError("Les deux mots de passe ne correspondent pas."); return; }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.code === "same_password" ? "Choisissez un mot de passe différent de l’ancien." : error.code === "weak_password" ? "Ce mot de passe est trop faible. Utilisez un mot de passe plus long et unique." : "Impossible de modifier le mot de passe. Réessayez ou demandez un nouveau lien.");
        return;
      }
      setPassword("");
      setConfirmation("");
      setState("done");
    } catch {
      setError("Vérifiez votre connexion puis réessayez.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[65vh] bg-[#F6F7F3] px-5 py-16">
      <section className="mx-auto max-w-md rounded-3xl border border-[#E1E8DB] bg-white p-7 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64745F]">L’ecomax · Mon compte</p>
        <h1 className="mt-3 text-2xl font-semibold text-[#203D2C]">Nouveau mot de passe</h1>
        {state === "loading" && <p role="status" className="mt-5 text-sm text-neutral-600">Vérification de votre lien…</p>}
        {state === "invalid" && <div className="mt-5 space-y-4 text-sm"><p role="alert">Ce lien est invalide ou a expiré. Demandez un nouveau lien depuis la connexion.</p><Link className="inline-block font-semibold text-[#203D2C] underline" href="/connexion">Demander un nouveau lien</Link></div>}
        {state === "done" && <div className="mt-5 space-y-4 text-sm"><p role="status">Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter sur le site ou dans l’application avec ce nouveau mot de passe.</p><Link className="inline-block font-semibold text-[#203D2C] underline" href="/connexion">Se connecter</Link></div>}
        {state === "ready" && <form onSubmit={submit} className="mt-6 space-y-5">
          <p className="text-sm leading-6 text-neutral-500">Choisissez un mot de passe unique d’au moins 8 caractères.</p>
          <label className="block text-sm font-medium">Nouveau mot de passe<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-neutral-200 bg-[#FCFCFA] px-4 focus:outline-none focus:ring-2 focus:ring-[#527357]" /></label>
          <label className="block text-sm font-medium">Confirmer le mot de passe<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-neutral-200 bg-[#FCFCFA] px-4 focus:outline-none focus:ring-2 focus:ring-[#527357]" /></label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={saving} className="min-h-12 w-full rounded-xl bg-[#203D2C] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer le mot de passe"}</button>
        </form>}
      </section>
    </main>
  );
}
