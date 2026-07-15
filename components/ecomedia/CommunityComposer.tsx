"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { EcomediaPost } from "@/lib/ecomedia";
import { supabase } from "@/lib/supabase";
import EcomediaAuthPrompt from "./EcomediaAuthPrompt";

const MAX_PHOTO_SIZE = 15 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export default function CommunityComposer({ onPublished }: { onPublished: (post: EcomediaPost) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setChecked(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.user_metadata?.prenom ?? user?.email?.split("@")[0] ?? "Membre";
  const firstName = String(name).split(" ")[0];
  const initial = String(name).charAt(0).toUpperCase();

  function startPost() {
    if (!user) { setShowAuth(true); return; }
    setError("");
    setOpen(true);
  }

  function selectPhoto(next: File | null) {
    if (!next) return;
    if (!PHOTO_TYPES.includes(next.type)) {
      setError("Choisissez une photo JPG, PNG, WEBP ou AVIF.");
      return;
    }
    if (next.size > MAX_PHOTO_SIZE) {
      setError("La photo dépasse la limite de 15 Mo.");
      return;
    }
    setError("");
    setFile(next);
  }

  async function publish() {
    if (submitting || (!content.trim() && !file)) return;
    setSubmitting(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setOpen(false); setShowAuth(true); return; }
      let mediaUrl: string | null = null;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("scope", "community");
        const upload = await fetch("/api/ecomedia/upload/", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: form,
        });
        const uploadData = await upload.json();
        if (!upload.ok) throw new Error(uploadData.error ?? "La photo n’a pas pu être envoyée.");
        mediaUrl = uploadData.url;
      }
      const response = await fetch("/api/ecomedia/posts/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ content: content.trim(), mediaUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Publication impossible.");
      if (data.moderation_status !== "pending") onPublished(data as EcomediaPost);
      setNotice("Publication envoyée ! Elle apparaîtra après validation par l’administrateur.");
      window.setTimeout(() => setNotice(""), 6000);
      setContent("");
      setFile(null);
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="border-b border-neutral-100 bg-white px-3 pb-4 pt-3 sm:px-4">
        <div className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,.045)]">
          <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${user ? "bg-neutral-950 text-[#3ecf4c] shadow-lg shadow-black/10" : "bg-neutral-100 text-neutral-400"}`}>
              {user ? initial : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21a8 8 0 00-16 0"/><circle cx="12" cy="7" r="4"/></svg>}
            </div>
            <button type="button" onClick={startPost} disabled={!checked} className="group min-h-12 flex-1 rounded-2xl bg-neutral-50 px-4 text-left transition hover:bg-neutral-100 disabled:opacity-60">
              <span className="block text-[13px] font-medium text-neutral-500 group-hover:text-neutral-700">
                {user ? `Quoi de neuf, ${firstName} ?` : "Partagez une idée avec la communauté"}
              </span>
              <span className="mt-0.5 hidden text-[9px] text-neutral-400 sm:block">Texte ou photo · Validation avant publication</span>
            </button>
            <button type="button" onClick={startPost} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3ecf4c] text-black shadow-[0_10px_24px_rgba(62,207,76,.22)] transition hover:-translate-y-0.5 hover:bg-[#16b277] hover:text-white active:scale-95" aria-label="Créer une publication">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={startPost} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[10px] font-black text-neutral-600 transition hover:bg-neutral-50 hover:text-black">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 5h16M4 12h12M4 19h8"/></svg>
                Texte
              </button>
              <span className="h-4 w-px bg-neutral-200" />
              <button type="button" onClick={startPost} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[10px] font-black text-neutral-600 transition hover:bg-green-50 hover:text-[#16b277]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                Photo
              </button>
            </div>
            <span className="hidden items-center gap-1.5 text-[9px] font-medium text-neutral-400 sm:flex">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16b277" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
              Membres vérifiés
            </span>
          </div>
        </div>
        {notice && <p role="status" className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-bold leading-5 text-emerald-800">✓ {notice}</p>}
        {!user && checked && <p className="mt-2.5 px-2 text-[9px] leading-4 text-neutral-400">Lecture libre · Connectez-vous gratuitement pour publier du texte ou une photo.</p>}
      </section>

      {open && user && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 backdrop-blur-md sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="community-composer-title">
          <button type="button" className="absolute inset-0" onClick={() => setOpen(false)} aria-label="Fermer" />
          <div className="relative max-h-[94dvh] w-full max-w-[540px] overflow-y-auto rounded-t-[30px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:rounded-[30px]">
            <header className="relative overflow-hidden bg-neutral-950 px-5 pb-6 pt-5 text-white sm:px-6">
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#3ecf4c]/15 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#3ecf4c]">Ecomedia communauté</p><h2 id="community-composer-title" className="mt-2 text-xl font-black">Créer une publication</h2><p className="mt-1 text-[10px] text-white/45">Votre publication sera vérifiée avant sa mise en ligne.</p></div>
                <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[.07] text-white/70 transition hover:bg-white/15 hover:text-white" aria-label="Fermer"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
              </div>
            </header>

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-xs font-black text-[#3ecf4c]">{initial}</div><div><p className="text-[13px] font-black">{name}</p><p className="mt-0.5 text-[9px] text-neutral-400">Texte ou une photo uniquement</p></div></div>
              <textarea autoFocus value={content} onChange={event => setContent(event.target.value)} maxLength={2000} rows={5} placeholder="Partagez une idée, une découverte ou un moment…" className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-[14px] leading-6 outline-none transition placeholder:text-neutral-300 focus:border-neutral-400 focus:bg-white" />
              {preview && <div className="relative mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"><img src={preview} alt="Aperçu de la publication" className="max-h-[390px] w-full object-contain"/><button type="button" onClick={() => setFile(null)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur" aria-label="Retirer la photo"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>}
              {error && <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">{error}</p>}

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-neutral-200 p-3.5">
                <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-[#16b277]"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></span><div><p className="text-[11px] font-black">{file ? "Changer la photo" : "Ajouter une photo"}</p><p className="mt-0.5 text-[8px] text-neutral-400">JPG, PNG, WEBP ou AVIF · 15 Mo max.</p></div></div>
                <button type="button" onClick={() => inputRef.current?.click()} className="rounded-xl bg-neutral-950 px-3.5 py-2.5 text-[9px] font-black text-white transition hover:bg-[#16b277]">Choisir</button>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={event => { selectPhoto(event.target.files?.[0] ?? null); event.target.value = ""; }} />
              </div>

              <div className="mt-5 flex items-center justify-between"><span className="text-[9px] tabular-nums text-neutral-400">{content.length} / 2 000</span><button type="button" onClick={publish} disabled={submitting || (!content.trim() && !file)} className="min-w-36 rounded-2xl bg-[#3ecf4c] px-6 py-3.5 text-xs font-black text-black shadow-[0_10px_24px_rgba(62,207,76,.2)] transition hover:bg-[#16b277] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "Publication…" : "Publier maintenant"}</button></div>
            </div>
          </div>
        </div>
      )}

      {showAuth && <EcomediaAuthPrompt action="post" redirectPath="/ecomedia" onClose={() => setShowAuth(false)} />}
    </>
  );
}
