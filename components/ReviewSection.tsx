"use client";

import { useState, useEffect, useRef } from "react";
import SEED_REVIEWS from "@/lib/seed-reviews";
import { ratingFor } from "@/components/ProductCard";

type Review = {
  id: string;
  author_name: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  color: string | null;
  created_at: string;
};

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= rating ? "#facc15" : "none"}
          stroke={s <= rating ? "#facc15" : "#d4d4d4"}
          strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric"
  });
}

export default function ReviewSection({ productSlug }: { productSlug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [colorFilter, setColorFilter] = useState<string>("Tous");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 360 : -360, behavior: "smooth" });
  };

  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Email order-check state
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "ok" | "not_ordered" | "already_reviewed">("idle");

  const checkEmail = async (val: string) => {
    if (!val.trim() || !val.includes("@")) return;
    setEmailChecking(true);
    setEmailStatus("idle");
    try {
      const res = await fetch(`/api/reviews/check?slug=${productSlug}&email=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      if (data.canReview) {
        setEmailStatus("ok");
      } else {
        setEmailStatus(data.reason ?? "not_ordered");
      }
    } catch {
      // silently ignore network errors, let server-side validate
    } finally {
      setEmailChecking(false);
    }
  };

  useEffect(() => {
    fetch(`/api/reviews?slug=${productSlug}`)
      .then((r) => r.json())
      .then((d) => {
        const dbReviews: Review[] = d.reviews ?? [];
        const seeds = SEED_REVIEWS[productSlug] ?? [];
        // Merge: seed reviews first, then real DB reviews on top
        // Deduplicate by id (DB reviews take precedence)
        const dbIds = new Set(dbReviews.map((r) => r.id));
        const merged = [...seeds.filter((s) => !dbIds.has(s.id)), ...dbReviews];
        setReviews(merged);
      })
      .finally(() => setLoading(false));
  }, [productSlug]);

  // Use the same ratingFor function as ProductCard for consistent header stats
  const { rating: cardRating, count: cardCount } = ratingFor(productSlug);
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : cardRating;
  const displayCount = reviews.length || cardCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !body.trim()) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (emailStatus === "not_ordered") {
      setFormError("Seuls les clients ayant commandé ce produit peuvent laisser un avis.");
      return;
    }
    if (emailStatus === "already_reviewed") {
      setFormError("Vous avez déjà laissé un avis pour ce produit.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_slug: productSlug,
        email,
        author_name: name,
        city,
        rating,
        title,
        review_body: body,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setFormError(data.error ?? "Une erreur est survenue.");
    } else {
      setSubmitted(true);
      // Reload reviews and re-merge with seeds
      fetch(`/api/reviews?slug=${productSlug}`)
        .then((r) => r.json())
        .then((d) => {
          const dbReviews: Review[] = d.reviews ?? [];
          const seeds = SEED_REVIEWS[productSlug] ?? [];
          const dbIds = new Set(dbReviews.map((r) => r.id));
          setReviews([...seeds.filter((s) => !dbIds.has(s.id)), ...dbReviews]);
        });
    }
  };

  return (
    <section className="mt-16 border-t border-neutral-100 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="h-display text-2xl md:text-3xl">Avis clients</h2>
          <div className="w-8 h-[3px] bg-black mt-2" />
        </div>
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 px-4 py-3">
          <div>
            <p className="text-3xl font-black leading-none">{cardRating.toFixed(1)}</p>
            <StarRow rating={Math.round(cardRating)} size={10} />
            <p className="text-[11px] text-neutral-400 mt-1">{displayCount} avis</p>
          </div>
        </div>
      </div>

      {/* Leave a review button */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 inline-flex items-center gap-2 border border-black px-5 py-3 text-[12px] font-black uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Laisser un avis
        </button>
      )}

      {/* Review form */}
      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="mb-10 border border-neutral-200 p-6 bg-neutral-50">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-5">Votre avis</p>

          {/* Email verification notice */}
          <div className="flex gap-2 items-start bg-black text-white px-4 py-3 mb-5 text-[12px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            Réservé aux acheteurs — entrez l&apos;email utilisé lors de votre commande pour vérification.
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">
                Email de commande <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailStatus("idle"); }}
                  onBlur={(e) => checkEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className={`w-full border px-3 py-2.5 text-[13px] outline-none transition-colors bg-white pr-9 ${
                    emailStatus === "ok" ? "border-emerald-500 focus:border-emerald-500" :
                    emailStatus === "not_ordered" || emailStatus === "already_reviewed" ? "border-red-400 focus:border-red-400" :
                    "border-neutral-200 focus:border-black"
                  }`}
                />
                {emailChecking && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" /></svg>
                  </span>
                )}
                {!emailChecking && emailStatus === "ok" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                )}
                {!emailChecking && (emailStatus === "not_ordered" || emailStatus === "already_reviewed") && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                )}
              </div>
              {emailStatus === "not_ordered" && (
                <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Aucune commande trouvée pour cet email sur ce produit.
                </p>
              )}
              {emailStatus === "already_reviewed" && (
                <p className="text-amber-600 text-[11px] mt-1 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Vous avez déjà laissé un avis pour ce produit.
                </p>
              )}
              {emailStatus === "ok" && (
                <p className="text-emerald-600 text-[11px] mt-1 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Commande vérifiée — vous pouvez laisser un avis.
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">
                Votre nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Prénom N."
                className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">
              Ville
            </label>
            <input
              type="text" value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Casablanca"
              className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Star rating selector */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-2">
              Note <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s} type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24"
                    fill={s <= (hoverRating || rating) ? "#facc15" : "none"}
                    stroke={s <= (hoverRating || rating) ? "#facc15" : "#d4d4d4"}
                    strokeWidth="1.5" className="transition-colors">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">
              Titre de l&apos;avis
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Excellent produit !"
              className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">
              Votre avis <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)} required rows={4}
              placeholder="Partagez votre expérience avec ce produit..."
              className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors resize-none"
            />
          </div>

          {formError && (
            <p className="text-red-600 text-[12px] mb-4 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || emailChecking || emailStatus === "not_ordered" || emailStatus === "already_reviewed"}
              className="bg-black text-white px-6 py-3 text-[12px] font-black uppercase tracking-wide hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Envoi..." : emailChecking ? "Vérification..." : "Publier l'avis"}
            </button>
            <button
              type="button" onClick={() => { setShowForm(false); setFormError(null); setEmailStatus("idle"); }}
              className="border border-neutral-200 px-6 py-3 text-[12px] font-bold uppercase tracking-wide hover:border-black transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Success message */}
      {submitted && (
        <div className="mb-8 flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-5 py-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          <p className="text-[13px] text-emerald-700 font-medium">Merci ! Votre avis a été publié avec succès.</p>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-72 flex-none bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Color filter + nav buttons row */}
          {(() => {
            const colors = Array.from(new Set(reviews.map(r => r.color).filter(Boolean))) as string[];
            const all = colors.length >= 2 ? ["Tous", ...colors] : null;
            const filtered = reviews.filter(r => colorFilter === "Tous" || r.color === colorFilter);
            return (
              <>
                <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
                  {all ? (
                    <div className="flex flex-wrap gap-2">
                      {all.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColorFilter(c)}
                          className={`px-3.5 py-1.5 text-[12px] font-bold border transition-colors ${
                            colorFilter === c
                              ? "bg-black text-white border-black"
                              : "bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black"
                          }`}
                        >
                          {c}
                          {c !== "Tous" && (
                            <span className="ml-1.5 text-[11px] opacity-60">
                              ({reviews.filter(r => r.color === c).length})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : <div />}

                  {/* Prev / Next — desktop only */}
                  {filtered.length > 2 && (
                    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => scroll("left")}
                        aria-label="Précédent"
                        className="w-9 h-9 flex items-center justify-center border border-neutral-200 hover:border-black hover:bg-black hover:text-white transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => scroll("right")}
                        aria-label="Suivant"
                        className="w-9 h-9 flex items-center justify-center border border-neutral-200 hover:border-black hover:bg-black hover:text-white transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
                  {filtered.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 p-5 border border-neutral-100 bg-white flex-none w-[300px] md:w-[340px]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[13px] font-black flex-shrink-0">
                    {r.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-[13px] leading-tight">{r.author_name}</p>
                    {r.city && <p className="text-[11px] text-neutral-400">{r.city}</p>}
                  </div>
                </div>
                <span className="text-[11px] text-neutral-400 whitespace-nowrap mt-0.5">{formatDate(r.created_at)}</span>
              </div>

              <div>
                <StarRow rating={r.rating} size={12} />
                {r.title && <p className="font-black text-[13px] mt-1">{r.title}</p>}
              </div>

              <p className="text-[13px] text-neutral-600 leading-relaxed flex-1">{r.body}</p>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                {r.color ? (
                  <span className="text-[11px] text-neutral-400">Couleur : <span className="text-neutral-600 font-medium">{r.color}</span></span>
                ) : <span />}
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Achat vérifié
                </span>
              </div>
            </div>
          ))}
            </div>
              </>
            );
          })()}
        </>
      )}
    </section>
  );
}
