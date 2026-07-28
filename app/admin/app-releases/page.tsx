"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AndroidReleaseRow } from "@/lib/app-releases";

type Draft = {
  versionName: string;
  versionCode: string;
  minimumAndroidVersion: string;
  releaseNotes: string;
  required: boolean;
};

const initialDraft: Draft = {
  versionName: "1.0.0",
  versionCode: "1",
  minimumAndroidVersion: "8.0",
  releaseNotes: "",
  required: false,
};

function size(value: number) {
  return `${(value / 1024 / 1024).toFixed(1)} Mo`;
}

export default function AdminAppReleasesPage() {
  const [releases, setReleases] = useState<AndroidReleaseRow[]>([]);
  const [draft, setDraft] = useState(initialDraft);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/app-releases", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossible de charger les versions.");
      setReleases(payload.releases ?? []);
      const highest = Math.max(0, ...(payload.releases ?? []).map((item: AndroidReleaseRow) => item.version_code));
      setDraft((current) => current.versionCode === "1" ? { ...current, versionCode: String(highest + 1) } : current);
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Chargement impossible." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || working) return;
    setWorking(true);
    setMessage(null);
    const metadata = {
      versionName: draft.versionName.trim(),
      versionCode: Number(draft.versionCode),
      minimumAndroidVersion: draft.minimumAndroidVersion.trim(),
      releaseNotes: draft.releaseNotes.split(/\r?\n/).map((note) => note.trim()).filter(Boolean),
      required: draft.required,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/vnd.android.package-archive",
    };
    try {
      setProgress("Création de l’autorisation sécurisée…");
      const ticketResponse = await fetch("/api/admin/app-releases/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const ticket = await ticketResponse.json();
      if (!ticketResponse.ok) throw new Error(ticket.error || "L’envoi n’a pas pu être préparé.");

      setProgress("Envoi direct du fichier APK…");
      const upload = await supabase.storage
        .from(ticket.bucket)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: "application/vnd.android.package-archive",
          cacheControl: "31536000",
        });
      if (upload.error) throw new Error(upload.error.message);

      setProgress("Vérification SHA-256 et intégrité APK…");
      const finalizeResponse = await fetch("/api/admin/app-releases/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...metadata, storagePath: ticket.path }),
      });
      const finalized = await finalizeResponse.json();
      if (!finalizeResponse.ok) throw new Error(finalized.error || "La vérification du fichier a échoué.");

      setMessage({ ok: true, text: `Version ${metadata.versionName} vérifiée. Publiez-la après votre test d’installation.` });
      setFile(null);
      setDraft((current) => ({ ...initialDraft, versionCode: String(Number(current.versionCode) + 1) }));
      await load();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Envoi impossible." });
    } finally {
      setProgress("");
      setWorking(false);
    }
  }

  async function action(id: string, nextAction: "publish" | "rollback" | "unpublish" | "set-required", required?: boolean) {
    if (working) return;
    setWorking(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/app-releases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction, required }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Action impossible.");
      setMessage({ ok: true, text: "Version mise à jour." });
      await load();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Action impossible." });
    } finally {
      setWorking(false);
    }
  }

  async function remove(release: AndroidReleaseRow) {
    if (working || release.published || !window.confirm(`Supprimer définitivement la version ${release.version_name} non publiée ?`)) return;
    setWorking(true);
    try {
      const response = await fetch(`/api/admin/app-releases/${release.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Suppression impossible.");
      setMessage({ ok: true, text: payload.warning || "Version non publiée supprimée." });
      await load();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Suppression impossible." });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-6">
      <header className="overflow-hidden rounded-[28px] bg-[#080808] p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#42df68]">Distribution Android sécurisée</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Versions de l’application</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Envoyez, vérifiez, testez et publiez les APK officiels. Une seule version peut être publique à la fois.
            </p>
          </div>
          <Link href="/download" target="_blank" className="inline-flex min-h-11 items-center justify-center bg-[#42df68] px-5 text-xs font-black text-black">
            OUVRIR LA PAGE PUBLIQUE ↗
          </Link>
        </div>
      </header>

      {message && (
        <div role="status" className={`border p-4 text-sm font-bold ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="h-fit border border-neutral-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-black">Nouvelle version</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">La publication reste manuelle après le contrôle du fichier.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Version" value={draft.versionName} onChange={(value) => setDraft({ ...draft, versionName: value })} placeholder="1.0.0" />
            <Field label="Code Android" value={draft.versionCode} onChange={(value) => setDraft({ ...draft, versionCode: value })} type="number" />
            <div className="sm:col-span-2"><Field label="Android minimum" value={draft.minimumAndroidVersion} onChange={(value) => setDraft({ ...draft, minimumAndroidVersion: value })} placeholder="8.0" /></div>
            <label className="sm:col-span-2 text-[11px] font-black text-neutral-600">
              Notes de version <span className="font-normal text-neutral-400">(une ligne par note)</span>
              <textarea value={draft.releaseNotes} onChange={(event) => setDraft({ ...draft, releaseNotes: event.target.value })} required rows={5} maxLength={6000} className="mt-1.5 w-full border border-neutral-200 p-3 text-sm font-normal outline-none focus:border-black" />
            </label>
            <label className="sm:col-span-2 flex min-h-12 items-center gap-3 border border-neutral-200 p-3 text-sm font-bold">
              <input type="checkbox" checked={draft.required} onChange={(event) => setDraft({ ...draft, required: event.target.checked })} className="h-5 w-5 accent-black" />
              Mise à jour obligatoire
            </label>
            <label className="sm:col-span-2 block border-2 border-dashed border-neutral-300 p-5 text-center">
              <span className="block text-xs font-black uppercase tracking-wider">Fichier APK signé</span>
              <span className="mt-2 block truncate text-xs text-neutral-500">{file?.name || "Maximum 150 Mo"}</span>
              <input
                type="file"
                accept=".apk,application/vnd.android.package-archive,application/octet-stream"
                required
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-4 block w-full text-xs file:mr-3 file:border-0 file:bg-black file:px-4 file:py-2 file:font-black file:text-white"
              />
            </label>
          </div>
          <button type="submit" disabled={!file || working} className="mt-5 min-h-12 w-full bg-black px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
            {working ? progress || "TRAITEMENT…" : "ENVOYER ET VÉRIFIER"}
          </button>
        </form>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">Historique</p>
              <h2 className="mt-1 text-2xl font-black">Versions Android</h2>
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className="min-h-11 border border-neutral-200 px-4 text-xs font-black">ACTUALISER</button>
          </div>
          {loading ? (
            <div className="grid gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse bg-neutral-100" />)}</div>
          ) : releases.length === 0 ? (
            <div className="border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">Aucune version enregistrée.</div>
          ) : (
            <div className="grid gap-3">
              {releases.map((release, index) => (
                <article key={release.id} className={`border bg-white p-5 ${release.published ? "border-emerald-400 ring-1 ring-emerald-200" : "border-neutral-200"}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black">v{release.version_name}</h3>
                        <span className="bg-neutral-100 px-2 py-1 text-[10px] font-black">CODE {release.version_code}</span>
                        {release.published && <span className="bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">PUBLIÉE</span>}
                        {release.required && <span className="bg-red-100 px-2 py-1 text-[10px] font-black text-red-800">OBLIGATOIRE</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
                        <span>{size(release.file_size)}</span>
                        <span>Android {release.minimum_android_version}+</span>
                        <span>{release.download_count.toLocaleString("fr-FR")} téléchargements</span>
                        <span>{new Date(release.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <code className="mt-3 block max-w-xl break-all text-[10px] leading-4 text-neutral-400">SHA-256 {release.sha256}</code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/downloads/${release.file_name}`)} className="min-h-10 border border-neutral-200 px-3 text-[10px] font-black">COPIER URL</button>
                      <button type="button" onClick={() => void action(release.id, "set-required", !release.required)} disabled={working} className="min-h-10 border border-neutral-200 px-3 text-[10px] font-black">{release.required ? "RENDRE OPTIONNELLE" : "RENDRE OBLIGATOIRE"}</button>
                      {release.published ? (
                        <button type="button" onClick={() => void action(release.id, "unpublish")} disabled={working} className="min-h-10 bg-neutral-800 px-3 text-[10px] font-black text-white">DÉPUBLIER</button>
                      ) : (
                        <button type="button" onClick={() => void action(release.id, index === 0 ? "publish" : "rollback")} disabled={working} className="min-h-10 bg-emerald-500 px-3 text-[10px] font-black text-black">{index === 0 ? "PUBLIER" : "RESTAURER"}</button>
                      )}
                      {!release.published && <button type="button" onClick={() => void remove(release)} disabled={working} className="min-h-10 border border-red-200 px-3 text-[10px] font-black text-red-700">SUPPRIMER</button>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="text-[11px] font-black text-neutral-600">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required min={type === "number" ? 1 : undefined} className="mt-1.5 min-h-11 w-full border border-neutral-200 px-3 text-sm font-normal outline-none focus:border-black" />
    </label>
  );
}
