"use client";
import { useEffect, useState, useCallback, useRef } from "react";

type MediaFile = {
  name: string;
  size: number;
  type: string;
  created_at: string;
  url: string;
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/media");
    const data = await res.json();
    setFiles(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const uploads = Array.from(fileList).map(async (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return fetch("/api/upload", { method: "POST", body: fd });
    });
    await Promise.all(uploads);
    setUploading(false);
    load();
  }

  async function handleDelete(name: string) {
    if (!confirm("Supprimer ce fichier définitivement ?")) return;
    setDeleting(name);
    await fetch(`/api/media?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    setDeleting(null);
    if (selected === name) setSelected(null);
    load();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const selectedFile = files.find((f) => f.name === selected);
  const totalSize = files.reduce((s, f) => s + (f.size ?? 0), 0);

  return (
    <div className="flex gap-6 h-full">
      {/* Main panel */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black">Médiathèque</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{files.length} fichier{files.length !== 1 ? "s" : ""} · {formatBytes(totalSize)}</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Upload…</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>Uploader</>
            )}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleUpload(e.target.files)} />

        {/* Drop zone + search */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-2xl p-4 mb-5 transition-colors ${dragOver ? "border-black bg-neutral-50" : "border-neutral-200"}`}
        >
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300 flex-shrink-0">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
            </svg>
            <p className="text-sm text-neutral-400">{dragOver ? "Relâchez pour uploader…" : "Glissez des images ici pour les uploader"}</p>
            <div className="flex-1 min-w-0">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom…"
                className="w-full border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-60"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 py-16 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-neutral-200 mb-3"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <p className="text-neutral-400 text-sm">{search ? "Aucun résultat pour cette recherche." : "Aucun fichier uploadé."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((f) => (
              <button key={f.name} onClick={() => setSelected(f.name === selected ? null : f.name)}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${selected === f.name ? "border-black" : "border-neutral-100 hover:border-neutral-300"}`}>
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {deleting === f.name && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[9px] truncate">{f.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar — file details */}
      {selectedFile && (
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden sticky top-4">
            <img src={selectedFile.url} alt={selectedFile.name} className="w-full aspect-square object-cover" />
            <div className="p-5 space-y-3">
              <p className="font-bold text-sm break-all">{selectedFile.name}</p>
              <div className="text-xs text-neutral-500 space-y-1">
                <div className="flex justify-between"><span>Taille</span><span className="font-medium text-neutral-700">{formatBytes(selectedFile.size)}</span></div>
                <div className="flex justify-between"><span>Type</span><span className="font-medium text-neutral-700">{selectedFile.type}</span></div>
                <div className="flex justify-between"><span>Ajouté</span><span className="font-medium text-neutral-700">{selectedFile.created_at ? new Date(selectedFile.created_at).toLocaleDateString("fr-FR") : "—"}</span></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">URL</p>
                <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-neutral-500 font-mono flex-1 truncate">{selectedFile.url}</p>
                  <button onClick={() => copyUrl(selectedFile.url)} className="flex-shrink-0 p-1 text-neutral-400 hover:text-black transition-colors">
                    {copied ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <a href={selectedFile.url} target="_blank" rel="noopener" className="block w-full text-center text-sm font-bold py-2.5 border border-neutral-200 rounded-xl hover:border-black transition-colors">
                Ouvrir dans l'onglet
              </a>
              <button onClick={() => handleDelete(selectedFile.name)}
                className="block w-full text-center text-sm font-bold py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
