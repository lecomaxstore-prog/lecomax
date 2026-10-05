"use client";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import type { EcomediaPost } from "@/lib/ecomedia";
import PostCard from "./PostCard";
import EcomediaStories from "./EcomediaStories";
import CommunityComposer from "./CommunityComposer";

const LIMIT = 9;

interface Props {
  initialPosts: EcomediaPost[];
}

// Instagram-style skeleton
function SkeletonPost() {
  return (
    <div className="bg-white border-b border-neutral-100 animate-pulse">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-10 h-10 rounded-full bg-neutral-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-neutral-200 rounded w-24" />
          <div className="h-2 bg-neutral-200 rounded w-16" />
        </div>
      </div>
      <div className="aspect-square bg-neutral-200 w-full" />
      <div className="px-3 pt-3 pb-4 space-y-2">
        <div className="h-4 bg-neutral-200 rounded w-20" />
        <div className="h-3 bg-neutral-200 rounded w-full" />
        <div className="h-3 bg-neutral-200 rounded w-3/4" />
      </div>
    </div>
  );
}

export default function EcomediaFeed({ initialPosts }: Props) {
  const [posts, setPosts] = useState<EcomediaPost[]>(initialPosts);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(initialPosts.length);
  const [hasMore, setHasMore] = useState(initialPosts.length >= LIMIT);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const morePending = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const version = ++generation.current;
    const controller = new AbortController();
    morePending.current = false;
    setLoadingMore(false);
    async function reload() {
      setRefreshing(true);
      setError("");
      try {
        const params = new URLSearchParams({ type: filter, limit: String(LIMIT), offset: "0" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        const res = await fetch(`/api/ecomedia/posts?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Feed unavailable");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid feed");
        if (version !== generation.current || controller.signal.aborted) return;
        const arr = data;
        setPosts(arr);
        setOffset(arr.length);
        setHasMore(arr.length >= LIMIT);
      } catch {
        if (!controller.signal.aborted) setError("Le fil est momentanément indisponible. Réessayez.");
      } finally { if (!controller.signal.aborted) setRefreshing(false); }
    }
    void reload();
    return () => { controller.abort(); generation.current++; };
  }, [filter, debouncedSearch, revision]);

  const loadMore = useCallback(async () => {
    if (morePending.current || refreshing || !hasMore) return;
    morePending.current = true;
    const version = generation.current;
    setLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams({ type: filter, limit: String(LIMIT), offset: String(offset) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/ecomedia/posts?${params}`);
      if (!res.ok) throw new Error("Feed unavailable");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid feed");
      if (version !== generation.current) return;
      const arr = data;
      setPosts(prev => [...prev, ...arr.filter(post => !prev.some(existing => existing.id === post.id))]);
      setOffset(o => o + arr.length);
      setHasMore(arr.length >= LIMIT);
    } catch {
      if (version === generation.current) setError("Impossible de charger la suite. Réessayez.");
    } finally {
      if (version === generation.current) { morePending.current = false; setLoadingMore(false); }
    }
  }, [filter, offset, debouncedSearch, refreshing, hasMore]);

  return (
    <div className="mx-auto w-full max-w-[1040px] sm:px-6 sm:py-6">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,600px)_minmax(280px,1fr)]">
        <div className="min-w-0 overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-neutral-200 sm:shadow-sm lg:overflow-visible lg:border-0 lg:bg-transparent lg:shadow-none">
          {/* Stories row with filter functionality */}
          <div className="bg-white sm:rounded-t-2xl sm:border sm:border-neutral-200 sm:border-b-0">
            <EcomediaStories activeFilter={filter} onFilterChange={(key) => { setFilter(key); setShowSearch(false); }} />
            <CommunityComposer onPublished={post => { setPosts(current => [post, ...current]); setOffset(current => current + 1); }} />
          </div>

          {/* Feed */}
          {error && <div role="alert" className="m-3 rounded-xl border border-neutral-200 p-4 text-sm"><p>{error}</p><button type="button" onClick={() => setRevision(value => value + 1)} className="mt-2 min-h-11 font-bold underline">Réessayer</button></div>}
          <div className="lg:mt-5 lg:space-y-5">
          {refreshing ? (
            <div>{[...Array(3)].map((_, i) => <SkeletonPost key={i} />)}</div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white py-20 px-8 text-center sm:rounded-2xl sm:border sm:border-neutral-200">
          <div className="w-20 h-20 rounded-full border-2 border-neutral-200 flex items-center justify-center mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <p className="font-black text-xl text-black mb-2">Aucune publication</p>
          <p className="text-sm text-neutral-400">{debouncedSearch ? "Aucun résultat pour cette recherche." : "Revenez bientôt pour du nouveau contenu."}</p>
            </div>
          ) : (
            <>
              {posts.map((post, i) => <PostCard key={post.id} post={post} priority={i < 2} onDeleted={postId => { setPosts(current => current.filter(item => item.id !== postId)); setOffset(current => Math.max(0, current - 1)); }} />)}
              {hasMore && (
            <div className="py-6 flex justify-center">
              <button onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2 text-sm font-black text-black hover:text-neutral-600 transition-colors disabled:opacity-40">
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                )}
                {loadingMore ? "Chargement…" : "Voir plus"}
              </button>
            </div>
              )}
            </>
          )}
          </div>
        </div>

        <aside className="sticky top-24 hidden space-y-4 lg:block">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="relative overflow-hidden bg-neutral-950 p-6 text-white"><div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#3ecf4c]/20 blur-3xl"/><p className="relative text-[9px] font-black uppercase tracking-[.28em] text-[#3ecf4c]">Communauté officielle</p><h2 className="relative mt-3 text-2xl font-black leading-tight">Votre espace.<br/>Votre voix.</h2><p className="relative mt-3 text-xs leading-5 text-white/50">Partagez vos découvertes, échangez avec les membres et suivez L&apos;ecomax autrement.</p></div>
            <div className="p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Ici, vous pouvez</p>
              <div className="mt-4 space-y-3">
                {[
                  ["M5 12h14M12 5v14", "Publier vos photos et vos idées"],
                  ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10Z", "Commenter et répondre"],
                  ["M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21.2l7.8-7.8a5.5 5.5 0 000-7.8Z", "Soutenir les publications"],
                ].map(([path, label]) => <div key={label} className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#16b277]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={path}/></svg></span><span className="text-xs font-semibold text-neutral-700">{label}</span></div>)}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2"><Link href="/connexion?redirect=%2Fecomedia" className="rounded-xl border border-neutral-200 px-3 py-3 text-center text-[10px] font-black hover:border-black">Connexion</Link><Link href="/inscription?redirect=%2Fecomedia" className="rounded-xl bg-black px-3 py-3 text-center text-[10px] font-black text-white hover:bg-[#16b277]">Créer un compte</Link></div>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center gap-2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16b277" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg><p className="text-xs font-black">Un espace respectueux</p></div><p className="mt-2 text-[10px] leading-5 text-neutral-400">Soyez bienveillant, restez pertinent et ne partagez aucune information personnelle sensible.</p></div>
          <p className="px-1 text-[9px] leading-4 text-neutral-400">Les visiteurs peuvent lire toutes les discussions. La participation nécessite un compte gratuit.</p>
        </aside>
      </div>
    </div>
  );
}
