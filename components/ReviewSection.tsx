"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ratingFor } from "@/components/ProductCard";
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

  // Auto-fill email + name from last order stored in localStorage
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
      // silently ignore network errors, let server-side validate
    } finally {
      setEmailChecking(false);
    }
  };

  useEffect(() => {
    fetch(`/api/reviews?slug=${productSlug}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
      })
      .finally(() => setLoading(false));
  }, [productSlug]);

  // Review-request emails deep-link here and prefill the verified order email.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("review") !== "1") return;
    const requestedEmail = params.get("email")?.trim() ?? "";
    setShowForm(true);
    if (requestedEmail) {
      setEmail(requestedEmail);
      void checkEmail(requestedEmail);
    }
  // Run once for this product; checkEmail intentionally uses current state setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

  // Real average — only from actual DB reviews
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
    if (emailStatus === "not_ordered") {
      setFormError("Seuls les clients ayant commandé ce produit peuvent laisser un avis.");
      return;
    }
    if (emailStatus === "not_delivered") {
      setFormError("Votre commande est en cours de livraison. Vous pourrez laisser un avis dès réception.");
      return;
    }
    if (emailStatus === "already_reviewed") {
      setFormError("Vous avez déjà laissé un avis pour ce produit.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    // Upload photo if selected
    let uploadedImageUrls: string[] = [];
    if (photoFiles.length) {
      setPhotoUploading(true);
      const uploads = await Promise.all(photoFiles.map(async (photoFile) => {
        const fd = new FormData();
        fd.append("photo", photoFile);
        fd.append("slug", productSlug);
        const response = await fetch("/api/reviews/upload-photo", { method: "POST", body: fd });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Erreur lors de l'envoi d'une photo.");
        return data.url as string;
      })).catch(() => null);
      setPhotoUploading(false);
      if (!uploads) {
        setFormError("Une photo n'a pas pu être envoyée. Veuillez réessayer.");
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="h-display text-2xl md:text-3xl">Avis clients</h2>
          <div className="w-8 h-[3px] bg-black mt-2" />
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 px-4 py-3">
            <div>
              <p className="text-3xl font-black leading-none">{avg.toFixed(1)}</p>
              <StarRow rating={Math.round(avg)} size={10} />
              <p className="text-[11px] text-neutral-400 mt-1">{displayCount} avis</p>
            </div>
          </div>
        )}
      </div>

      {/* Leave a review button */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 inline-flex items-center gap-2.5 bg-black text-white px-6 py-3.5 text-[12px] font-black uppercase tracking-wide hover:bg-neutral-800 active:scale-[0.97] transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Écrire un avis client
        </button>
      )}

      {/* Review form */}
      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="mb-10 border border-neutral-200 p-6 bg-neutral-50">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-5">Votre avis</p>

          {/* Email verification notice */}
          <div className="flex gap-3 items-start bg-neutral-950 text-white px-4 py-4 mb-6 rounded-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div>
              <p className="text-[12px] font-black text-white mb-0.5">Avis acheteurs vérifiés uniquement</p>
              <p className="text-[11px] text-white/50 leading-relaxed">Entrez l&apos;email utilisé lors de votre commande. Votre avis ne sera accepté qu&apos;une fois votre commande livrée.</p>
            </div>
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
                    emailStatus === "not_delivered" ? "border-amber-400 focus:border-amber-400" :
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
              {emailStatus === "not_delivered" && (
                <p className="text-amber-600 text-[11px] mt-1 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  Commande en cours de livraison — vous pourrez laisser un avis dès réception.
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

          {/* Photo upload */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-2">
              Photo du produit <span className="text-neutral-400 font-normal">(optionnel)</span>
            </label>
            {/* hidden input: gallery */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
            {/* hidden input: camera */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) addPhotos([file]);
                e.target.value = "";
              }}
            />

            {photoFiles.length < MAX_REVIEW_PHOTOS && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPhotoOptions((v) => !v)}
                  className="flex items-center gap-2.5 border border-dashed border-neutral-300 px-4 py-3 text-[12px] text-neutral-500 hover:border-black hover:text-black transition-colors w-full justify-center"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Ajouter des photos <span className="text-neutral-400">({photoFiles.length}/{MAX_REVIEW_PHOTOS})</span>
                </button>
                {showPhotoOptions && (
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-neutral-200 shadow-lg w-full">
                    <button
                      type="button"
                      onClick={() => { setShowPhotoOptions(false); photoInputRef.current?.click(); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-[12px] text-neutral-700 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      Importer depuis la galerie
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPhotoOptions(false); cameraInputRef.current?.click(); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-[12px] text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                      Prendre une photo
                    </button>
                  </div>
                )}
              </div>
            )}
            {photoPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {photoPreviews.map((preview, index) => (
                  <div key={preview} className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={`Aperçu ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(index)} aria-label={`Supprimer la photo ${index + 1}`} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-[10px] text-neutral-400">Jusqu&apos;à 5 photos · JPG, PNG ou WebP · 5 Mo maximum par photo</p>
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
              disabled={submitting || photoUploading || emailChecking || emailStatus === "not_ordered" || emailStatus === "already_reviewed" || emailStatus === "not_delivered"}
              className="bg-black text-white px-6 py-3 text-[12px] font-black uppercase tracking-wide hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {photoUploading ? "Envoi de la photo..." : submitting ? "Publication..." : emailChecking ? "Vérification..." : "Publier l'avis"}
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
        <div className="mb-8 border border-emerald-200 bg-emerald-50 px-6 py-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p className="text-[14px] font-black text-emerald-800">Merci pour votre avis !</p>
          </div>
          <p className="text-[12px] text-emerald-700 leading-relaxed pl-11">
            Votre avis a été publié avec succès. Il aide d&apos;autres clients à faire leur choix — nous vous en remercions sincèrement.
          </p>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-72 flex-none bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 border border-dashed border-neutral-200 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <p className="font-black text-neutral-700 text-[14px]">Pas encore d&apos;avis</p>
          <p className="text-neutral-400 text-[13px] max-w-xs leading-relaxed">
            Soyez le premier à partager votre expérience avec ce produit. Votre avis aide d&apos;autres clients à choisir.
          </p>
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

                <div ref={scrollRef} className="flex gap-5 overflow-x-auto no-scrollbar pb-5 scroll-smooth">
                  {filtered.map((r) => (
            <article key={r.id} className="flex w-[310px] flex-none flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.045)] transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_14px_36px_rgba(15,23,42,.08)] md:w-[360px]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[13px] font-black text-white ring-4 ring-neutral-100">
                    {r.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold leading-tight">{r.author_name}</p>
                    {r.city && <p className="mt-0.5 text-[11px] text-neutral-400">{r.city}</p>}
                  </div>
                </div>
                <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-neutral-400">{formatDate(r.created_at)}</span>
              </div>

              <div>
                <StarRow rating={r.rating} size={13} />
                {r.title && <p className="mt-2 text-[14px] font-extrabold leading-snug">{r.title}</p>}
              </div>

              <p className="flex-1 text-[13px] leading-6 text-neutral-600">{r.body}</p>

              {/* Customer photo gallery */}
              {reviewPhotos(r).length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 overflow-hidden rounded-xl">
                  {reviewPhotos(r).map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setPhotoViewer({ photos: reviewPhotos(r), index, author: r.author_name })}
                      aria-label={`Agrandir la photo ${index + 1} de ${r.author_name}`}
                      className={`group/photo relative block cursor-zoom-in overflow-hidden bg-neutral-100 ${reviewPhotos(r).length === 1 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt={`Photo ${index + 1} de ${r.author_name}`} className="h-full w-full object-cover transition duration-300 group-hover/photo:scale-105" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover/photo:bg-black/15 group-hover/photo:opacity-100">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/></svg>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {r.admin_reply && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 mt-1">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Réponse de L&apos;ecomax
                  </p>
                  <p className="text-[12px] text-neutral-700 leading-relaxed">{r.admin_reply}</p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                {r.color ? (
                  <span className="text-[11px] text-neutral-400">Couleur : <span className="text-neutral-600 font-medium">{r.color}</span></span>
                ) : <span />}
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200/70">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9" /></svg>
                  Achat vérifié
                </span>
              </div>
            </article>
          ))}
            </div>
              </>
            );
          })()}
        </>
      )}
      {mounted && photoViewer && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photos de l'avis de ${photoViewer.author}`}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPhotoViewer(null);
          }}
        >
          <div className="absolute left-4 top-4 z-20 rounded-full bg-white/10 px-3 py-2 text-[11px] font-semibold text-white/80 backdrop-blur sm:left-6 sm:top-6">
            {photoViewer.index + 1} / {photoViewer.photos.length}
          </div>
          <button
            type="button"
            onClick={() => setPhotoViewer(null)}
            aria-label="Fermer la photo"
            className="fixed right-4 top-4 z-[2147483647] flex h-12 items-center gap-2 rounded-full border-2 border-black bg-white px-4 text-[12px] font-black uppercase tracking-[.06em] text-black shadow-[0_8px_30px_rgba(0,0,0,.45)] transition hover:scale-105 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:right-7 sm:top-7"
          >
            <span>Fermer</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>

          {photoViewer.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPhotoViewer((current) => current && ({ ...current, index: (current.index - 1 + current.photos.length) % current.photos.length }))}
                aria-label="Photo précédente"
                className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-white hover:text-black sm:left-6"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                type="button"
                onClick={() => setPhotoViewer((current) => current && ({ ...current, index: (current.index + 1) % current.photos.length }))}
                aria-label="Photo suivante"
                className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-white hover:text-black sm:right-6"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoViewer.photos[photoViewer.index]}
            alt={`Photo ${photoViewer.index + 1} de ${photoViewer.author}`}
            className="max-h-[88vh] max-w-[92vw] select-none rounded-lg object-contain shadow-2xl"
            draggable={false}
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-white/60 sm:bottom-6">
            Échap ou cliquez à l&apos;extérieur pour fermer
          </p>
        </div>,
        document.body
      )}
    </section>
  );
}
