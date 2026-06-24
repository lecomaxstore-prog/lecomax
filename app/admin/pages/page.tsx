"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Page = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  title: "", slug: "", content: "",
  meta_title: "", meta_description: "",
  active: true, sort_order: "0",
};

function slugify(str: string) {
  return str.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function PagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pages");
    const data = await res.json();
    setPages(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const p = pages.find((x) => x.id === editId);
      if (p) {
        setAutoSlug(false);
        setForm({
          title: p.title, slug: p.slug, content: p.content ?? "",
          meta_title: p.meta_title ?? "", meta_description: p.meta_description ?? "",
          active: p.active, sort_order: String(p.sort_order),
        });
      }
    } else if (isNew) {
      setAutoSlug(true);
      setForm({ ...emptyForm });
    }
  }, [editId, isNew, pages]);

  function handleTitleChange(v: string) {
    setForm((f) => ({ ...f, title: v, slug: autoSlug ? slugify(v) : f.slug }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      content: form.content.trim() || null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      active: form.active,
      sort_order: parseInt(form.sort_order) || 0,
    };
    const url = editId ? `/api/pages/${editId}` : "/api/pages";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
    else { setMsg({ type: "ok", text: "Page enregistrée ✓" }); load(); setTimeout(() => router.replace("/admin/pages"), 1000); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette page ?")) return;
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(page: Page) {
    await fetch(`/api/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...page, active: !page.active }),
    });
    load();
  }

  const showForm = isNew || !!editId;

  if (showForm) return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.replace("/admin/pages")} className="p-2 hover:bg-neutral-100 rounded-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 className="text-xl font-black">{editId ? "Modifier la page" : "Nouvelle page"}</h1>
      </div>
      <form onSubmit={handleSave} className="space-y-5">
        {/* Main info card */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Informations</h2>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Titre de la page *</label>
            <input
              type="text" value={form.title} required
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="ex: À propos de nous"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Slug (URL) *</label>
            <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-4 py-3 focus-within:border-black">
              <span className="text-neutral-400 text-sm select-none">/</span>
              <input
                type="text" value={form.slug} required
                onChange={(e) => { setAutoSlug(false); setForm((f) => ({ ...f, slug: e.target.value })); }}
                placeholder="a-propos"
                className="flex-1 text-sm focus:outline-none"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              URL de la page : <span className="font-mono text-neutral-600">lecomax.com/{form.slug || "..."}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Ordre d'affichage</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setForm((f) => ({ ...f, active: !f.active }))} className={`w-10 h-6 rounded-full transition-colors ${form.active ? "bg-black" : "bg-neutral-200"} relative`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <span className="text-sm font-medium">Page active (visible)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Contenu</h2>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Contenu (HTML ou texte)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={12}
              placeholder="<h2>Titre</h2><p>Votre texte ici...</p>"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-y font-mono"
            />
            <p className="text-xs text-neutral-400 mt-1">HTML accepté. Les balises &lt;h1&gt;–&lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;a&gt;, &lt;img&gt;, &lt;strong&gt; sont supportées.</p>
          </div>
        </div>

        {/* SEO card */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">SEO & Méta</h2>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Meta titre</label>
            <input type="text" value={form.meta_title}
              onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
              placeholder={form.title || "Titre de la page"}
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
            <p className={`text-xs mt-1 ${form.meta_title.length > 60 ? "text-amber-600" : "text-neutral-400"}`}>{form.meta_title.length}/60 caractères recommandés</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Meta description</label>
            <textarea value={form.meta_description}
              onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
              rows={2} placeholder="Courte description pour les moteurs de recherche…"
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
            />
            <p className={`text-xs mt-1 ${form.meta_description.length > 160 ? "text-amber-600" : "text-neutral-400"}`}>{form.meta_description.length}/160 caractères recommandés</p>
          </div>
        </div>

        {msg && <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer la page"}
          </button>
          <button type="button" onClick={() => router.replace("/admin/pages")} className="px-6 py-3 border border-neutral-200 rounded-xl text-sm font-medium hover:border-black transition-colors">Annuler</button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Pages du site</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Créez et gérez les pages statiques de votre boutique</p>
        </div>
        <button onClick={() => router.replace("/admin/pages?new=1")} className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle page
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-sm text-blue-700">Les pages créées ici sont accessibles à l'adresse <span className="font-mono font-semibold">lecomax.com/[slug]</span>. Exemple : une page avec le slug <span className="font-mono font-semibold">a-propos</span> sera sur <span className="font-mono font-semibold">lecomax.com/a-propos</span>.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 px-6 py-16 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-neutral-200 mb-3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <p className="text-neutral-400 text-sm font-medium">Aucune page créée.</p>
          <p className="text-neutral-300 text-xs mt-1">Créez votre première page statique.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pages.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-neutral-100 flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{p.title}</p>
                <p className="text-xs text-neutral-400 font-mono">/{p.slug}</p>
              </div>
              <button
                onClick={() => toggleActive(p)}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer transition-colors ${p.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}
              >{p.active ? "Active" : "Inactive"}</button>
              <a href={`/${p.slug}`} target="_blank" rel="noopener" className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg" title="Voir la page">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <button onClick={() => router.replace(`/admin/pages?id=${p.id}`)} className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
