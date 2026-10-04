"use client";
import AdminLoading from "@/components/admin/AdminLoading";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type PendingChange = {
  id: string;
  staff_email: string;
  staff_name: string | null;
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id: string | null;
  description: string;
  payload: Record<string, unknown> | null;
  preview_image: string | null;
  api_endpoint: string | null;
  api_method: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function initials(name: string | null, email: string) {
  const src = name || email;
  return src.split(/[\s@]/)[0]?.[0]?.toUpperCase() ?? "?";
}

function avatarColor(email: string) {
  const colors = [
    "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444",
    "#10b981", "#f97316", "#ec4899", "#06b6d4",
  ];
  let hash = 0;
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

const ENTITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  product:      { label: "Produit",      color: "#f59e0b", bg: "rgba(245,158,11,.1)"  },
  banner:       { label: "Bannière",     color: "#8b5cf6", bg: "rgba(139,92,246,.1)"  },
  announcement: { label: "Annonce",      color: "#ef4444", bg: "rgba(239,68,68,.1)"   },
  promotion:    { label: "Promotion",    color: "#10b981", bg: "rgba(16,185,129,.1)"  },
  coupon:       { label: "Code promo",   color: "#3b82f6", bg: "rgba(59,130,246,.1)"  },
  page:         { label: "Page",         color: "#6b7280", bg: "rgba(107,114,128,.1)" },
  category:     { label: "Catégorie",    color: "#f97316", bg: "rgba(249,115,22,.1)"  },
  newsletter:   { label: "Newsletter",   color: "#ec4899", bg: "rgba(236,72,153,.1)"  },
  other:        { label: "Autre",        color: "#6b7280", bg: "rgba(107,114,128,.1)" },
};

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  create: { label: "Créer",     color: "#22c55e", bg: "rgba(34,197,94,.1)"  },
  update: { label: "Modifier",  color: "#3b82f6", bg: "rgba(59,130,246,.1)" },
  delete: { label: "Supprimer", color: "#ef4444", bg: "rgba(239,68,68,.1)"  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Detail sub-components ────────────────────────────────────────────────────

function ProductDetail({ payload }: { payload: Record<string, unknown> }) {
  const p = payload as {
    name?: string; price?: number; original_price?: number;
    category?: string; description?: string;
    images?: string[]; colors?: string[]; sizes?: string[];
    stock?: number; brand?: string; tags?: string[];
    featured?: boolean; active?: boolean;
  };

  const images: string[] = Array.isArray(p.images) ? p.images : [];

  return (
    <div className="space-y-5">
      {/* Images */}
      {images.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Photos</p>
          <div className="flex gap-2 flex-wrap">
            {images.map((src, i) => (
              <img key={i} src={src} alt={`img-${i}`}
                className="w-20 h-20 rounded-2xl object-cover border border-neutral-100" loading="lazy" decoding="async" />
            ))}
          </div>
        </div>
      )}

      {/* Core info */}
      <div className="grid grid-cols-2 gap-3">
        {p.name && (
          <div className="col-span-2 bg-neutral-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Nom du produit</p>
            <p className="text-sm font-black text-neutral-900">{p.name}</p>
          </div>
        )}
        {p.price !== undefined && (
          <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-0.5">Prix</p>
            <p className="text-lg font-black text-green-700">{p.price} MAD</p>
          </div>
        )}
        {p.original_price !== undefined && (
          <div className="bg-neutral-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Ancien prix</p>
            <p className="text-lg font-black text-neutral-400 line-through">{p.original_price} MAD</p>
          </div>
        )}
        {p.category && (
          <div className="bg-neutral-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Catégorie</p>
            <p className="text-sm font-bold text-neutral-900 capitalize">{p.category}</p>
          </div>
        )}
        {p.stock !== undefined && (
          <div className="bg-neutral-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Stock</p>
            <p className="text-sm font-bold text-neutral-900">{p.stock} unités</p>
          </div>
        )}
        {p.brand && (
          <div className="bg-neutral-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Marque</p>
            <p className="text-sm font-bold text-neutral-900">{p.brand}</p>
          </div>
        )}
      </div>

      {/* Colors */}
      {Array.isArray(p.colors) && p.colors.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Couleurs</p>
          <div className="flex gap-2 flex-wrap">
            {p.colors.map((c: string) => (
              <span key={c} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-bold">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {Array.isArray(p.sizes) && p.sizes.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Tailles</p>
          <div className="flex gap-2 flex-wrap">
            {p.sizes.map((s: string) => (
              <span key={s} className="w-10 h-10 flex items-center justify-center bg-neutral-100 text-neutral-700 rounded-xl text-xs font-black">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {p.description && (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Description</p>
          <div className="bg-neutral-50 rounded-2xl px-4 py-3">
            <p className="text-sm text-neutral-700 leading-relaxed">{p.description}</p>
          </div>
        </div>
      )}

      {/* Tags */}
      {Array.isArray(p.tags) && p.tags.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Tags</p>
          <div className="flex gap-1.5 flex-wrap">
            {p.tags.map((t: string) => (
              <span key={t} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold">#{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Flags */}
      <div className="flex gap-2">
        {p.featured !== undefined && (
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${p.featured ? "bg-amber-50 text-amber-700" : "bg-neutral-100 text-neutral-400"}`}>
            {p.featured ? "⭐ Mis en avant" : "Non mis en avant"}
          </span>
        )}
        {p.active !== undefined && (
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${p.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {p.active ? "✓ Actif" : "Inactif"}
          </span>
        )}
      </div>
    </div>
  );
}

function GenericDetail({ payload }: { payload: Record<string, unknown> }) {
  const SKIP = new Set(["id", "created_at", "updated_at"]);
  const entries = Object.entries(payload).filter(([k]) => !SKIP.has(k));

  return (
    <div>
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Détails</p>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, val]) => (
          <div key={key} className="bg-neutral-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">
              {key.replace(/_/g, " ")}
            </p>
            <p className="text-sm font-semibold text-neutral-800 break-words">
              {val === null || val === undefined
                ? <span className="text-neutral-300 italic">—</span>
                : typeof val === "boolean"
                ? (val ? "Oui" : "Non")
                : Array.isArray(val)
                ? val.join(", ")
                : String(val)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [reviewerEmail, setReviewerEmail] = useState("");

  // Rejection modal
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Approve in-progress tracker
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Expanded payload viewer
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"details" | "code">("details");
  const detailChange = changes.find(c => c.id === expandedId) ?? null;

  // Get current user email for reviewer attribution
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setReviewerEmail(user.email);
    });
  }, []);

  const fetchChanges = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/approvals?status=${tab}`);
    if (res.ok) setChanges(await res.json());
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchChanges(); }, [fetchChanges]);

  // Counts for tab badges
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  useEffect(() => {
    fetch("/api/admin/approvals?status=all")
      .then(r => r.json())
      .then((all: PendingChange[]) => {
        setCounts({
          pending:  all.filter(c => c.status === "pending").length,
          approved: all.filter(c => c.status === "approved").length,
          rejected: all.filter(c => c.status === "rejected").length,
        });
      });
  }, [changes]);

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approve", reviewer_email: reviewerEmail }),
      });
      if (res.ok) {
        await fetchChanges();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erreur lors de l'approbation");
      }
    } finally {
      setApprovingId(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejectLoading(true);
    try {
      const res = await fetch(`/api/admin/approvals/${rejectTarget}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "reject",
          reviewer_email: reviewerEmail,
          rejection_reason: rejectReason.trim(),
        }),
      });
      if (res.ok) {
        setRejectTarget(null);
        setRejectReason("");
        await fetchChanges();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erreur lors du rejet");
      }
    } finally {
      setRejectLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer définitivement ce changement ?")) return;
    await fetch(`/api/admin/approvals/${id}`, { method: "DELETE" });
    await fetchChanges();
  }

  const TABS = [
    { key: "pending",  label: "En attente",  count: counts.pending  },
    { key: "approved", label: "Approuvés",   count: counts.approved },
    { key: "rejected", label: "Rejetés",     count: counts.rejected },
    { key: "all",      label: "Tout",        count: counts.pending + counts.approved + counts.rejected },
  ] as const;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="admin-mobile-heading flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-neutral-900">Approbations</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Examinez et approuvez les modifications proposées par votre équipe
          </p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-bold text-amber-700">
              {counts.pending} en attente
            </span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <div className="text-2xl mb-1">⏳</div>
          <p className="text-2xl font-black text-neutral-900">{counts.pending}</p>
          <p className="text-xs text-neutral-400 font-medium">En attente</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <div className="text-2xl mb-1">✅</div>
          <p className="text-2xl font-black text-neutral-900">{counts.approved}</p>
          <p className="text-xs text-neutral-400 font-medium">Approuvés</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <div className="text-2xl mb-1">❌</div>
          <p className="text-2xl font-black text-neutral-900">{counts.rejected}</p>
          <p className="text-xs text-neutral-400 font-medium">Rejetés</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-mobile-tabs flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl mb-5 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-neutral-100 text-neutral-600" : "bg-neutral-200 text-neutral-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <AdminLoading />
      ) : changes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-100 p-16 text-center">
          <div className="text-5xl mb-4">
            {tab === "pending" ? "🎉" : tab === "approved" ? "✅" : "📋"}
          </div>
          <p className="font-bold text-neutral-900 mb-1">
            {tab === "pending"
              ? "Aucun changement en attente"
              : tab === "approved"
              ? "Aucun changement approuvé"
              : tab === "rejected"
              ? "Aucun changement rejeté"
              : "Aucun changement"}
          </p>
          <p className="text-sm text-neutral-400">
            {tab === "pending"
              ? "Votre équipe n'a soumis aucune modification pour l'instant."
              : "L'historique apparaîtra ici."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map(change => {
            const entity = ENTITY_LABELS[change.entity_type] ?? ENTITY_LABELS.other;
            const action = ACTION_LABELS[change.action] ?? ACTION_LABELS.create;
            const isExpanded = expandedId === change.id;

            return (
              <div
                key={change.id}
                className="bg-white rounded-3xl border border-neutral-100 overflow-hidden hover:border-neutral-200 transition-colors"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Staff avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                      style={{ background: avatarColor(change.staff_email) }}
                    >
                      {initials(change.staff_name, change.staff_email)}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {/* Action badge */}
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ color: action.color, background: action.bg }}
                        >
                          {action.label}
                        </span>
                        {/* Entity type badge */}
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ color: entity.color, background: entity.bg }}
                        >
                          {entity.label}
                        </span>
                        {/* Status badge */}
                        {change.status === "approved" && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
                            Approuvé
                          </span>
                        )}
                        {change.status === "rejected" && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-wide">
                            Rejeté
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-neutral-900 mb-0.5">
                        {change.description}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>{change.staff_name || change.staff_email}</span>
                        <span>·</span>
                        <span>{formatDate(change.created_at)}</span>
                        {change.reviewed_by && (
                          <>
                            <span>·</span>
                            <span>
                              {change.status === "approved" ? "Approuvé" : "Rejeté"} par{" "}
                              {change.reviewed_by.split("@")[0]}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Rejection reason */}
                      {change.rejection_reason && (
                        <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                          <p className="text-xs text-red-600">
                            <span className="font-bold">Raison du rejet :</span>{" "}
                            {change.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Preview image */}
                    {change.preview_image && (
                      <div className="flex-shrink-0">
                        <img
                          src={change.preview_image}
                          alt="preview"
                          className="w-16 h-16 rounded-xl object-cover border border-neutral-100" loading="lazy" decoding="async"
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {change.payload && (
                        <button
                          onClick={() => { setExpandedId(isExpanded ? null : change.id); setDrawerTab("details"); }}
                          className="p-2 rounded-xl text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                          title="Voir les détails"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                          </svg>
                        </button>
                      )}

                      {change.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(change.id)}
                            disabled={!!approvingId}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            {approvingId === change.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                            Approuver
                          </button>
                          <button
                            onClick={() => { setRejectTarget(change.id); setRejectReason(""); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Rejeter
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(change.id)}
                        className="p-2 rounded-xl text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* No inline expansion anymore — details open in the side drawer */}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Drawer ─────────────────────────────────────────────── */}
      {detailChange && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setExpandedId(null)}
          />

          {/* Slide-in panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-[520px] z-50 bg-white shadow-2xl flex flex-col"
               style={{ animation: "slideIn 260ms cubic-bezier(0.34,1.1,0.64,1)" }}>
            <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                     style={{ background: avatarColor(detailChange.staff_email) }}>
                  {initials(detailChange.staff_name, detailChange.staff_email)}
                </div>
                <div>
                  <p className="font-black text-neutral-900 text-sm leading-none">{detailChange.description}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {detailChange.staff_name || detailChange.staff_email} · {formatDate(detailChange.created_at)}
                  </p>
                </div>
              </div>
              <button onClick={() => setExpandedId(null)}
                className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-100 shrink-0">
              {(() => {
                const entity = ENTITY_LABELS[detailChange.entity_type] ?? ENTITY_LABELS.other;
                const action = ACTION_LABELS[detailChange.action] ?? ACTION_LABELS.create;
                return (
                  <>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide"
                          style={{ color: action.color, background: action.bg }}>{action.label}</span>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide"
                          style={{ color: entity.color, background: entity.bg }}>{entity.label}</span>
                    {detailChange.status === "approved" && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">Approuvé</span>
                    )}
                    {detailChange.status === "rejected" && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-600 uppercase tracking-wide">Rejeté</span>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Tab bar */}
            <div className="admin-mobile-actions flex items-center gap-1 px-6 py-3 border-b border-neutral-100 shrink-0">
              <button
                onClick={() => setDrawerTab("details")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  drawerTab === "details" ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                Détails
              </button>
              <button
                onClick={() => setDrawerTab("code")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  drawerTab === "code" ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
                Code
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {drawerTab === "code" ? (
                <div className="space-y-4">
                  {/* API call */}
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Requête API</p>
                    <div className="flex items-center gap-2 bg-neutral-950 rounded-2xl px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        detailChange.api_method === "POST" ? "bg-green-500/20 text-green-400" :
                        detailChange.api_method === "PUT" || detailChange.api_method === "PATCH" ? "bg-blue-500/20 text-blue-400" :
                        detailChange.api_method === "DELETE" ? "bg-red-500/20 text-red-400" : "bg-neutral-700 text-neutral-300"
                      }`}>{detailChange.api_method ?? "POST"}</span>
                      <code className="text-green-400 text-[12px] font-mono">{detailChange.api_endpoint ?? "/api/products"}</code>
                    </div>
                  </div>
                  {/* Payload */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Payload JSON</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(detailChange.payload, null, 2));
                        }}
                        className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-200 font-bold transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                        Copier
                      </button>
                    </div>
                    <div className="bg-neutral-950 rounded-2xl p-4 overflow-x-auto">
                      <pre className="text-[11.5px] text-neutral-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                        {JSON.stringify(detailChange.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : detailChange.payload ? (
                detailChange.entity_type === "product"
                  ? <ProductDetail payload={detailChange.payload} />
                  : <GenericDetail payload={detailChange.payload} />
              ) : (
                <p className="text-sm text-neutral-400 text-center py-12">Aucun détail disponible.</p>
              )}
            </div>

            {/* Footer action buttons */}
            {detailChange.status === "pending" && (
              <div className="admin-mobile-actions shrink-0 px-6 py-4 border-t border-neutral-100 flex gap-3">
                <button
                  onClick={async () => { await handleApprove(detailChange.id); setExpandedId(null); }}
                  disabled={!!approvingId}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {approvingId === detailChange.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  Approuver
                </button>
                <button
                  onClick={() => { setRejectTarget(detailChange.id); setRejectReason(""); setExpandedId(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold text-sm transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Rejeter
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Rejection modal */}
      {rejectTarget && (
        <div className="admin-dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <div>
                <h3 className="font-black text-neutral-900">Rejeter le changement</h3>
                <p className="text-xs text-neutral-400">Donnez une raison à votre équipe</p>
              </div>
            </div>

            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Ex. : Le prix est incorrect, veuillez vérifier la marge..."
              rows={3}
              className="w-full border border-neutral-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-black transition-colors mb-4"
              autoFocus
            />

            <div className="admin-mobile-actions flex gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                className="flex-1 py-2.5 border border-neutral-200 rounded-2xl text-sm font-bold hover:bg-neutral-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || rejectLoading}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold transition-colors disabled:opacity-40"
              >
                {rejectLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  "Confirmer le rejet"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
