"use client";
import { useState, useEffect, useCallback } from "react";
import type { EcomediaPost } from "@/lib/ecomedia";
import PostCard from "./PostCard";
import EcomediaStories from "./EcomediaStories";

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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    async function reload() {
      setRefreshing(true);
      try {
        const params = new URLSearchParams({ type: filter, limit: String(LIMIT), offset: "0" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        const res = await fetch(`/api/ecomedia/posts?${params}`);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        setPosts(arr);
        setOffset(arr.length);
        setHasMore(arr.length >= LIMIT);
      } finally { setRefreshing(false); }
    }
    reload();
  }, [filter, debouncedSearch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ type: filter, limit: String(LIMIT), offset: String(offset) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/ecomedia/posts?${params}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setPosts(prev => [...prev, ...arr]);
      setOffset(o => o + arr.length);
      setHasMore(arr.length >= LIMIT);
    } finally { setLoadingMore(false); }
  }, [filter, offset, debouncedSearch, loadingMore, hasMore]);

  return (
    <div className="max-w-[470px] mx-auto">
      {/* Stories row with filter functionality */}
      <EcomediaStories activeFilter={filter} onFilterChange={(key) => { setFilter(key); setShowSearch(false); }} />


      {/* Feed */}
      {refreshing ? (
        <div>{[...Array(3)].map((_, i) => <SkeletonPost key={i} />)}</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-20 h-20 rounded-full border-2 border-neutral-200 flex items-center justify-center mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <p className="font-black text-xl text-black mb-2">Aucune publication</p>
          <p className="text-sm text-neutral-400">{debouncedSearch ? "Aucun rÃ©sultat pour cette recherche." : "Revenez bientÃ´t pour du nouveau contenu."}</p>
        </div>
      ) : (
        <>
          {posts.map((post, i) => <PostCard key={post.id} post={post} priority={i < 2} />)}
          {hasMore && (
            <div className="py-6 flex justify-center">
              <button onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2 text-sm font-black text-black hover:text-neutral-600 transition-colors disabled:opacity-40">
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                )}
                {loadingMore ? "Chargementâ€¦" : "Voir plus"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
