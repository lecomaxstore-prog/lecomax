"use client";
import AdminLoading from "@/components/admin/AdminLoading";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Promotion } from "@/lib/supabase";

const emptyForm = { label: "", product_ids: "", discount_percent: "", active: true, expires_at: "" };

export default function PromotionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/promotions");
    const data = await res.json();
    setPromotions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const p = promotions.find((x) => x.id === editId);
      if (p) setForm({ label: p.label, product_ids: p.product_ids?.join(", ") ?? "", discount_percent: p.discount_percent ? String(p.discount_percent) : "", active: p.active, expires_at: p.expires_at ? p.expires_at.split("T")[0] : "" });
    } else if (isNew) setForm({ ...emptyForm });
  }, [editId, isNew, promotions]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      label: form.label.trim(),
      product_ids: form.product_ids.split(",").map((s) => s.trim()).filter(Boolean),
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
      active: form.active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const url = editId ? `/api/promotions/${editId}` : "/api/promotions";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
    else { setMsg({ type: "ok", text: "Promotion enregistrée ✓" }); load(); setTimeout(() => router.replace("/admin/promotions"), 1000); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette promotion ?")) return;
    await fetch(`/api/promotions/${id}`, { method: "DELETE" });
    load();
  }

  const showForm = isNew || !!editId;

  if (showForm) return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.replace("/admin/promotions")} className="p-2 hover:bg-neutral-100 rounded-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></button>
        <h1 className="text-xl font-black">{editId ? "Modifier la promotion" : "Nouvelle promotion"}</h1>
      </div>
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
        <Field label="Nom de la promotion *" value={form.label} onChange={(v) => setForm({ ...form, label: v })} placeholder="Soldes été -20%" required />
        <Field label="Réduction (%)" type="number" value={form.discount_percent} onChange={(v) => setForm({ ...form, discount_percent: v })} placeholder="20" />
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Slugs produits concernés (séparés par virgule)</label>
          <input value={form.product_ids} onChange={(e) => setForm({ ...form, product_ids: e.target.value })} placeholder="veste-sport, bomber-noir, hoodie-gris"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
          <p className="text-xs text-neutral-400 mt-1">Laisser vide pour appliquer à tous les produits.</p>
        </div>
        <Field label="Date d'expiration" type="date" value={form.expires_at} onChange={(v) => setForm({ ...form, expires_at: v })} />
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <button type="button" role="switch" aria-checked={form.active} aria-label="Actif" onClick={() => setForm({ ...form, active: !form.active })} className={`w-10 h-6 rounded-full transition-colors ${form.active ? "bg-black" : "bg-neutral-200"} relative`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-1"}`} />
          </button>
          <span className="text-sm font-medium">Promotion active</span>
        </label>
        {msg && <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer"}
          </button>
          <button type="button" onClick={() => router.replace("/admin/promotions")} className="px-6 py-3 border border-neutral-200 rounded-xl text-sm font-medium hover:border-black transition-colors">Annuler</button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">Promotions</h1>
        <button onClick={() => router.replace("/admin/promotions?new=1")} className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-800 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter
        </button>
      </div>
      {loading ? <AdminLoading /> : (
        <div className="grid gap-3">
          {promotions.length === 0 ? <div className="bg-white rounded-2xl border border-neutral-100 px-6 py-16 text-center text-neutral-400 text-sm">Aucune promotion.</div> :
            promotions.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-neutral-100 flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-black text-sm">{p.discount_percent ? `-${p.discount_percent}%` : "🏷"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{p.label}</p>
                  <p className="text-xs text-neutral-400">
                    {p.product_ids?.length ? `${p.product_ids.length} produit(s)` : "Tous les produits"}
                    {p.expires_at ? ` · Expire: ${new Date(p.expires_at).toLocaleDateString("fr-FR")}` : ""}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>{p.active ? "Active" : "Inactive"}</span>
                <div className="flex gap-1">
                  <button onClick={() => router.replace(`/admin/promotions?id=${p.id}`)} className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black" />
    </div>
  );
}
