"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MediaFile = { name: string; size: number; type: string; created_at: string; url: string };
function formatBytes(bytes: number) { if (!bytes) return "0 B"; const units = ["B", "KB", "MB", "GB"]; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`; }

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/media", { cache: "no-store" }); const result = await response.json().catch(() => null); if (!response.ok) throw new Error(result?.error || "Impossible de charger les images."); setFiles(Array.isArray(result) ? result : []); }
    catch (error) { setMessage({ ok: false, text: error instanceof Error ? error.message : "Chargement impossible." }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function upload(fileList: FileList | null) {
    if (!fileList?.length) return;
    const valid = Array.from(fileList).filter((file) => file.type.startsWith("image/") && file.size <= 15 * 1024 * 1024);
    if (valid.length !== fileList.length) { setMessage({ ok: false, text: "Certaines images sont invalides ou dépassent 15 Mo." }); if (!valid.length) return; }
    setUploading(true); setMessage(null);
    try {
      const responses = await Promise.all(valid.map((file) => { const body = new FormData(); body.append("file", file); return fetch("/api/upload", { method: "POST", body }); }));
      const failed = responses.filter((response) => !response.ok).length;
      if (failed) throw new Error(`${failed} image${failed > 1 ? "s" : ""} n’a pas pu être envoyée.`);
      setMessage({ ok: true, text: `${responses.length} image${responses.length > 1 ? "s ajoutées" : " ajoutée"}.` }); await load();
    } catch (error) { setMessage({ ok: false, text: error instanceof Error ? error.message : "Envoi impossible." }); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function remove(file: MediaFile) {
    if (!window.confirm(`Supprimer définitivement « ${file.name.split("/").pop()} » ?\n\nCette action est irréversible.`)) return;
    setDeleting(file.name); setMessage(null);
    try { const response = await fetch(`/api/media?name=${encodeURIComponent(file.name)}`, { method: "DELETE" }); const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.error || "Suppression impossible."); setFiles((current) => current.filter((item) => item.name !== file.name)); if (selected === file.name) setSelected(null); setMessage({ ok: true, text: "Image supprimée définitivement." }); }
    catch (error) { setMessage({ ok: false, text: error instanceof Error ? error.message : "Suppression impossible." }); }
    finally { setDeleting(null); }
  }

  async function copy(url: string) { try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setMessage({ ok: false, text: "Impossible de copier l’adresse." }); } }

  const filtered = files.filter((file) => file.name.toLocaleLowerCase("fr-FR").includes(search.toLocaleLowerCase("fr-FR")));
  const selectedFile = files.find((file) => file.name === selected);
  const totalSize = files.reduce((sum, file) => sum + Number(file.size || 0), 0);

  return <div className="mx-auto w-full max-w-[1600px] space-y-5">
    <header className="relative overflow-hidden rounded-[28px] bg-neutral-950 px-5 py-6 text-white shadow-xl sm:px-7 sm:py-7"><div className="absolute -right-12 -top-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" /><div className="admin-mobile-heading relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-300"><span className="h-2 w-2 rounded-full bg-cyan-400" />Fichiers de la boutique</div><h1 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">Médiathèque</h1><p className="mt-2 text-sm text-white/50">{files.length} fichier{files.length !== 1 ? "s" : ""} · {formatBytes(totalSize)} utilisés</p></div><button onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-black transition hover:bg-[#3ecf4c] disabled:opacity-50">{uploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" /> : <span className="text-lg">↑</span>}{uploading ? "Envoi en cours…" : "Ajouter des images"}</button></div></header>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif" multiple hidden onChange={(event) => void upload(event.target.files)} />
    {message && <div role="status" className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}><span className={`h-2.5 w-2.5 rounded-full ${message.ok ? "bg-emerald-500" : "bg-red-500"}`} />{message.text}</div>}

    <div className="flex min-w-0 gap-5">
      <main className="min-w-0 flex-1">
        <section onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(event) => { event.preventDefault(); setDragOver(false); void upload(event.dataTransfer.files); }} className={`mb-5 flex flex-col gap-3 rounded-2xl border-2 border-dashed p-3 transition sm:flex-row sm:items-center sm:p-4 ${dragOver ? "border-black bg-neutral-100" : "border-neutral-200 bg-white"}`}><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-neutral-500 hover:bg-neutral-100"><span className="text-lg text-neutral-300">⇧</span>{dragOver ? "Relâchez les images ici" : "Glissez des images ici"}</button><label className="relative min-w-0 flex-1"><span className="sr-only">Rechercher une image</span><svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom…" className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-black" /></label></section>

        {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{Array.from({length:12},(_,index)=><div key={index} className="aspect-square animate-pulse rounded-2xl bg-neutral-200" />)}</div> : filtered.length === 0 ? <div className="rounded-[26px] border border-neutral-200 bg-white px-5 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-2xl text-cyan-600">▧</span><h2 className="mt-4 font-black">{search ? "Aucune image trouvée" : "Votre médiathèque est vide"}</h2><p className="mt-1 text-sm text-neutral-400">{search ? "Essayez un autre nom de fichier." : "Ajoutez des images pour les utiliser dans votre boutique."}</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{filtered.map((file) => <MediaTile key={file.name} file={file} selected={selected === file.name} deleting={deleting === file.name} onSelect={() => setSelected(file.name === selected ? null : file.name)} onDelete={() => void remove(file)} />)}</div>}
      </main>

      {selectedFile && <aside className="admin-dialog-overlay fixed inset-0 z-40 flex items-end bg-black/55 p-0 backdrop-blur-sm lg:static lg:z-auto lg:block lg:w-80 lg:shrink-0 lg:bg-transparent lg:p-0" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl lg:sticky lg:top-4 lg:max-h-none lg:rounded-[24px] lg:border lg:border-neutral-200 lg:shadow-sm"><div className="flex items-center justify-between border-b border-neutral-100 p-4 lg:hidden"><p className="text-sm font-black">Détails de l’image</p><button onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">×</button></div><img src={selectedFile.url} alt={selectedFile.name} className="aspect-square w-full bg-neutral-100 object-contain" loading="lazy" decoding="async" /><div className="space-y-4 p-5"><div><p className="break-all text-sm font-black">{selectedFile.name.split("/").pop()}</p><p className="mt-1 break-all text-[10px] text-neutral-400">{selectedFile.name}</p></div><div className="grid grid-cols-2 gap-2"><Info label="Taille" value={formatBytes(selectedFile.size)} /><Info label="Type" value={selectedFile.type || "Image"} /><Info label="Ajoutée" value={selectedFile.created_at ? new Date(selectedFile.created_at).toLocaleDateString("fr-FR") : "—"} /><Info label="Dossier" value={selectedFile.name.includes("/") ? selectedFile.name.split("/").slice(0,-1).join("/") : "Racine"} /></div><button onClick={() => void copy(selectedFile.url)} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 text-xs font-bold hover:border-black">{copied ? "Adresse copiée ✓" : "Copier l’adresse"}</button><a href={selectedFile.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 text-xs font-bold hover:border-black">Ouvrir l’image ↗</a><button onClick={() => void remove(selectedFile)} disabled={deleting === selectedFile.name} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-xs font-black text-red-600 hover:bg-red-100 disabled:opacity-50">{deleting === selectedFile.name ? "Suppression…" : "Supprimer définitivement"}</button></div></div></aside>}
    </div>
  </div>;
}

function MediaTile({ file, selected, deleting, onSelect, onDelete }: { file: MediaFile; selected: boolean; deleting: boolean; onSelect: () => void; onDelete: () => void }) { return <article className={`group relative aspect-square overflow-hidden rounded-2xl border-2 bg-neutral-100 transition-all ${selected ? "border-black shadow-md" : "border-transparent hover:border-neutral-300"}`}><button type="button" onClick={onSelect} aria-label={`Afficher les détails de ${file.name}`} className="absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3ecf4c]"><img src={file.url} alt={file.name} className="h-full w-full object-cover" loading="lazy" /><span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2.5 pt-8 text-left opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><span className="block truncate text-[9px] font-bold text-white">{file.name.split("/").pop()}</span></span></button><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }} disabled={deleting} aria-label={`Supprimer ${file.name}`} title="Supprimer cette image" className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/65 text-white shadow-lg backdrop-blur transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60 sm:h-9 sm:w-9 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100">{deleting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m5 4v7m4-7v7" /></svg>}</button>{deleting && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm"><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black shadow">Suppression…</span></div>}</article>; }
function Info({label,value}:{label:string;value:string}){return <div className="min-w-0 rounded-xl bg-neutral-50 p-3"><p className="text-[9px] font-extrabold uppercase tracking-wider text-neutral-400">{label}</p><p className="mt-1 truncate text-[11px] font-bold text-neutral-700">{value}</p></div>}
