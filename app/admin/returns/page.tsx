"use client";
import { useEffect, useState, useCallback } from "react";

type Return = {
  id: string; order_number: string; customer_name: string; customer_email: string;
  product_name: string; reason: string; status: "pending" | "approved" | "rejected" | "completed";
  notes: string | null; created_at: string;
};

const STATUS_LABELS: Record<Return["status"], { label: string; color: string }> = {
  pending:   { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  approved:  { label: "Approuvé",   color: "bg-green-100 text-green-700" },
  rejected:  { label: "Refusé",     color: "bg-red-100 text-red-600" },
  completed: { label: "Traité",     color: "bg-neutral-100 text-neutral-500" },
};
const FILTERS = ["Tous", "En attente", "Approuvé", "Refusé", "Traité"] as const;

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("Tous");
  const [selected, setSelected] = useState<Return | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order_number: "", customer_name: "", customer_email: "", product_name: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/returns");
    const data = await res.json();
    setReturns(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(r: Return, status: Return["status"]) {
    await fetch(`/api/returns/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (selected?.id === r.id) setSelected({ ...r, status });
    load();
  }

  async function saveNotes(r: Return) {
    setSavingNote(true);
    await fetch(`/api/returns/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSavingNote(false);
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setShowForm(false); setForm({ order_number: "", customer_name: "", customer_email: "", product_name: "", reason: "" }); load(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette demande ?")) return;
    await fetch(`/api/returns/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    load();
  }

  const statusFilterMap: Record<typeof FILTERS[number], Return["status"] | null> = {
    "Tous": null, "En attente": "pending", "Approuvé": "approved", "Refusé": "rejected", "Traité": "completed",
  };
  const filtered = returns.filter((r) => {
    const sf = statusFilterMap[filter];
    return !sf || r.status === sf;
  });

  const pending = returns.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-5xl">
      <div className="admin-mobile-heading flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black">Retours</h1>
            {pending > 0 && <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full">{pending} en attente</span>}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Gérez les demandes de retour clients</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {(["pending", "approved", "rejected", "completed"] as const).map((s) => (
          <div key={s} className="bg-white border border-neutral-100 rounded-2xl p-4">
            <p className="text-xl font-black">{returns.filter((r) => r.status === s).length}</p>
            <p className="text-[11px] text-neutral-400 mt-1">{STATUS_LABELS[s].label}</p>
          </div>
        ))}
      </div>

      {/* New return form */}
      {showForm && (
        <div className="bg-white border border-neutral-100 rounded-2xl p-6 mb-5">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Créer une demande manuellement</h2>
          <form onSubmit={handleCreate} className="admin-mobile-fields grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">N° Commande *</label>
              <input required value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Client *</label>
              <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Email client</label>
              <input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" inputMode="email" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Produit *</label>
              <input required value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Motif *</label>
              <textarea required rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Produit défectueux, mauvaise taille, etc."
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all resize-none" />
            </div>
            <div className="admin-mobile-actions col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-neutral-800 transition-colors">
                {saving ? "…" : "Créer"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-black transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-5">
        {/* Left: list */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? "bg-black text-white" : "bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-neutral-400">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-neutral-600">Aucune demande de retour</p>
                {filter === "Tous" && <p className="text-xs text-neutral-400 mt-1">Créez manuellement ou configurez le formulaire de retour</p>}
              </div>
            ) : (
              <div className="divide-y divide-neutral-50">
                {filtered.map((r) => {
                  const s = STATUS_LABELS[r.status];
                  return (
                    <button key={r.id} onClick={() => { setSelected(r); setNotes(r.notes ?? ""); }}
                      className={`w-full text-left px-5 py-4 hover:bg-neutral-50 transition-colors ${selected?.id === r.id ? "bg-neutral-50" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm">#{r.order_number}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{r.customer_name} · {r.product_name}</p>
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">{r.reason}</p>
                        </div>
                        <p className="text-[10px] text-neutral-400 flex-shrink-0">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail */}
        {selected && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-white border border-neutral-100 rounded-2xl p-5 sticky top-24 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm">#{selected.order_number}</p>
                  <p className="text-xs text-neutral-400">{new Date(selected.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-neutral-300 hover:text-black transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Client</p>
                <p className="text-sm font-semibold">{selected.customer_name}</p>
                {selected.customer_email && (
                  <a href={`mailto:${selected.customer_email}`} className="text-xs text-blue-500 hover:underline">{selected.customer_email}</a>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Produit</p>
                <p className="text-sm">{selected.product_name}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Motif</p>
                <p className="text-sm text-neutral-600">{selected.reason}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Notes internes</p>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ajoutez une note…"
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-black bg-neutral-50 focus:bg-white resize-none transition-all" />
                <button onClick={() => saveNotes(selected)} disabled={savingNote}
                  className="mt-1 w-full border border-neutral-200 text-xs font-semibold py-1.5 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50">
                  {savingNote ? "Sauvegarde…" : "Enregistrer la note"}
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Changer le statut</p>
                {(["approved", "rejected", "completed"] as const).filter((s) => s !== selected.status).map((s) => (
                  <button key={s} onClick={() => updateStatus(selected, s)}
                    className={`w-full text-xs font-bold py-2 rounded-xl border transition-colors ${STATUS_LABELS[s].color} border-transparent hover:opacity-80`}>
                    {STATUS_LABELS[s].label}
                  </button>
                ))}
                <button onClick={() => handleDelete(selected.id)}
                  className="w-full text-xs font-semibold text-red-400 hover:text-red-600 py-1 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
