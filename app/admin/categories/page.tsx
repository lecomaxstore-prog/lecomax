"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Category } from "@/lib/supabase";

const emptyForm = { slug: "", label: "", image: "", description: "", active: true, sort_order: "0" };

export default function CategoriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const c = categories.find((x) => x.id === editId);
      if (c) setForm({ slug: c.slug, label: c.label, image: c.image ?? "", description: c.description ?? "", active: c.active, sort_order: String(c.sort_order) });
    } else if (isNew) {
      setForm({ ...emptyForm });
    }
  }, [editId, isNew, categories]);

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setForm((f) => ({ ...f, image: data.url }));
    else setMsg({ type: "err", text: data.error ?? "Échec upload" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = { slug: form.slug.trim(), label: form.label.trim(), image: form.image.trim() || null, description: form.description.trim() || null, active: form.active, sort_order: parseInt(form.sort_order) || 0 };
    const url = editId ? `/api/categories/${editId}` : "/api/categories";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
    else { setMsg({ type: "ok", text: "Catégorie enregistrée ✓" }); load(); setTimeout(() => router.replace("/admin/categories"), 1000); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  const showForm = isNew || !!editId;

  if (showForm) return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.replace("/admin/categories")} className="p-2 hover:bg-neutral-100 rounded-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></button>
        <h1 className="text-xl font-black">{editId ? "Modifier la catégorie" : "Nouvelle catégorie"}</h1>
      </div>
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom *" value={form.label} onChange={(v) => setForm({ ...form, label: v })} required />
          <Field label="Slug *" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="ex: homme" required />
        </div>
        <Field label="URL Image (ou uploader ci-dessous)" value={form.image} onChange={(v) => setForm({ ...form, image: v })} placeholder="https://..." />
        {/* Image uploader */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Photo de la catégorie</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageUpload(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${dragOver ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"}`}
          >
            {form.image ? (
              <div className="flex items-center gap-4">
                <img src={form.image} alt="preview" className="w-20 h-20 object-cover rounded-xl bg-neutral-100 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-700 truncate">{form.image.split("/").pop()}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Cliquez ou glissez pour remplacer</p>
                </div>
              </div>
            ) : uploading ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-500">Upload en cours…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300">
                  <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                </svg>
                <p className="text-sm font-medium text-neutral-500">Glissez une image ou <span className="text-black underline">cliquez pour choisir</span></p>
                <p className="text-xs text-neutral-400">JPG, PNG, WEBP · max 5 MB</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-none" />
        </div>
        <Field label="Ordre d'affichage" type="number" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div onClick={() => setForm({ ...form, active: !form.active })} className={`w-10 h-6 rounded-full transition-colors ${form.active ? "bg-black" : "bg-neutral-200"} relative`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <span className="text-sm font-medium">Catégorie active</span>
        </label>
        {msg && <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer"}
          </button>
          <button type="button" onClick={() => router.replace("/admin/categories")} className="px-6 py-3 border border-neutral-200 rounded-xl text-sm font-medium hover:border-black transition-colors">Annuler</button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">Catégories</h1>
        <button onClick={() => router.replace("/admin/categories?new=1")} className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter
        </button>
      </div>
      {loading ? <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="grid gap-3">
          {categories.length === 0 ? <div className="bg-white rounded-2xl border border-neutral-100 px-6 py-16 text-center text-neutral-400 text-sm">Aucune catégorie.</div> :
            categories.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-neutral-100 flex items-center gap-4 px-5 py-4">
                {c.image && <img src={c.image} alt={c.label} className="w-12 h-12 object-cover rounded-xl bg-neutral-100 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{c.label}</p>
                  <p className="text-xs text-neutral-400">{c.slug}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>{c.active ? "Active" : "Inactive"}</span>
                <div className="flex gap-1">
                  <button onClick={() => router.replace(`/admin/categories?id=${c.id}`)} className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
    </div>
  );
}
