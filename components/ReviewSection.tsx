"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "@/lib/use-settings";

type Review = {
  id: string;
  author_name: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  color: string | null;
  created_at: string;
  verified_purchase?: boolean;
  admin_reply?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
};

function reviewPhotos(review: Review) {
  if (Array.isArray(review.image_urls)) return review.image_urls.filter(Boolean);
  if (!review.image_url) return [];
  try {
    const parsed = JSON.parse(review.image_url);
    if (Array.isArray(parsed)) return parsed.filter((value): value is string => typeof value === "string");
  } catch {}
  return [review.image_url];
}

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
  const siteSettings = useSettings();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [colorFilter, setColorFilter] = useState<string>("Tous");
  const [photoViewer, setPhotoViewer] = useState<{ photos: string[]; index: number; author: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!photoViewer) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPhotoViewer(null);
      if (event.key === "ArrowLeft") {
        setPhotoViewer((current) => current && ({ ...current, index: (current.index - 1 + current.photos.length) % current.photos.length }));
      }
      if (event.key === "ArrowRight") {
        setPhotoViewer((current) => current && ({ ...current, index: (current.index + 1) % current.photos.length }));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [photoViewer]);

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

  // Photo upload state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const MAX_REVIEW_PHOTOS = 5;

  const addPhotos = (files: File[]) => {
    const valid = files.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024);
    const selected = valid.slice(0, MAX_REVIEW_PHOTOS - photoFiles.length);
    if (valid.length !== files.length) setFormError("Certaines photos ont été ignorées. Utilisez JPG, PNG ou WebP, 5 Mo maximum.");
    if (selected.length < valid.length) setFormError(`Vous pouvez ajouter jusqu'à ${MAX_REVIEW_PHOTOS} photos.`);
    setPhotoFiles((current) => [...current, ...selected]);
    setPhotoPreviews((current) => [...current, ...selected.map((file) => URL.createObjectURL(file))]);
    setShowPhotoOptions(false);
  };

  const removePhoto = (index: number) => {
    setPhotoPreviews((current) => {
      URL.revokeObjectURL(current[index]);
      return current.filter((_, photoIndex) => photoIndex !== index);
    });
    setPhotoFiles((current) => current.filter((_, photoIndex) => photoIndex !== index));
  };

  // Email order-check state
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "ok" | "not_ordered" | "already_reviewed" | "not_delivered">("idle");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lecomax_last_order");
      if (raw) {
        const order = JSON.parse(raw);
        if (order?.customer?.email) setEmail(order.customer.email);
        if (order?.customer?.prenom || order?.customer?.nom) {
          setName(`${order.customer.prenom ?? ""} ${(order.customer.nom ?? "").charAt(0)}.`.trim());
        }
        if (order?.customer?.ville) setCity(order.customer.ville);
      }
    } catch { /* ignore */ }
  }, []);

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
      // silently ignore
    } finally {
      setEmailChecking(false);
    }
  };

  useEffect(() => {
    fetch(`/api/reviews?slug=${productSlug}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .finally(() => setLoading(false));
  }, [productSlug]);

  const avg = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const displayCount = reviews.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !body.trim()) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    let uploadedImageUrls: string[] = [];
    if (photoFiles.length) {
      setPhotoUploading(true);
      const uploads = await Promise.all(photoFiles.map(async (photoFile) => {
        const fd = new FormData();
        fd.append("photo", photoFile);
        fd.append("slug", productSlug);
        const response = await fetch("/api/reviews/upload-photo", { method: "POST", body: fd });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Erreur d'envoi");
        return data.url as string;
      })).catch(() => null);
      setPhotoUploading(false);
      if (!uploads) {
        setFormError("Une photo n'a pas pu être envoyée.");
        setSubmitting(false);
        return;
      }
      uploadedImageUrls = uploads;
    }

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
        image_url: uploadedImageUrls[0] ?? null,
        image_urls: uploadedImageUrls,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setFormError(data.error ?? "Une erreur est survenue.");
    } else {
      setSubmitted(true);
      fetch(`/api/reviews?slug=${productSlug}`)
        .then((r) => r.json())
        .then((d) => setReviews(d.reviews ?? []));
    }
  };

  if (siteSettings.enable_reviews === "false") return null;

  return (
    <section id="avis" className="mt-16 scroll-mt-28 border-t border-neutral-100 pt-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="h-display text-2xl md:text-3xl">Avis clients</h2>
          <div className="w-8 h-[3px] bg-black mt-2" />
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 px-4 py-3 rounded-2xl">
            <div>
              <p className="text-3xl font-black leading-none">{avg.toFixed(1)}</p>
              <StarRow rating={Math.round(avg)} size={10} />
              <p className="text-[11px] text-neutral-400 mt-1">{displayCount} avis</p>
            </div>
          </div>
        )}
      </div>

      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 inline-flex items-center gap-2.5 bg-black text-white px-6 py-3.5 text-[12px] font-black uppercase tracking-wide rounded-full hover:bg-neutral-800 transition-all shadow-md active:scale-95"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Écrire un avis client
        </button>
      )}

      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="mb-10 border border-neutral-200 p-6 bg-neutral-50 rounded-2xl shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-5">Votre avis</p>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">
                Email de commande <span className="text-red-500">*</span>
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="votre@email.com"
                className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none rounded-lg focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">
                Votre nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Prénom N."
                className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none rounded-lg focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">Ville</label>
            <input
              type="text" value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Casablanca / Sidi Bennour"
              className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none rounded-lg focus:border-black transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-2">Note *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill={s <= (hoverRating || rating) ? "#facc15" : "none"} stroke={s <= (hoverRating || rating) ? "#facc15" : "#d4d4d4"} strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">Titre de l&apos;avis</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Excellent produit !" className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none rounded-lg focus:border-black" />
          </div>

          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-1">Votre avis *</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} placeholder="Partagez votre expérience..." className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-[13px] outline-none rounded-lg focus:border-black resize-none" />
          </div>

          {formError && <p className="text-red-600 text-[12px] mb-4">{formError}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="bg-black text-white px-6 py-3 text-[12px] font-black uppercase tracking-wide rounded-full hover:bg-neutral-800 transition-colors">
              {submitting ? "Publication..." : "Publier l'avis"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-neutral-200 px-6 py-3 text-[12px] font-bold uppercase tracking-wide rounded-full hover:border-black">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-72 flex-none bg-neutral-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 border border-dashed border-neutral-200 text-center rounded-2xl">
          <p className="font-black text-neutral-700 text-[14px]">Pas encore d&apos;avis</p>
          <p className="text-neutral-400 text-[13px] max-w-xs">Soyez le premier à partager votre expérience avec ce produit.</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-5 overflow-x-auto no-scrollbar pb-5 scroll-smooth">
          {reviews.map((r) => {
            const isBodyArabic = /[\u0600-\u06FF]/.test(r.body);
            const isTitleArabic = r.title ? /[\u0600-\u06FF]/.test(r.title) : false;
            
            return (
              <article key={r.id} className="relative flex w-[310px] flex-none flex-col gap-4 rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_20px_45px_rgba(62,207,76,0.12)] md:w-[360px] overflow-hidden">
                {/* Subtle Top Accent Glow */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#3ecf4c] via-emerald-400 to-[#3ecf4c]" />

                {/* Top Bar: Rating & Verified Badge */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1 rounded-full border border-neutral-100">
                    <StarRow rating={r.rating} size={12} />
                    <span className="text-[11px] font-extrabold text-neutral-900">{r.rating.toFixed(1)}</span>
                  </div>
                  {r.verified_purchase === true && <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700 ring-1 ring-inset ring-emerald-200/70">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9" /></svg>
                    Achat vérifié
                  </span>}
                </div>

                {r.title && (
                  <p 
                    dir={isTitleArabic ? "rtl" : "ltr"} 
                    className="text-[15px] font-extrabold leading-snug text-neutral-900"
                  >
                    {r.title}
                  </p>
                )}

                {/* Customer Review Body with Smart RTL Support */}
                <p 
                  dir={isBodyArabic ? "rtl" : "ltr"}
                  className={`flex-1 text-[13px] leading-relaxed ${
                    isBodyArabic ? "bg-neutral-50 p-4 rounded-2xl border border-neutral-100 font-bold text-neutral-900" : "text-neutral-700"
                  }`}
                >
                  {r.body}
                </p>

                {/* Photos */}
                {reviewPhotos(r).length > 0 && (
                  <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl mt-1">
                    {reviewPhotos(r).map((photo, index) => (
                      <button
                        key={`${photo}-${index}`}
                        type="button"
                        onClick={() => setPhotoViewer({ photos: reviewPhotos(r), index, author: r.author_name })}
                        className="group/photo relative block cursor-zoom-in overflow-hidden bg-neutral-100 aspect-square rounded-xl"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt="" className="h-full w-full object-cover transition duration-300 group-hover/photo:scale-105" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Author Profile */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-neutral-950 to-neutral-800 text-[13px] font-black text-white ring-2 ring-emerald-400/40">
                      {r.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold leading-tight text-neutral-900 truncate">{r.author_name}</p>
                      <p className="mt-0.5 text-[10px] text-neutral-400 font-medium">
                        {formatDate(r.created_at)} {r.city ? `· ${r.city}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {mounted && photoViewer && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setPhotoViewer(null)}
        >
          <button
            type="button" onClick={() => setPhotoViewer(null)}
            className="fixed right-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-xs font-black text-black"
          >
            Fermer ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoViewer.photos[photoViewer.index]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>,
        document.body
      )}
    </section>
  );
}
