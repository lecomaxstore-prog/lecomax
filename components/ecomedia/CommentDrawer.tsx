"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EcomediaComment, EcomediaPost } from "@/lib/ecomedia";
import { formatRelativeTime } from "@/lib/ecomedia";
import { supabase } from "@/lib/supabase";

interface Props {
  post: EcomediaPost;
  onClose: () => void;
  onCommentAdded: () => void;
  onRequireAuth: (action: "comment" | "reply") => void;
  user?: { id: string; email?: string; name?: string } | null;
}

function CommentItem({ comment, replies, user, onReply }: { comment: EcomediaComment; replies: EcomediaComment[]; user: Props["user"]; onReply: (comment: EcomediaComment) => void }) {
  const isMine = Boolean(user && comment.user_id === user.id);
  return (
    <div className="group">
      <div className="flex gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${isMine ? "bg-black text-[#3ecf4c] ring-2 ring-[#3ecf4c]/20" : "bg-neutral-100 text-neutral-600"}`}>{comment.name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-xs font-black text-black">{comment.name}</span>{isMine && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#16b277]">Vous</span>}<span className="text-[9px] text-neutral-400">{formatRelativeTime(comment.created_at)}</span></div>
          <p className="mt-1 break-words text-[13px] leading-5 text-neutral-700">{comment.content}</p>
          <button type="button" onClick={() => onReply(comment)} className="mt-2 text-[10px] font-black text-neutral-400 transition hover:text-black">Répondre</button>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-5 mt-3 space-y-3 border-l border-neutral-200 pl-5">
          {replies.map(reply => (
            <div key={reply.id} className="flex gap-2.5">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${user && reply.user_id === user.id ? "bg-black text-[#3ecf4c]" : "bg-neutral-100 text-neutral-500"}`}>{reply.name.charAt(0).toUpperCase()}</div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[11px] font-black">{reply.name}</span><span className="text-[9px] text-neutral-400">{formatRelativeTime(reply.created_at)}</span></div><p className="mt-0.5 break-words text-xs leading-5 text-neutral-600">{reply.content}</p><button type="button" onClick={() => onReply(comment)} className="mt-1.5 text-[9px] font-black text-neutral-400 hover:text-black">Répondre</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentDrawer({ post, onClose, onCommentAdded, onRequireAuth, user }: Props) {
  const [comments, setComments] = useState<EcomediaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<EcomediaComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/ecomedia/comments?postId=${post.id}`, { cache: "no-store" })
      .then(response => response.json())
      .then(data => setComments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [post.id]);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const roots = useMemo(() => comments.filter(comment => !comment.parent_id), [comments]);
  const repliesByParent = useMemo(() => comments.reduce<Record<string, EcomediaComment[]>>((result, comment) => { if (comment.parent_id) (result[comment.parent_id] ??= []).push(comment); return result; }, {}), [comments]);

  function chooseReply(comment: EcomediaComment) {
    if (!user) { onRequireAuth("reply"); return; }
    setReplyingTo(comment); inputRef.current?.focus();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) { onRequireAuth(replyingTo ? "reply" : "comment"); return; }
    const message = content.trim();
    if (message.length < 2) { setError("Écrivez au moins 2 caractères."); return; }
    setSubmitting(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { onRequireAuth(replyingTo ? "reply" : "comment"); return; }
      const response = await fetch("/api/ecomedia/comments", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ postId: post.id, content: message, parentId: replyingTo?.id ?? null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Envoi impossible.");
      setComments(current => [...current, data]); setContent(""); setReplyingTo(null); onCommentAdded();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Une erreur est survenue."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="comments-title">
      <button className="absolute inset-0 h-full w-full bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label="Fermer les commentaires" />
      <section className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-white shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-full sm:max-w-[520px] sm:rounded-none">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div><div className="flex items-center gap-2"><h2 id="comments-title" className="text-base font-black">Discussion</h2><span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black text-neutral-500">{comments.length}</span></div><p className="mt-0.5 max-w-[300px] truncate text-[10px] text-neutral-400">{post.title}</p></div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 transition hover:bg-neutral-200" aria-label="Fermer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? <div className="flex justify-center py-14"><div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-black"/></div> : roots.length === 0 ? (
            <div className="mx-auto flex max-w-xs flex-col items-center py-14 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10Z"/></svg></div><p className="text-sm font-black">Lancez la conversation</p><p className="mt-1 text-xs leading-5 text-neutral-400">Soyez le premier membre à partager son avis.</p></div>
          ) : <div className="space-y-6">{roots.map(comment => <CommentItem key={comment.id} comment={comment} replies={repliesByParent[comment.id] ?? []} user={user} onReply={chooseReply}/>)}</div>}
        </div>

        {user ? (
          <form onSubmit={submit} className="border-t border-neutral-100 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            {replyingTo && <div className="mb-2 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-[10px] text-green-700"><span>Réponse à <strong>{replyingTo.name}</strong></span><button type="button" onClick={() => setReplyingTo(null)} className="font-black">Annuler</button></div>}
            {error && <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-[10px] text-red-600">{error}</p>}
            <div className="flex items-end gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-black text-[#3ecf4c]">{(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}</div><div className="flex flex-1 items-end rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 focus-within:border-neutral-400 focus-within:bg-white"><textarea ref={inputRef} value={content} onChange={event => setContent(event.target.value)} maxLength={500} rows={1} placeholder={replyingTo ? `Répondre à ${replyingTo.name}…` : "Ajouter un commentaire…"} className="max-h-28 min-h-7 flex-1 resize-none bg-transparent py-1 text-xs outline-none"/><button type="submit" disabled={submitting || content.trim().length < 2} className="ml-2 rounded-xl bg-black px-3 py-2 text-[10px] font-black text-white transition hover:bg-[#16b277] disabled:opacity-30">{submitting ? "…" : "Publier"}</button></div></div>
          </form>
        ) : (
          <div className="border-t border-neutral-100 bg-neutral-50 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black">Envie de répondre ?</p><p className="mt-1 text-[10px] leading-4 text-neutral-400">Connectez-vous gratuitement pour participer.</p></div><button onClick={() => onRequireAuth("comment")} className="shrink-0 rounded-xl bg-black px-4 py-3 text-[10px] font-black text-white transition hover:bg-[#16b277]">Se connecter</button></div></div>
        )}
      </section>
    </div>
  );
}
