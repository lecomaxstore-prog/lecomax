"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EcomediaComment, EcomediaPost } from "@/lib/ecomedia";
import { formatRelativeTime } from "@/lib/ecomedia";
import { supabase } from "@/lib/supabase";

interface Props {
  post: EcomediaPost;
  onClose: () => void;
  onCommentCountChange: (delta: number) => void;
  onRequireAuth: (action: "comment" | "reply") => void;
  user?: { id: string; email?: string; name?: string; avatar?: string } | null;
}

type CommentRowProps = {
  comment: EcomediaComment;
  replyTarget: EcomediaComment;
  compact?: boolean;
  menuId: string | null;
  editingId: string | null;
  deletingId: string | null;
  editContent: string;
  busyId: string | null;
  onMenu: (id: string | null) => void;
  onReply: (comment: EcomediaComment) => void;
  onStartEdit: (comment: EcomediaComment) => void;
  onEditContent: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (comment: EcomediaComment) => void;
  onConfirmDelete: (id: string | null) => void;
  onDelete: (comment: EcomediaComment) => void;
};

function CommentRow({
  comment,
  replyTarget,
  compact = false,
  menuId,
  editingId,
  deletingId,
  editContent,
  busyId,
  onMenu,
  onReply,
  onStartEdit,
  onEditContent,
  onCancelEdit,
  onSaveEdit,
  onConfirmDelete,
  onDelete,
}: CommentRowProps) {
  const isEditing = editingId === comment.id;
  const isDeleting = deletingId === comment.id;
  const isBusy = busyId === comment.id;
  const initial = comment.is_deleted ? "–" : (comment.name || "M").charAt(0).toUpperCase();

  return (
    <div className="flex gap-3" data-comment-id={comment.id}>
      <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black ${compact ? "h-8 w-8 text-[9px]" : "h-10 w-10 text-[11px]"} ${comment.is_owner ? "bg-black text-[#3ecf4c] ring-2 ring-[#3ecf4c]/20" : "bg-neutral-100 text-neutral-500"}`}>
        {!comment.is_deleted && comment.avatar_url ? <img src={comment.avatar_url} alt="" className="h-full w-full object-cover" /> : initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-h-6 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`truncate font-black text-neutral-950 ${compact ? "text-[11px]" : "text-xs"}`}>{comment.name}</span>
            {comment.is_owner && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-700">Vous</span>}
            <span className="text-[9px] text-neutral-400">{formatRelativeTime(comment.created_at)}</span>
            {comment.edited_at && <span className="text-[9px] italic text-neutral-400">Modifié</span>}
          </div>

          {comment.is_owner && !comment.is_deleted && !isEditing && (
            <div className="relative shrink-0" data-comment-menu>
              <button
                type="button"
                onClick={() => onMenu(menuId === comment.id ? null : comment.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                aria-label="Gérer mon commentaire"
                aria-expanded={menuId === comment.id}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
              </button>
              {menuId === comment.id && (
                <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
                  <button type="button" onClick={() => onStartEdit(comment)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-bold text-neutral-700 transition hover:bg-neutral-50">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                    Modifier
                  </button>
                  <button type="button" onClick={() => { onMenu(null); onConfirmDelete(comment.id); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-bold text-red-600 transition hover:bg-red-50">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 rounded-2xl border border-neutral-300 bg-white p-3 shadow-sm">
            <textarea
              autoFocus
              value={editContent}
              onChange={event => onEditContent(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Escape") onCancelEdit();
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) onSaveEdit(comment);
              }}
              maxLength={500}
              rows={3}
              className="w-full resize-none bg-transparent text-[13px] leading-5 text-neutral-800 outline-none"
              aria-label="Modifier le commentaire"
            />
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-neutral-100 pt-2">
              <span className="text-[9px] text-neutral-400">{editContent.length}/500 · Ctrl + Entrée pour enregistrer</span>
              <div className="flex gap-2">
                <button type="button" onClick={onCancelEdit} disabled={isBusy} className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-neutral-500 hover:bg-neutral-100 disabled:opacity-50">Annuler</button>
                <button type="button" onClick={() => onSaveEdit(comment)} disabled={isBusy || editContent.trim().length < 2} className="rounded-lg bg-black px-3 py-1.5 text-[10px] font-black text-white transition hover:bg-emerald-600 disabled:opacity-30">{isBusy ? "Enregistrement…" : "Enregistrer"}</button>
              </div>
            </div>
          </div>
        ) : (
          <p className={`mt-1 break-words leading-5 ${compact ? "text-xs" : "text-[13px]"} ${comment.is_deleted ? "italic text-neutral-400" : "text-neutral-700"}`}>{comment.content}</p>
        )}

        {isDeleting && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-[11px] font-black text-red-800">Supprimer ce commentaire ?</p>
            <p className="mt-1 text-[10px] leading-4 text-red-600">Cette action est définitive. Les réponses éventuelles resteront visibles.</p>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => onConfirmDelete(null)} disabled={isBusy} className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-neutral-600 hover:bg-white disabled:opacity-50">Annuler</button>
              <button type="button" onClick={() => onDelete(comment)} disabled={isBusy} className="rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-black text-white hover:bg-red-700 disabled:opacity-50">{isBusy ? "Suppression…" : "Supprimer"}</button>
            </div>
          </div>
        )}

        {!isEditing && !isDeleting && !comment.is_deleted && (
          <button type="button" onClick={() => onReply(replyTarget)} className="mt-2 rounded-md text-[10px] font-black text-neutral-400 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black">Répondre</button>
        )}
      </div>
    </div>
  );
}

export default function CommentDrawer({ post, onClose, onCommentCountChange, onRequireAuth, user }: Props) {
  const [comments, setComments] = useState<EcomediaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<EcomediaComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/ecomedia/comments?postId=${encodeURIComponent(post.id)}`, {
        cache: "no-store",
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Commentaires indisponibles.");
      setComments(Array.isArray(data) ? data : []);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Commentaires indisponibles.");
    } finally {
      setLoading(false);
    }
  }, [post.id]);

  useEffect(() => { void loadComments(); }, [loadComments, user?.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (editingId) setEditingId(null);
      else if (deletingId) setDeletingId(null);
      else onClose();
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [deletingId, editingId, onClose]);

  useEffect(() => {
    if (!menuId) return;
    function closeMenu(event: MouseEvent) {
      if (!(event.target as Element).closest("[data-comment-menu]")) setMenuId(null);
    }
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [menuId]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const roots = useMemo(() => comments.filter(comment => !comment.parent_id), [comments]);
  const repliesByParent = useMemo(() => comments.reduce<Record<string, EcomediaComment[]>>((result, comment) => {
    if (comment.parent_id) (result[comment.parent_id] ??= []).push(comment);
    return result;
  }, {}), [comments]);

  async function accessToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  function chooseReply(comment: EcomediaComment) {
    if (!user) { onRequireAuth("reply"); return; }
    setReplyingTo(comment);
    setError("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function startEdit(comment: EcomediaComment) {
    setMenuId(null);
    setDeletingId(null);
    setEditingId(comment.id);
    setEditContent(comment.content);
    setError("");
  }

  async function saveEdit(comment: EcomediaComment) {
    const message = editContent.trim();
    if (message.length < 2 || busyId) return;
    setBusyId(comment.id);
    setError("");
    try {
      const token = await accessToken();
      if (!token) { onRequireAuth("comment"); return; }
      const response = await fetch(`/api/ecomedia/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Modification impossible.");
      setComments(current => current.map(item => item.id === comment.id ? { ...item, ...data } : item));
      setEditingId(null);
      setEditContent("");
      setNotice("Commentaire modifié");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeComment(comment: EcomediaComment) {
    if (busyId) return;
    setBusyId(comment.id);
    setError("");
    try {
      const token = await accessToken();
      if (!token) { onRequireAuth("comment"); return; }
      const response = await fetch(`/api/ecomedia/comments/${comment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Suppression impossible.");
      if (data.hardDeleted) setComments(current => current.filter(item => item.id !== comment.id));
      else if (data.comment) setComments(current => current.map(item => item.id === comment.id ? data.comment : item));
      if (typeof data.countDelta === "number" && data.countDelta !== 0) onCommentCountChange(data.countDelta);
      setDeletingId(null);
      setReplyingTo(current => current?.id === comment.id ? null : current);
      setNotice("Commentaire supprimé");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Suppression impossible.");
    } finally {
      setBusyId(null);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { onRequireAuth(replyingTo ? "reply" : "comment"); return; }
    const message = content.trim();
    if (message.length < 2) { setError("Écrivez au moins 2 caractères."); return; }
    setSubmitting(true);
    setError("");
    try {
      const token = await accessToken();
      if (!token) { onRequireAuth(replyingTo ? "reply" : "comment"); return; }
      const response = await fetch("/api/ecomedia/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: post.id, content: message, parentId: replyingTo?.id ?? null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Envoi impossible.");
      setComments(current => [...current, data]);
      setContent("");
      setReplyingTo(null);
      onCommentCountChange(1);
      setNotice(replyingTo ? "Réponse publiée" : "Commentaire publié");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  const rowActions = {
    menuId,
    editingId,
    deletingId,
    editContent,
    busyId,
    onMenu: setMenuId,
    onReply: chooseReply,
    onStartEdit: startEdit,
    onEditContent: setEditContent,
    onCancelEdit: () => { setEditingId(null); setEditContent(""); },
    onSaveEdit: saveEdit,
    onConfirmDelete: setDeletingId,
    onDelete: removeComment,
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="comments-title">
      <button className="absolute inset-0 h-full w-full bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label="Fermer les commentaires" />
      <section className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-white shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-full sm:max-w-[540px] sm:rounded-none">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="comments-title" className="text-base font-black">Discussion</h2>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black text-neutral-500">{comments.length}</span>
              {!user && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-emerald-700">Lecture libre</span>}
            </div>
            <p className="mt-0.5 max-w-[330px] truncate text-[10px] text-neutral-400">{post.title}</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 transition hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black" aria-label="Fermer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="relative flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {notice && <div role="status" className="sticky top-0 z-10 mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-800 shadow-sm"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white">✓</span>{notice}</div>}
          {error && <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] leading-4 text-red-700"><span>{error}</span><button type="button" onClick={() => setError("")} className="font-black" aria-label="Fermer l’erreur">×</button></div>}

          {loading ? (
            <div className="space-y-6 py-2" aria-label="Chargement des commentaires">
              {[0, 1, 2].map(item => <div key={item} className="flex animate-pulse gap-3"><div className="h-10 w-10 rounded-full bg-neutral-100"/><div className="flex-1"><div className="h-3 w-28 rounded bg-neutral-100"/><div className="mt-3 h-3 w-full rounded bg-neutral-100"/><div className="mt-2 h-3 w-2/3 rounded bg-neutral-100"/></div></div>)}
            </div>
          ) : loadError ? (
            <div className="mx-auto flex max-w-xs flex-col items-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg></div>
              <p className="text-sm font-black">Discussion indisponible</p><p className="mt-1 text-xs leading-5 text-neutral-400">{loadError}</p>
              <button type="button" onClick={() => void loadComments()} className="mt-4 rounded-xl bg-black px-4 py-2.5 text-[10px] font-black text-white">Réessayer</button>
            </div>
          ) : roots.length === 0 ? (
            <div className="mx-auto flex max-w-xs flex-col items-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/></svg></div>
              <p className="text-sm font-black">Lancez la conversation</p><p className="mt-1 text-xs leading-5 text-neutral-400">Soyez le premier membre à partager son avis.</p>
            </div>
          ) : (
            <div className="space-y-7">
              {roots.map(comment => (
                <article key={comment.id}>
                  <CommentRow comment={comment} replyTarget={comment} {...rowActions}/>
                  {(repliesByParent[comment.id]?.length ?? 0) > 0 && (
                    <div className="ml-5 mt-4 space-y-4 border-l border-neutral-200 pl-5">
                      {repliesByParent[comment.id].map(reply => <CommentRow key={reply.id} comment={reply} replyTarget={comment} compact {...rowActions}/>)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <form onSubmit={submit} className="border-t border-neutral-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-5">
            {replyingTo && <div className="mb-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-[10px] text-emerald-700"><span>Réponse à <strong>{replyingTo.name}</strong></span><button type="button" onClick={() => setReplyingTo(null)} className="font-black">Annuler</button></div>}
            <div className="flex items-end gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-[10px] font-black text-[#3ecf4c]">{user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : (user.name ?? user.email ?? "U").charAt(0).toUpperCase()}</div>
              <div className="flex flex-1 items-end rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 transition focus-within:border-neutral-400 focus-within:bg-white focus-within:shadow-sm">
                <div className="min-w-0 flex-1">
                  <textarea
                    ref={inputRef}
                    value={content}
                    onChange={event => setContent(event.target.value)}
                    onKeyDown={event => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) event.currentTarget.form?.requestSubmit(); }}
                    maxLength={500}
                    rows={1}
                    placeholder={replyingTo ? `Répondre à ${replyingTo.name}…` : "Ajouter un commentaire…"}
                    className="max-h-28 min-h-7 w-full resize-none bg-transparent py-1 text-xs outline-none"
                    aria-label={replyingTo ? `Répondre à ${replyingTo.name}` : "Ajouter un commentaire"}
                  />
                  {content.length > 420 && <p className="text-right text-[8px] text-neutral-400">{content.length}/500</p>}
                </div>
                <button type="submit" disabled={submitting || content.trim().length < 2} className="ml-2 rounded-xl bg-black px-3 py-2 text-[10px] font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-30">{submitting ? "Publication…" : "Publier"}</button>
              </div>
            </div>
            <p className="mt-2 pl-12 text-[8px] text-neutral-400">Vous pouvez modifier ou supprimer vos commentaires à tout moment.</p>
          </form>
        ) : (
          <div className="border-t border-neutral-100 bg-neutral-50 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black">Participez à la discussion</p><p className="mt-1 text-[10px] leading-4 text-neutral-400">Connectez-vous pour commenter et gérer vos contributions.</p></div><button onClick={() => onRequireAuth("comment")} className="shrink-0 rounded-xl bg-black px-4 py-3 text-[10px] font-black text-white transition hover:bg-emerald-600">Se connecter</button></div>
          </div>
        )}
      </section>
    </div>
  );
}
