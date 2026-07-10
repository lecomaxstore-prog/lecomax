"use client";
import { useState, useEffect, useRef } from "react";
import type { EcomediaPost, EcomediaComment } from "@/lib/ecomedia";
import { formatRelativeTime } from "@/lib/ecomedia";

interface Props {
  post: EcomediaPost;
  onClose: () => void;
  onCommentAdded: () => void;
  user?: { id: string; email?: string; name?: string } | null;
}

export default function CommentDrawer({ post, onClose, onCommentAdded, user }: Props) {
  const [comments, setComments] = useState<EcomediaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/ecomedia/comments?postId=${post.id}`)
      .then(r => r.json())
      .then(d => { setComments(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [post.id]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || name.trim().length < 2) { setError("Prénom trop court (min 2 caractères)"); return; }
    if (!content.trim() || content.trim().length < 2) { setError("Commentaire trop court"); return; }
    if (content.trim().length > 500) { setError("Commentaire trop long (max 500 caractères)"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ecomedia/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, name: name.trim(), email: email.trim() || undefined, content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur lors de l'envoi"); return; }
      setComments(prev => [data, ...prev]);
      setName(""); setEmail(""); setContent("");
      setSuccess(true);
      onCommentAdded();
      setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Erreur réseau"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative mt-auto bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
          <div>
            <p className="font-bold text-sm text-black">Commentaires</p>
            <p className="text-[11px] text-neutral-400 truncate max-w-[240px]">{post.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-neutral-200 border-t-black rounded-full animate-spin" />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="text-center py-8 text-neutral-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <p className="text-sm">Soyez le premier à commenter !</p>
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-xs font-bold text-neutral-600">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-black">{c.name}</span>
                  <span className="text-[10px] text-neutral-400">{formatRelativeTime(c.created_at)}</span>
                </div>
                <p className="text-xs text-neutral-700 mt-0.5 leading-relaxed break-words">{c.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment form */}
        <form onSubmit={handleSubmit} className="border-t border-neutral-100 px-4 py-3 shrink-0 space-y-2">
          {/* Logged in indicator */}
          {user && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-[10px] font-black text-[#3ecf4c] shrink-0">
                {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
              </div>
              <p className="text-[11px] text-green-700 font-semibold flex-1 truncate">
                Connecté en tant que <span className="font-black">{user.name ?? user.email}</span>
              </p>
            </div>
          )}
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl">✓ Commentaire ajouté !</p>}
          {/* Only show name/email fields for guests */}
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Votre prénom *" required maxLength={50}
                className="border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optionnel)" maxLength={100}
                className="border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={contentRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Écrivez votre commentaire…"
              required
              maxLength={500}
              rows={2}
              className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all resize-none"
            />
            <button
              type="submit"
              disabled={submitting || !content.trim() || !name.trim()}
              className="self-end px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-40 transition-all active:scale-95 shrink-0"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Envoyer"}
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 text-right">{content.length}/500</p>
        </form>
      </div>
    </div>
  );
}
