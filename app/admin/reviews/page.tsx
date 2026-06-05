"use client";
import { useEffect, useState } from "react";

type Review = {
  id: string;
  product_slug: string;
  author_name: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  color: string | null;
  created_at: string;
  approved?: boolean;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= rating ? "#000" : "none"} stroke="currentColor" strokeWidth="2" className="shrink-0">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState(0);
  const [search, setSearch] = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  async function load() {
    setLoading(true);
    const res = await fetch("/api/reviews");
    const data = await res.json();
    if (Array.isArray(data)) setReviews(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteReview(id: string) {
    if (!confirm("Supprimer cet avis définitivement ?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      showToast("Erreur : " + (json.error ?? "inconnue"), false);
    } else { showToast("Avis supprimé ✓"); await load(); }
    setDeletingId(null);
  }

  const filtered = reviews.filter((r) => {
    const matchRating = filterRating === 0 || r.rating === filterRating;
    const matchSearch =
      !search ||
      r.author_name.toLowerCase().includes(search.toLowerCase()) ||
      r.product_slug.toLowerCase().includes(search.toLowerCase()) ||
      r.body.toLowerCase().includes(search.toLowerCase());
    return matchRating && matchSearch;
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Avis Clients</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {reviews.length} avis · Note moyenne : {avgRating}/5
          </p>
        </div>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${
          toast.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <button
              key={star}
              onClick={() => setFilterRating(filterRating === star ? 0 : star)}
              className={`bg-white border rounded-2xl px-4 py-3 text-center transition-all ${
                filterRating === star ? "border-black" : "border-neutral-100 hover:border-neutral-300"
              }`}
            >
              <p className="text-lg font-black">{star}★</p>
              <p className="text-xs text-neutral-400 mt-0.5">{count} · {pct}%</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Auteur, produit, contenu…"
          className="w-full border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-black"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-2xl px-6 py-16 text-center text-neutral-400 text-sm">
          Aucun avis trouvé.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border border-neutral-100 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <StarRow rating={r.rating} />
                    <span className="font-bold text-sm">{r.author_name}</span>
                    {r.city && <span className="text-xs text-neutral-400">{r.city}</span>}
                    <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-mono">
                      {r.product_slug}
                    </span>
                    {r.color && (
                      <span className="text-xs text-neutral-400">Couleur: {r.color}</span>
                    )}
                  </div>
                  {r.title && <p className="font-semibold text-sm mb-1">{r.title}</p>}
                  <p className="text-sm text-neutral-600 leading-relaxed">{r.body}</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => deleteReview(r.id)}
                  disabled={deletingId === r.id}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  {deletingId === r.id ? "…" : "Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
