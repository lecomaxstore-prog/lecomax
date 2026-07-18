"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { customerApiFetch } from "@/lib/customer-api";

export default function ProfilPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(0);
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [confirmAvatarRemoval, setConfirmAvatarRemoval] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const meta = session.user.user_metadata;
        setEmail(session.user.email ?? "");
        setPrenom(meta?.prenom || (meta?.full_name || meta?.name || "").split(" ")[0] || "");
        setNom(meta?.nom || (meta?.full_name || meta?.name || "").split(" ").slice(1).join(" ") || "");
        setPhone(meta?.phone || "");
        setAvatarUrl(meta?.avatar_url || meta?.picture || "");
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setAwardedPoints(0);
    setError("");
    try {
      const response = await customerApiFetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible d’enregistrer votre profil.");
      setPrenom(data.profile.prenom);
      setNom(data.profile.nom);
      setPhone(data.profile.phone);
      const awarded = Number(data.loyalty?.awarded ?? 0);
      setAwardedPoints(awarded);
      await supabase.auth.refreshSession();
      window.dispatchEvent(new CustomEvent("lecomax:profile-updated", { detail: { fullName: data.profile.full_name } }));
      window.dispatchEvent(new CustomEvent("lecomax:loyalty-updated", { detail: data.loyalty }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d’enregistrer votre profil.");
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileSession = async (nextAvatar: string) => {
    await supabase.auth.refreshSession();
    window.dispatchEvent(new CustomEvent("lecomax:profile-updated", { detail: { avatarUrl: nextAvatar } }));
  };

  const uploadAvatar = async (file: File | null) => {
    if (!file || avatarLoading) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Utilisez une photo JPG, PNG, WEBP ou AVIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La photo de profil doit peser moins de 5 Mo.");
      return;
    }
    setAvatarLoading(true);
    setConfirmAvatarRemoval(false);
    setSaved(false);
    setAwardedPoints(0);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Votre session a expiré. Reconnectez-vous.");
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de modifier la photo.");
      setAvatarUrl(data.avatarUrl);
      const awarded = Number(data.loyalty?.awarded ?? 0);
      setAwardedPoints(awarded);
      await refreshProfileSession(data.avatarUrl);
      window.dispatchEvent(new CustomEvent("lecomax:loyalty-updated", { detail: data.loyalty }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de modifier la photo.");
    } finally {
      setAvatarLoading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    if (avatarLoading) return;
    setAvatarLoading(true);
    setSaved(false);
    setAwardedPoints(0);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Votre session a expiré. Reconnectez-vous.");
      const response = await fetch("/api/account/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible de supprimer la photo.");
      setAvatarUrl("");
      setConfirmAvatarRemoval(false);
      await refreshProfileSession("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de supprimer la photo.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const profileInitials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || email.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400 mb-1">Mon compte</p>
        <h1 className="font-black text-[26px] uppercase tracking-tight">Mon profil</h1>
      </div>

      {/* Profile photo */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,.045)]">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">Identité</p>
            <h2 className="text-[14px] font-black uppercase tracking-wide">Photo de profil</h2>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">+10 points · 1 fois</span>
        </div>
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-black shadow-[0_10px_30px_rgba(0,0,0,.18)] ring-1 ring-neutral-200">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Photo de profil" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#3ecf4c]">{profileInitials}</div>
            )}
            {avatarLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-neutral-900">Personnalisez votre compte</p>
            <p className="mt-1 max-w-xl text-[11px] leading-5 text-neutral-500">Cette photo apparaîtra dans votre espace client ainsi que sur vos publications, commentaires et réponses Ecomedia.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarLoading} className="rounded-xl bg-black px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-emerald-600 disabled:opacity-50">{avatarUrl ? "Changer la photo" : "Ajouter une photo"}</button>
              {avatarUrl && !confirmAvatarRemoval && <button type="button" onClick={() => setConfirmAvatarRemoval(true)} disabled={avatarLoading} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-neutral-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">Supprimer</button>}
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={event => void uploadAvatar(event.target.files?.[0] ?? null)} />
            </div>
            <p className="mt-2 text-[9px] text-neutral-400">JPG, PNG, WEBP ou AVIF · 5 Mo maximum.</p>
            {confirmAvatarRemoval && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-[10px] font-bold text-red-700">Retirer votre photo de profil partout ?</p>
                <div className="flex gap-2"><button type="button" onClick={() => setConfirmAvatarRemoval(false)} className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-neutral-600">Annuler</button><button type="button" onClick={() => void removeAvatar()} disabled={avatarLoading} className="rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-50">Confirmer</button></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Form card */}
      <div className="bg-white border border-neutral-100">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-0.5">Informations</p>
            <h2 className="font-black text-[14px] uppercase tracking-wide">Informations personnelles</h2>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">+10 points · 1 fois</span>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">

          {error && (
            <div className="px-4 py-3 border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          {saved && (
            <div className="px-4 py-3 border border-green-200 bg-green-50 text-green-700 text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Modifications enregistrées
              {awardedPoints > 0 && <span className="ml-auto">+{awardedPoints} points EcoClub</span>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Karim"
                className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Alaoui"
                className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Adresse email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-400 cursor-not-allowed"
            />
            <p className="text-[11px] text-neutral-400">L&apos;adresse email ne peut pas être modifiée ici.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 6XX XXX XXX"
              className="w-full border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white font-black text-[11px] uppercase tracking-widest px-8 py-3.5 hover:bg-neutral-800 active:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white border border-neutral-100">
        <div className="px-6 py-5 border-b border-neutral-100">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-0.5">Sécurité</p>
          <h2 className="font-black text-[14px] uppercase tracking-wide">Mot de passe</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[12px] text-neutral-500 leading-relaxed max-w-md">
            Pour modifier votre mot de passe, nous vous enverrons un lien de réinitialisation à votre adresse email.
          </p>
          <ChangePasswordButton email={email} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-red-100 bg-white">
        <div className="px-6 py-5 border-b border-red-100">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-0.5">Zone sensible</p>
          <h2 className="font-black text-[14px] uppercase tracking-wide text-red-700">Supprimer mon compte</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[12px] text-neutral-500 leading-relaxed max-w-md">
            La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
          </p>
          <button
            type="button"
            className="text-[11px] font-black uppercase tracking-widest px-6 py-3 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>

    </div>
  );
}

function ChangePasswordButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/compte/profil`,
    });
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <p className="text-[11px] font-bold uppercase tracking-widest text-green-600 whitespace-nowrap">
        ✓ Email envoyé
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={loading}
      className="text-[11px] font-black uppercase tracking-widest px-6 py-3 border border-neutral-200 text-black hover:bg-black hover:text-white hover:border-black transition-colors whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
    >
      {loading ? "Envoi…" : "Modifier le mot de passe"}
    </button>
  );
}
