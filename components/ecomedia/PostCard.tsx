"use client";
import { useState, useEffect, useRef } from "react";
import type { EcomediaPost } from "@/lib/ecomedia";
import { formatRelativeTime, extractYouTubeId, extractTikTokId, POST_TYPE_LABELS } from "@/lib/ecomedia";
import { supabase } from "@/lib/supabase";
import CommentDrawer from "./CommentDrawer";
import EcomediaAuthPrompt from "./EcomediaAuthPrompt";
import Image from "next/image";
import Link from "next/link";

interface PostCardProps {
  post: EcomediaPost;
  priority?: boolean;
}

export default function PostCard({ post, priority = false }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [likeLoading, setLikeLoading] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auth state
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptAction, setAuthPromptAction] = useState<"like" | "comment" | "reply" | "save">("like");

  // Load Supabase auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ id: u.id, email: u.email, name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? u.email?.split("@")[0] });
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email, name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? u.email?.split("@")[0] } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check if already liked (use user.id as stable visitor ID)
  useEffect(() => {
    if (!authChecked || !user) return;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetch(`/api/ecomedia/likes?postId=${post.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { if (d.liked) setLiked(true); }).catch(() => {});
      fetch(`/api/ecomedia/saved?postId=${post.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { if (d.saved) setSaved(true); }).catch(() => {});
    });
  }, [post.id, user, authChecked]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  async function handleSave() {
    if (saveLoading) return;
    if (!user) { setAuthPromptAction("save"); setShowAuthPrompt(true); return; }
    setSaveLoading(true);
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");
      await fetch("/api/ecomedia/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ postId: post.id, action: newSaved ? "save" : "unsave" }),
      });
    } catch { setSaved(!newSaved); }
    setSaveLoading(false);
    if (newSaved) {
      const t = document.createElement("div");
      t.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-4 py-2.5 rounded-full z-50 shadow-lg flex items-center gap-2";
      t.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>Post enregistré dans votre tableau de bord`;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2500);
    }
  }

  function requireAuth(action: "like" | "comment"): boolean {
    if (user) return true;
    setAuthPromptAction(action);
    setShowAuthPrompt(true);
    return false;
  }

  async function handleLike() {
    if (likeLoading) return;
    if (!requireAuth("like")) return;
    setLikeLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(c => c + (newLiked ? 1 : -1));
    if (newLiked) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 600); }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");
      const res = await fetch("/api/ecomedia/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ postId: post.id, action: newLiked ? "like" : "unlike" }),
      });
      const data = await res.json();
      if (data.likes_count !== undefined) setLikesCount(data.likes_count);
    } catch { setLiked(!newLiked); setLikesCount(c => c + (newLiked ? -1 : 1)); }
    finally { setLikeLoading(false); }
  }

  async function handleShare() {
    const url = `${window.location.origin}/ecomedia/${post.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: post.content ?? "", url }); return; } catch { /* fallback */ }
    }
    try { await navigator.clipboard.writeText(url); showToast("Lien copié !"); } catch { showToast("Copie non disponible"); }
  }

  function showToast(msg: string) {
    const t = document.createElement("div");
    t.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-4 py-2.5 rounded-full z-50 shadow-lg";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  const youtubeId = post.video_url ? extractYouTubeId(post.video_url) : null;
  const tiktokId = post.video_url ? extractTikTokId(post.video_url) : null;
  const [captionExpanded, setCaptionExpanded] = useState(false);

  // Double-tap to like
  const lastTap = useRef(0);
  function handleMediaDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 350) { handleLike(); }
    lastTap.current = now;
  }

  return (
    <>
      <article className="bg-white border-b border-neutral-100 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-neutral-200 lg:shadow-sm">

        {/* â”€â”€ Instagram Header â”€â”€ */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Site logo with green ring */}
          <div className="p-[2.5px] rounded-full bg-gradient-to-br from-[#3ecf4c] to-[#16b277] shrink-0">
            <div className="bg-white p-[2px] rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.author_avatar || "/images/lm-icon.svg"} alt="" className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-black leading-tight">{post.author_name || "L'ecomax"}</p>
            <p className="text-[11px] text-neutral-500 leading-tight truncate">{post.is_client_post ? "Membre de la communauté" : POST_TYPE_LABELS[post.type]}{post.is_featured ? " · À la une" : ""}</p>
          </div>
          {/* 3-dot post menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 active:scale-90 transition-all">
              <svg width="20" height="4" viewBox="0 0 20 4" fill="currentColor">
                <circle cx="2" cy="2" r="2"/><circle cx="10" cy="2" r="2"/><circle cx="18" cy="2" r="2"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 z-30 bg-white border border-neutral-100 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden w-56">
                <button onClick={() => { setMenuOpen(false); const url = window.location.origin + '/ecomedia/' + post.slug; navigator.clipboard.writeText(url).catch(()=>{}); const t=document.createElement('div'); t.className='fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-4 py-2.5 rounded-full z-50 shadow-lg'; t.textContent='Lien copié !'; document.body.appendChild(t); setTimeout(()=>t.remove(),2000); }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </div>
                  Copier le lien
                </button>

                <button onClick={() => { setMenuOpen(false); const url = window.location.origin + '/ecomedia/' + post.slug; if (navigator.share) { navigator.share({ title: post.title, url }).catch(()=>{}); } else { navigator.clipboard.writeText(url).catch(()=>{}); } }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </div>
                  Partager
                </button>

                <a href={'/ecomedia/' + post.slug} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </div>
                  Voir le post
                </a>

                {post.product_url && (
                  <a href={post.product_url} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold hover:bg-green-50 transition-colors">
                    <div className="w-7 h-7 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16b277" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    </div>
                    <span className="text-[#16b277] font-semibold">Voir le produit</span>
                  </a>
                )}

                <div className="h-px bg-neutral-100 mx-3" />

                <button onClick={() => { setMenuOpen(false); alert('Signalement envoyé. Merci de nous aider à garder une communauté saine. 🙏'); }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  Signaler ce post
                </button>

                <button onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-3 text-[13px] font-black text-neutral-500 hover:bg-neutral-50 border-t border-neutral-100 transition-colors">
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Media â€” edge to edge â”€â”€ */}
        <div className="relative w-full bg-neutral-100" onTouchEnd={handleMediaDoubleTap} onClick={handleMediaDoubleTap}>
          {/* Image */}
          {(post.type === "image" || post.type === "promotion" || post.type === "product") && post.media_url && (
            <div className="w-full overflow-hidden bg-neutral-100">
              <img src={post.media_url} alt={post.title} className="block h-auto max-h-[720px] w-full object-contain" loading={priority ? "eager" : "lazy"} decoding="async" />
            </div>
          )}

          {/* Uploaded video */}
          {post.type === "video_upload" && post.media_url && (
            <div className="relative w-full aspect-square bg-black">
              <video src={post.media_url} poster={post.thumbnail_url ?? undefined}
                controls preload="metadata" className="w-full h-full object-contain" playsInline />
            </div>
          )}

          {/* YouTube */}
          {post.type === "video_url" && youtubeId && (
            <div className="relative w-full aspect-square bg-black">
              {!videoExpanded ? (
                <button onClick={(e) => { e.stopPropagation(); setVideoExpanded(true); }} className="absolute inset-0 flex items-center justify-center group">
                  {post.thumbnail_url
                    ? <Image src={post.thumbnail_url} alt={post.title} fill className="object-cover" />
                    : <div className="absolute inset-0 bg-neutral-900" />}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </button>
              ) : (
                <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen className="absolute inset-0 w-full h-full border-0" />
              )}
            </div>
          )}

          {/* TikTok */}
          {post.type === "video_url" && tiktokId && (
            <div className="relative w-full aspect-square bg-black flex items-center justify-center">
              <a href={post.video_url!} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 text-white">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.67a8.18 8.18 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z"/></svg>
                <span className="text-sm font-bold">Voir sur TikTok</span>
              </a>
            </div>
          )}

          {/* Text-only / no media */}
          {!post.media_url && !post.video_url && (
            <div className="w-full aspect-square bg-neutral-950 flex items-center justify-center p-8">
              <p className="text-white text-xl font-black text-center leading-relaxed line-clamp-6">{post.title}</p>
            </div>
          )}

          {/* Double-tap heart animation overlay */}
          {heartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="white" className="drop-shadow-2xl animate-ping">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            </div>
          )}
        </div>

        {/* â”€â”€ Action Row â”€â”€ */}
        <div className="px-3 pt-2 pb-1">
          <div className="flex items-center">
            {/* Left: like, comment, share */}
            <div className="flex items-center gap-3 flex-1">
              {/* Like */}
              <button onClick={handleLike} disabled={likeLoading} className="active:scale-90 transition-transform">
                {liked ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#ef4444">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                )}
              </button>
              {/* Comment */}
              <button onClick={() => setShowComments(true)} className="active:scale-90 transition-transform" aria-label="Voir les commentaires">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </button>
              {/* Share or product link */}
              {post.product_url ? (
                <a
                  href={post.product_url}
                  title="Voir le produit"
                  className="active:scale-90 transition-transform relative group/shop"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  {/* Tooltip */}
                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full opacity-0 group-hover/shop:opacity-100 transition-opacity">
                    Voir le produit
                  </span>
                </a>
              ) : (
                <button onClick={handleShare} className="active:scale-90 transition-transform">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              )}
            </div>
            {/* Right: auth hint or bookmark */}
            {authChecked && !user ? (
              <Link href="/connexion?redirect=%2Fecomedia" className="text-[11px] text-[#16b277] font-black hover:underline">
                Se connecter
              </Link>
            ) : (
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className={`active:scale-90 transition-transform ${saved ? "text-black" : "text-neutral-400"}`}
                title={saved ? "Retirer des enregistrements" : "Enregistrer"}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
              </button>
            )}
          </div>

          {/* Likes count */}
          {likesCount > 0 && (
            <p className="text-[13px] font-black text-black mt-1.5">
              {likesCount.toLocaleString("fr-FR")} J&apos;aime{likesCount > 1 ? "s" : ""}
            </p>
          )}

          {/* Caption */}
          <div className="mt-1">
            <span className="text-[13px] font-black text-black mr-1.5">{post.author_name || "L'ecomax"}</span>
            <span className="text-[13px] text-black">
              {captionExpanded || (post.content ?? post.title).length < 100
                ? (post.content ?? post.title)
                : (
                  <>
                    {(post.content ?? post.title).slice(0, 100)}
                    <button onClick={() => setCaptionExpanded(true)} className="text-neutral-400 ml-1">
                      â€¦ plus
                    </button>
                  </>
                )}
            </span>
          </div>

          {/* CTA button */}
          {post.product_url && (
            <a href={post.product_url}
              className="flex items-center gap-2 mt-2 bg-black text-white text-[12px] font-black px-4 py-2 rounded-lg active:scale-95 transition-all w-fit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {post.cta_text || "Acheter maintenant"}
            </a>
          )}

          {/* Comments count + timestamp */}
          {commentsCount > 0 && (
            <button onClick={() => setShowComments(true)}
              className="text-[13px] text-neutral-400 mt-1 block">
              Voir les {commentsCount} commentaire{commentsCount > 1 ? "s" : ""}
            </button>
          )}
          <p className="text-[11px] text-neutral-400 mt-1 uppercase tracking-wide">{formatRelativeTime(post.created_at)}</p>
        </div>

        {/* Bottom padding */}
        <div className="h-2" />
      </article>

      {/* Auth Prompt */}
      {showAuthPrompt && (
        <EcomediaAuthPrompt
          action={authPromptAction}
          redirectPath="/ecomedia"
          onClose={() => setShowAuthPrompt(false)}
        />
      )}

      {/* Comment Drawer */}
      {showComments && (
        <CommentDrawer
          post={post}
          user={user}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentsCount(c => c + 1)}
          onRequireAuth={action => { setShowComments(false); setAuthPromptAction(action); setShowAuthPrompt(true); }}
        />
      )}
    </>
  );
}
