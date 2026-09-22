"use client";
import AdminLoading from "@/components/admin/AdminLoading";
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
  admin_reply?: string | null;
};

type ProductOption = { id: string; slug: string; name: string; };

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
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Add review form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    product_slug: "", author_name: "", city: "", rating: 5,
    title: "", review_body: "", color: "",
  });
  const [addingReview, setAddingReview] = useState(false);

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    setAddingReview(true);
    const res = await fetch("/api/reviews/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    setAddingReview(false);
    if (res.ok) {
      showToast("Avis ajouté ✓");
      setShowAddForm(false);
      setAddForm({ product_slug: "", author_name: "", city: "", rating: 5, title: "", review_body: "", color: "" });
      await load();
    } else {
      const json = await res.json();
      showToast("Erreur : " + (json.error ?? "inconnue"), false);
    }
  }

  async function generateAIReply(review: Review) {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: review.author_name + (review.city ? ` (${review.city})` : ""),
          subject: review.title || `Avis ${review.rating}/5 sur ${review.product_slug}`,
          message: review.body,
        }),
      });
      const data = await res.json();
      if (data.reply) setReplyText(data.reply);
    } finally {
      setAiLoading(false);
    }
  }

  async function saveReply(id: string) {
    setSavingReply(true);
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_reply: replyText.trim() || null }),
    });
    setSavingReply(false);
    if (res.ok) {
      showToast("Réponse enregistrée ✓");
      setReplyingId(null);
      setReplyText("");
      await load();
    } else {
      showToast("Erreur lors de l'enregistrement", false);
    }
  }

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

  useEffect(() => {
    load();
    fetch("/api/products").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setProducts(data.map((p: { id: string; slug: string; name: string }) => ({ id: p.id, slug: p.slug, name: p.name })));
    });
  }, []);

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
    <div className="min-w-0 pb-6">
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

      {/* Add review form */}


      {/* Stats */}
      <div className="grid grid-cols-5 gap-1.5 mb-5 sm:gap-3 sm:mb-6">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <button
              key={star}
              aria-pressed={filterRating === star}
              aria-label={`${star} étoiles : ${count} avis (${pct} %)`}
              onClick={() => setFilterRating(filterRating === star ? 0 : star)}
              className={`min-w-0 border rounded-xl px-1 py-3 text-center transition-colors sm:rounded-2xl sm:px-4 ${
                filterRating === star ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "bg-white border-neutral-100 hover:border-neutral-300"
              }`}
            >
              <p className="text-base font-black sm:text-lg">{star}<span className="ml-0.5 text-amber-500">★</span></p>
              <p className="mt-1 text-[11px] text-neutral-500 sm:text-xs">{count}<span className="hidden sm:inline"> avis</span></p>
              <p className="mt-0.5 text-[10px] text-neutral-400 sm:text-xs">{pct}%</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full sm:max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Auteur, produit, contenu…"
          aria-label="Rechercher un avis"
          className="min-h-12 w-full border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-black"
        />
      </div>

      {loading ? (
        <AdminLoading />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-2xl px-6 py-16 text-center text-neutral-400 text-sm">
          Aucun avis trouvé.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="min-w-0 bg-white border border-neutral-200/70 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 w-full flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <StarRow rating={r.rating} />
                    <span className="font-bold text-sm break-words">{r.author_name}</span>
                    {r.city && <span className="text-xs text-neutral-400">{r.city}</span>}
                    {r.color && (
                      <span className="text-xs text-neutral-400">Couleur: {r.color}</span>
                    )}
                  </div>
                  <a
                    href={`/produit/${encodeURIComponent(r.product_slug)}/`}
                    className="mb-3 block rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-500 break-words hover:text-emerald-700"
                  >
                    {products.find((product) => product.slug === r.product_slug)?.name || r.product_slug.replace(/-/g, " ")}
                  </a>
                  {r.title && <p dir="auto" className="font-semibold text-sm mb-1 break-words">{r.title}</p>}
                  <p dir="auto" className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap break-words">{r.body}</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {r.admin_reply && replyingId !== r.id && (
                    <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Votre réponse</p>
                      <p dir="auto" className="text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap break-words">{r.admin_reply}</p>
                    </div>
                  )}
                  {replyingId === r.id && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => generateAIReply(r)}
                        disabled={aiLoading}
                        className="flex min-h-11 items-center gap-1.5 border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-violet-100 transition-colors disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                        ) : "✨"}
                        {aiLoading ? "Génération…" : "Générer une réponse IA"}
                      </button>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        aria-label="Votre réponse au client"
                        autoFocus
                        placeholder="Réponse (ou cliquez IA pour générer)…"
                        className="w-full min-h-32 border border-neutral-200 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all resize-y"
                      />
                      <div className="flex flex-wrap gap-2 [&>button]:min-h-11">
                        <button
                          onClick={() => saveReply(r.id)}
                          disabled={savingReply}
                          className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                          {savingReply ? "Enregistrement…" : "Publier la réponse"}
                        </button>
                        {r.admin_reply && (
                          <button
                            disabled={savingReply}
                            className="px-4 py-2 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40"
                            onClick={() => { setReplyText(""); setTimeout(() => saveReply(r.id), 0); }}
                          >
                            Supprimer la réponse
                          </button>
                        )}
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(""); }}
                          className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-black transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3 lg:flex lg:shrink-0 lg:border-0 lg:pt-0">
                  <button
                    onClick={() => { setReplyingId(replyingId === r.id ? null : r.id); setReplyText(r.admin_reply ?? ""); }}
                    className="flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold border rounded-xl transition-colors border-neutral-200 hover:border-black text-neutral-700 hover:text-black"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {r.admin_reply ? "Modifier réponse" : "Répondre"}
                  </button>
                  <button
                    onClick={() => deleteReview(r.id)}
                    disabled={deletingId === r.id}
                    className="flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    {deletingId === r.id ? "…" : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
