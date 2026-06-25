"use client";
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
      <div className="flex items-center justify-between mb-6">
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
      <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl mb-5 w-fit">
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
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
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
                          className="w-16 h-16 rounded-xl object-cover border border-neutral-100"
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {change.payload && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : change.id)}
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

                  {/* Expanded payload viewer */}
                  {isExpanded && change.payload && (
                    <div className="mt-4 bg-neutral-950 rounded-2xl p-4 overflow-x-auto">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                        Détails du changement
                      </p>
                      <pre className="text-[11px] text-neutral-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                        {JSON.stringify(change.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
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

            <div className="flex gap-3">
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
