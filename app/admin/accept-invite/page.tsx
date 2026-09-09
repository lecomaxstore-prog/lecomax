"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AcceptInvitePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f4]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AcceptInvitePage />
    </Suspense>
  );
}

function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  // Supabase sends #access_token=...&type=invite in the hash
  const [mode, setMode] = useState<"loading" | "set-password" | "invalid" | "done">("loading");
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // Case 1: Supabase magic-link hash — user arrived from Supabase invite email
      const hash = window.location.hash;
      if (hash.includes("access_token") && hash.includes("type=invite")) {
        // Supabase client auto-processes the hash and sets the session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setStaffEmail(session.user.email);
          setStaffName(session.user.user_metadata?.name ?? "");
          setMode("set-password");
          return;
        }
      }

      // Case 2: Custom token in query param
      if (token) {
        const res = await fetch(`/api/admin/staff/verify-invite?token=${token}`).catch(() => null);
        if (res?.ok) {
          const d = await res.json();
          setStaffName(d.name ?? "");
          setStaffEmail(d.email ?? "");
          setMode("set-password");
          return;
        }
      }

      setMode("invalid");
    }
    init();
  }, [token]);

  async function submit() {
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }

    setSaving(true);
    setError(null);

    // If we have a Supabase session (from magic link), just update the password
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) { setError(pwErr.message); setSaving(false); return; }
    } else if (token && staffEmail) {
      // Sign up via custom token flow
      const { error: signUpErr } = await supabase.auth.signUp({
        email: staffEmail,
        password,
        options: { data: { name: staffName } },
      });
      if (signUpErr) { setError(signUpErr.message); setSaving(false); return; }
    }

    // Mark staff as active
    if (token) {
      await fetch("/api/admin/staff/verify-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }

    setMode("done");
    setTimeout(() => router.replace("/admin"), 2000);
  }

  if (mode === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-400 font-medium">Vérification du lien…</p>
        </div>
      </div>
    );
  }

  if (mode === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f4] p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-lg font-black mb-2">Lien invalide ou expiré</h1>
          <p className="text-sm text-neutral-400 mb-6">Ce lien d&apos;invitation n&apos;est plus valable. Demandez une nouvelle invitation.</p>
          <Link href="/admin" className="inline-block bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-neutral-800 transition-colors">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f4] p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-lg font-black mb-2">Compte créé !</h1>
          <p className="text-sm text-neutral-400">Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f6f4] p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <img src="/favicon.png" alt="L'ecomax" className="w-10 h-10 rounded-xl" loading="lazy" decoding="async" />
          <div>
            <p className="text-xs text-neutral-400 font-medium">Panneau Admin</p>
            <p className="font-black text-lg leading-tight">L&apos;ECOMAX</p>
          </div>
        </div>

        <h1 className="text-xl font-black mb-1">Créer votre compte</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Bienvenue <strong className="text-neutral-700">{staffName}</strong> — définissez votre mot de passe pour accéder au panel.
        </p>

        {/* Email display */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Email</label>
          <div className="w-full border border-neutral-100 bg-neutral-50 rounded-xl px-3 py-2.5 text-sm text-neutral-500 font-medium">
            {staffEmail}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Mot de passe *</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            placeholder="Minimum 8 caractères"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="mb-5">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5">Confirmer le mot de passe *</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Répéter le mot de passe"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600 font-medium mb-4">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving || !password || !confirm}
          className="w-full py-3 rounded-2xl bg-black text-white font-bold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Création du compte…" : "Créer mon compte"}
        </button>
      </div>
    </div>
  );
}
