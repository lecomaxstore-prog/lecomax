"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { EcomediaPost, EcomediaComment, PostType } from "@/lib/ecomedia";
import { POST_TYPE_LABELS, POST_TYPE_COLORS, formatRelativeTime } from "@/lib/ecomedia";

type Tab = "posts" | "new" | "comments";

const EMPTY_FORM = {
  title: "", content: "", type: "text" as PostType,
  media_url: "", thumbnail_url: "", video_url: "",
  product_url: "", cta_text: "",
  is_published: false, is_featured: false, slug: "",
};

export default function EcomediaManagerPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<EcomediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);

  // Comments management
  const [comments, setComments] = useState<EcomediaComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentPostFilter, setCommentPostFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ecomedia/posts?limit=100");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const url = commentPostFilter !== "all" ? `/api/admin/ecomedia/comments?postId=${commentPostFilter}` : "/api/admin/ecomedia/comments";
      const res = await fetch(url);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setCommentsLoading(false); }
  }, [commentPostFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "comments") loadComments(); }, [tab, loadComments]);

  function startEdit(post: EcomediaPost) {
    setEditId(post.id);
    setForm({
      title: post.title, content: post.content ?? "", type: post.type,
      media_url: post.media_url ?? "", thumbnail_url: post.thumbnail_url ?? "",
      video_url: post.video_url ?? "", product_url: post.product_url ?? "",
      cta_text: post.cta_text ?? "",
      is_published: post.is_published, is_featured: post.is_featured,
      slug: post.slug,
    });
    setImages(post.images ?? (post.media_url ? [post.media_url] : []));
    setTab("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setImages([]);
    setMsg(null);
  }

  async function uploadFile(file: File, idx?: number) {
    if (images.length >= 5 && idx === undefined) { setMsg({ type: "err", text: "Maximum 5 images" }); return; }
    setUploading(true);
    if (idx !== undefined) setUploadingIdx(idx);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/ecomedia/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        if (idx !== undefined) {
          setImages(prev => { const next = [...prev]; next[idx] = data.url; return next; });
        } else {
          setImages(prev => [...prev, data.url]);
        }
        setForm(f => ({ ...f, media_url: data.url }));
        setMsg({ type: "ok", text: "Image uploadée ✓" });
      } else {
        setMsg({ type: "err", text: data.error ?? "Erreur upload" });
      }
    } catch { setMsg({ type: "err", text: "Erreur réseau" }); }
    finally { setUploading(false); setUploadingIdx(null); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setMsg({ type: "err", text: "Le titre est requis" }); return; }
    setSaving(true); setMsg(null);
    try {
      const body = { ...form, media_url: images[0] ?? form.media_url, images: images.length > 0 ? images : undefined };
      const url = editId ? `/api/admin/ecomedia/posts/${editId}` : "/api/admin/ecomedia/posts";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setMsg({ type: "ok", text: editId ? "Post mis à jour ✓" : "Post créé ✓" });
      await load();
      setTimeout(() => { resetForm(); setTab("posts"); }, 1200);
    } catch { setMsg({ type: "err", text: "Erreur réseau" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce post et tous ses commentaires/likes ?")) return;
    setDeleting(id);
    await fetch(`/api/admin/ecomedia/posts/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  async function togglePublish(post: EcomediaPost) {
    await fetch(`/api/admin/ecomedia/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !post.is_published }),
    });
    load();
  }

  async function deleteComment(id: string) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    await fetch(`/api/admin/ecomedia/comments/${id}`, { method: "DELETE" });
    loadComments();
  }

  async function toggleCommentApproval(comment: EcomediaComment) {
    await fetch(`/api/admin/ecomedia/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: !comment.is_approved }),
    });
    loadComments();
  }

  // ── AI Assistant ──────────────────────────────────────────────────────────
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  async function generateWithAI() {
    if (!aiTopic.trim()) { setAiMsg("Décrivez le sujet du post pour que l'IA génère le contenu."); return; }
    setAiLoading(true); setAiMsg(null);
    try {
      const res = await fetch("/api/admin/ecomedia/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim(), type: form.type }),
      });
      const data = await res.json();
      if (!res.ok) { setAiMsg(data.error ?? "Erreur IA"); return; }
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        content: data.content || f.content,
        cta_text: data.cta_text || f.cta_text,
        type: data.type_suggestion || f.type,
      }));
      setAiMsg("✓ Contenu généré ! Vérifiez et modifiez si nécessaire.");
    } catch { setAiMsg("Erreur réseau. Vérifiez la clé GROQ_API_KEY."); }
    finally { setAiLoading(false); }
  }

  const publishedCount = posts.filter(p => p.is_published).length;
  const totalLikes = posts.reduce((s, p) => s + p.likes_count, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments_count, 0);

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black">Ecomedia Manager</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Gérez votre contenu social — posts, vidéos, offres et interactions</p>
        </div>
        <button
          onClick={() => { resetForm(); setTab("new"); }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau post
        </button>
        {/* Live preview link */}
        <a href="/ecomedia" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 border border-neutral-200 text-neutral-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:border-neutral-400 hover:text-black transition-colors active:scale-95">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Voir Ecomedia
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Posts total", val: posts.length, icon: "📱" },
          { label: "Publiés", val: publishedCount, icon: "✅" },
          { label: "Likes total", val: totalLikes, icon: "❤️" },
          { label: "Commentaires", val: totalComments, icon: "💬" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-neutral-100 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black">{s.val}</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
        {([["posts", "Posts"], ["new", editId ? "Modifier" : "Nouveau post"], ["comments", "Commentaires"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── POSTS LIST ── */}
      {tab === "posts" && (
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-400">Chargement…</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📱</div>
              <p className="font-bold text-neutral-700">Aucun post</p>
              <p className="text-sm text-neutral-400 mt-1">Créez votre premier post Ecomedia</p>
              <button onClick={() => setTab("new")} className="mt-4 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl">Créer un post</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {["Post", "Type", "Statut", "❤️ Likes", "💬 Comm.", "Date", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {posts.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.media_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.media_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate max-w-[200px]">{p.title}</p>
                            {p.is_featured && <span className="text-[10px] text-amber-600 font-bold">📌 Épinglé</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${POST_TYPE_COLORS[p.type]}`}>{POST_TYPE_LABELS[p.type]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => togglePublish(p)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors ${p.is_published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>
                          {p.is_published ? "Publié" : "Brouillon"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{p.likes_count}</td>
                      <td className="px-4 py-3 text-center font-semibold">{p.comments_count}</td>
                      <td className="px-4 py-3 text-[11px] text-neutral-400">{formatRelativeTime(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(p)}
                            className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors" title="Modifier">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <a href={`/ecomedia/${p.slug}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors" title="Voir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                          <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                            className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE/EDIT FORM ── */}
      {tab === "new" && (
        <form onSubmit={handleSave} className="space-y-4">
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            {/* Left */}
            <div className="space-y-4">

              {/* ── AI Assistant panel ── */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-violet-900">Assistant IA — Génération de contenu</p>
                    <p className="text-[11px] text-violet-600">Décrivez votre idée, l&apos;IA génère titre + description + CTA</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), generateWithAI())}
                    placeholder="Ex: Promo Nike -30%, nouvelle collection été, soldes chaussures…"
                    className="flex-1 border border-violet-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={generateWithAI}
                    disabled={aiLoading || !aiTopic.trim()}
                    className="flex items-center gap-2 bg-violet-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap active:scale-95"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : "✨ Générer"}
                  </button>
                </div>
                {aiMsg && (
                  <p className={`mt-2.5 text-[12px] font-semibold px-3 py-2 rounded-lg ${aiMsg.startsWith("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                    {aiMsg}
                  </p>
                )}
              </div>

              {/* Post type */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Type de post</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(POST_TYPE_LABELS) as PostType[]).map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`py-2 px-3 rounded-xl text-[11px] font-bold border-2 transition-all ${form.type === t ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}>
                      {POST_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Contenu</h3>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Titre *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Titre du post…"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={4} placeholder="Décrivez votre post…"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all resize-none" />
                </div>
              </div>

              {/* Media */}
              {(form.type !== "text") && (
                <div className="bg-white border border-neutral-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Média</h3>
                  {/* Multi-image Upload — max 5 */}
                  {["image", "video_upload", "product", "promotion"].includes(form.type) && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                          {form.type === "video_upload" ? "Vidéo (MP4)" : "Images (max 5)"}
                        </label>
                        <span className="text-[11px] text-neutral-400 font-semibold">{images.length}/5</span>
                      </div>

                      {/* Images grid */}
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {/* Uploaded images */}
                        {images.map((url, i) => (
                          <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            {i === 0 && (
                              <div className="absolute top-1 left-1 bg-black/70 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                                Principal
                              </div>
                            )}
                            {uploadingIdx === i && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </div>
                        ))}

                        {/* Add slot — show if < 5 images */}
                        {images.length < 5 && (
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => { if (!uploading) fileRef.current?.click(); }}
                            className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 hover:border-[#3ecf4c] hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                            {uploading && uploadingIdx === null ? (
                              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400"><path d="M12 5v14M5 12h14"/></svg>
                                <span className="text-[9px] text-neutral-400 font-bold">Ajouter</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <input
                        ref={fileRef}
                        type="file"
                        accept={form.type === "video_upload" ? "video/*" : "image/*"}
                        multiple
                        className="hidden"
                        onChange={e => {
                          const files = Array.from(e.target.files ?? []);
                          const remaining = 5 - images.length;
                          files.slice(0, remaining).forEach(file => uploadFile(file));
                          e.target.value = "";
                        }}
                      />

                      <p className="text-[10px] text-neutral-400">
                        {images.length === 0 ? "Cliquez sur + pour ajouter jusqu'à 5 images" : "La 1ère image est l'image principale du post"}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Ou collez une URL ci-dessous</p>
                    </div>
                  )}
                  {/* URL Field */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                      {form.type === "video_url" ? "URL de la vidéo (YouTube / TikTok / Direct)" : "URL du média (optionnel)"}
                    </label>
                    {form.type === "video_url" ? (
                      <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
                    ) : (
                      <div className="flex gap-2">
                        <input value={form.media_url} onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))}
                          placeholder="https://… (coller URL puis Entrée pour ajouter)"
                          className="flex-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all"
                          onKeyDown={e => {
                            if (e.key === "Enter" && form.media_url.trim() && images.length < 5) {
                              e.preventDefault();
                              setImages(prev => [...prev, form.media_url.trim()]);
                              setForm(f => ({ ...f, media_url: "" }));
                            }
                          }}
                        />
                        {form.media_url.trim() && images.length < 5 && (
                          <button type="button"
                            onClick={() => { setImages(prev => [...prev, form.media_url.trim()]); setForm(f => ({ ...f, media_url: "" })); }}
                            className="px-3 py-2 bg-[#3ecf4c] text-black text-xs font-black rounded-xl hover:bg-[#34b841] transition-colors whitespace-nowrap">
                            Ajouter
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product CTA */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lien produit (optionnel)</h3>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">URL du produit</label>
                  <input value={form.product_url} onChange={e => setForm(f => ({ ...f, product_url: e.target.value }))}
                    placeholder="https://lecomax.com/produit/..."
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Texte du bouton CTA</label>
                  <input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))}
                    placeholder="Acheter maintenant, Voir le produit…"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
                </div>
              </div>
            </div>

            {/* Right: publish settings */}
            <div className="space-y-4">
              {/* Status */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Publication</h3>
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <p className="text-sm font-semibold">Publié</p>
                    <p className="text-[11px] text-neutral-400">Visible sur /ecomedia</p>
                  </div>
                  <div
                    onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center cursor-pointer ${form.is_published ? "bg-black" : "bg-neutral-200"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.is_published ? "translate-x-4" : ""}`} />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1">📌 Épinglé</p>
                    <p className="text-[11px] text-neutral-400">Affiché en premier</p>
                  </div>
                  <div
                    onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center cursor-pointer ${form.is_featured ? "bg-black" : "bg-neutral-200"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.is_featured ? "translate-x-4" : ""}`} />
                  </div>
                </label>
                {editId && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Slug URL</label>
                    <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black bg-neutral-50 transition-all" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <button type="submit" disabled={saving}
                className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : (editId ? "Mettre à jour →" : "Créer le post →")}
              </button>
              <button type="button" onClick={() => { resetForm(); setTab("posts"); }}
                className="w-full py-2.5 text-sm text-neutral-500 hover:text-black transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── COMMENTS ── */}
      {tab === "comments" && (
        <div className="space-y-4">
          {/* Filter by post */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={commentPostFilter}
              onChange={e => { setCommentPostFilter(e.target.value); }}
              className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
            >
              <option value="all">Tous les posts</option>
              {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <button onClick={loadComments} className="px-3 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:border-neutral-400 transition-colors">
              Actualiser
            </button>
          </div>

          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
            {commentsLoading ? (
              <div className="p-8 text-center text-sm text-neutral-400">Chargement…</div>
            ) : comments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="font-bold text-neutral-700">Aucun commentaire</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {comments.map(c => (
                  <div key={c.id} className="flex items-start gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-sm font-bold text-neutral-600">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold">{c.name}</span>
                        {c.email && <span className="text-xs text-neutral-400">{c.email}</span>}
                        <span className="text-[10px] text-neutral-400">{formatRelativeTime(c.created_at)}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto ${c.is_approved ? "bg-green-100 text-green-600" : "bg-neutral-100 text-neutral-400"}`}>
                          {c.is_approved ? "Approuvé" : "Masqué"}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 mt-1 break-words">{c.content}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleCommentApproval(c)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${c.is_approved ? "text-neutral-400 hover:text-amber-500 hover:bg-amber-50" : "text-neutral-400 hover:text-green-500 hover:bg-green-50"}`}
                        title={c.is_approved ? "Masquer" : "Approuver"}>
                        {c.is_approved ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                      <button onClick={() => deleteComment(c.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
