"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  badge: string | null;
  button_label: string | null;
  button_href: string | null;
  button2_label: string | null;
  button2_href: string | null;
  image_desktop: string | null;
  image_mobile: string | null;
  overlay_opacity: number;
  sort_order: number;
  active: boolean;
  created_at: string;
};

const emptyForm = {
  title: "", subtitle: "", badge: "",
  button_label: "Découvrir", button_href: "/boutique",
  button2_label: "", button2_href: "",
  image_desktop: "", image_mobile: "",
  overlay_opacity: "50", sort_order: "0", active: true,
};

export default function BannersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [dragOverDesktop, setDragOverDesktop] = useState(false);
  const [dragOverMobile, setDragOverMobile] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/banners");
    const data = await res.json();
    setBanners(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const b = banners.find((x) => x.id === editId);
      if (b) setForm({
        title: b.title ?? "", subtitle: b.subtitle ?? "", badge: b.badge ?? "",
        button_label: b.button_label ?? "", button_href: b.button_href ?? "",
        button2_label: b.button2_label ?? "", button2_href: b.button2_href ?? "",
        image_desktop: b.image_desktop ?? "", image_mobile: b.image_mobile ?? "",
        overlay_opacity: String(b.overlay_opacity), sort_order: String(b.sort_order), active: b.active,
      });
    } else if (isNew) {
      setForm({ ...emptyForm });
    }
  }, [editId, isNew, banners]);

  async function uploadImage(file: File, field: "image_desktop" | "image_mobile") {
    const setUploading = field === "image_desktop" ? setUploadingDesktop : setUploadingMobile;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setForm((f) => ({ ...f, [field]: data.url }));
    else setMsg({ type: "err", text: data.error ?? "Échec upload" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      badge: form.badge.trim() || null,
      button_label: form.button_label.trim() || null,
      button_href: form.button_href.trim() || null,
      button2_label: form.button2_label.trim() || null,
      button2_href: form.button2_href.trim() || null,
      image_desktop: form.image_desktop.trim() || null,
      image_mobile: form.image_mobile.trim() || null,
      overlay_opacity: parseInt(form.overlay_opacity) || 50,
      sort_order: parseInt(form.sort_order) || 0,
      active: form.active,
    };
    const url = editId ? `/api/banners/${editId}` : "/api/banners";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur" });
    else { setMsg({ type: "ok", text: "Bannière enregistrée ✓" }); load(); setTimeout(() => router.replace("/admin/banners"), 1000); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette bannière ?")) return;
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(b: Banner) {
    await fetch(`/api/banners/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...b, active: !b.active }),
    });
    load();
  }

  const showForm = isNew || !!editId;

  const ImageUploader = ({ field, label, uploading, dragOver, setDragOver, inputRef, aspect }: {
    field: "image_desktop" | "image_mobile"; label: string; uploading: boolean;
    dragOver: boolean; setDragOver: (v: boolean) => void; inputRef: React.RefObject<HTMLInputElement | null>; aspect: string;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadImage(f, field); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${dragOver ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"}`}
      >
        {form[field] ? (
          <div className="relative">
            <img src={form[field]} alt="preview" className={`w-full object-cover ${aspect}`} />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-sm font-bold">Cliquer pour remplacer</p>
            </div>
          </div>
        ) : uploading ? (
          <div className={`flex flex-col items-center justify-center gap-2 ${aspect}`}>
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-neutral-500">Upload…</p>
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center gap-2 ${aspect}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300">
              <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
            <p className="text-sm font-medium text-neutral-500">Glissez ou <span className="text-black underline">choisissez</span></p>
            <p className="text-xs text-neutral-400">JPG, PNG, WEBP · max 5 MB</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, field); }} />
      {/* URL fallback */}
      <input type="text" value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        placeholder="Ou coller une URL directement…"
        className="w-full mt-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-black text-neutral-500" />
    </div>
  );

  if (showForm) return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.replace("/admin/banners")} className="p-2 hover:bg-neutral-100 rounded-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 className="text-xl font-black">{editId ? "Modifier la bannière" : "Nouvelle bannière hero"}</h1>
      </div>
      <form onSubmit={handleSave} className="space-y-5">
        {/* Images */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Images</h2>
          <ImageUploader field="image_desktop" label="Image Desktop (recommandé : 1920×800px)" uploading={uploadingDesktop} dragOver={dragOverDesktop} setDragOver={setDragOverDesktop} inputRef={desktopInputRef} aspect="aspect-[16/5]" />
          <ImageUploader field="image_mobile" label="Image Mobile (recommandé : 750×900px)" uploading={uploadingMobile} dragOver={dragOverMobile} setDragOver={setDragOverMobile} inputRef={mobileInputRef} aspect="aspect-[4/5]" />
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Opacité de l'overlay sombre ({form.overlay_opacity}%)</label>
            <input type="range" min="0" max="100" value={form.overlay_opacity} onChange={(e) => setForm((f) => ({ ...f, overlay_opacity: e.target.value }))} className="w-full accent-black" />
          </div>
        </div>

        {/* Text content */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Texte & Boutons</h2>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Badge (texte petit en haut)</label>
            <input type="text" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
              placeholder="ex: Boutique en ligne · Maroc"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Titre principal</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="ex: Sport. Tech. Style."
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Sous-titre</label>
            <textarea value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              rows={2} placeholder="ex: Livraison 35 MAD · Retours gratuits 30 j"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Bouton 1 — Texte</label>
              <input type="text" value={form.button_label} onChange={(e) => setForm((f) => ({ ...f, button_label: e.target.value }))}
                placeholder="Découvrir la collection"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Bouton 1 — Lien</label>
              <input type="text" value={form.button_href} onChange={(e) => setForm((f) => ({ ...f, button_href: e.target.value }))}
                placeholder="/boutique"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Bouton 2 — Texte (optionnel)</label>
              <input type="text" value={form.button2_label} onChange={(e) => setForm((f) => ({ ...f, button2_label: e.target.value }))}
                placeholder="Voir les promos"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Bouton 2 — Lien</label>
              <input type="text" value={form.button2_href} onChange={(e) => setForm((f) => ({ ...f, button2_href: e.target.value }))}
                placeholder="/promotions"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Paramètres</h2>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Ordre d'affichage</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none pb-1">
              <div onClick={() => setForm((f) => ({ ...f, active: !f.active }))} className={`w-10 h-6 rounded-full transition-colors ${form.active ? "bg-black" : "bg-neutral-200"} relative`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <span className="text-sm font-medium">Bannière active</span>
            </label>
          </div>
        </div>

        {msg && <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer"}
          </button>
          <button type="button" onClick={() => router.replace("/admin/banners")} className="px-6 py-3 border border-neutral-200 rounded-xl text-sm font-medium hover:border-black transition-colors">Annuler</button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Bannières Hero</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Gérez les slides de la bannière principale de votre boutique</p>
        </div>
        <button onClick={() => router.replace("/admin/banners?new=1")} className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle bannière
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 px-6 py-16 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-neutral-200 mb-3"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <p className="text-neutral-400 text-sm font-medium">Aucune bannière créée.</p>
          <p className="text-neutral-300 text-xs mt-1">Créez votre première bannière hero.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              {b.image_desktop && (
                <div className="relative">
                  <img src={b.image_desktop} alt={b.title ?? ""} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${b.overlay_opacity / 100})` }} />
                  {b.title && <p className="absolute bottom-3 left-4 text-white font-black text-lg drop-shadow">{b.title}</p>}
                </div>
              )}
              <div className="flex items-center gap-4 px-5 py-4">
                {!b.image_desktop && (
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{b.title ?? <span className="text-neutral-400 italic">Sans titre</span>}</p>
                  <p className="text-xs text-neutral-400 truncate">{b.subtitle}</p>
                  {(b.button_label || b.button_href) && <p className="text-xs text-neutral-400 mt-0.5">→ {b.button_href}</p>}
                </div>
                <span className="text-xs font-semibold text-neutral-400">#{b.sort_order}</span>
                <button onClick={() => toggleActive(b)} className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer transition-colors ${b.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>{b.active ? "Active" : "Inactive"}</button>
                <button onClick={() => router.replace(`/admin/banners?id=${b.id}`)} className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
