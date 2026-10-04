"use client";
import ResponsiveTable from "@/components/admin/ResponsiveTable";
import { useEffect, useState, useCallback } from "react";

type Coupon = {
  id: string; code: string; type: "percent" | "fixed"; value: number;
  min_order: number | null; max_uses: number | null; used_count: number;
  expires_at: string | null; active: boolean; created_at: string;
};

const emptyForm: { code: string; type: "percent" | "fixed"; value: string; min_order: string; max_uses: string; expires_at: string } = { code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" };

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/coupons");
    const data = await res.json();
    setCoupons(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code || generateCode(),
        type: form.type,
        value: parseFloat(form.value),
        min_order: form.min_order ? parseFloat(form.min_order) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: data.error ?? "Erreur" });
    else { setMsg({ type: "ok", text: "Code créé ✓" }); setForm({ ...emptyForm }); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function toggleActive(c: Coupon) {
    await fetch(`/api/coupons/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce code promo ?")) return;
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    load();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="w-full min-w-0 max-w-4xl pb-4">
      <div className="mb-6">
        <h1 className="text-xl font-black">Codes promo</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Créez et gérez vos codes de réduction</p>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-4">
        {[
          { label: "Total codes", value: coupons.length },
          { label: "Actifs", value: coupons.filter((c) => c.active).length },
          { label: "Utilisations", value: coupons.reduce((a, c) => a + c.used_count, 0) },
        ].map((s) => (
          <div key={s.label} className="min-w-0 rounded-2xl border border-neutral-100 bg-white px-3 py-4 sm:p-5">
            <p className="break-words text-2xl font-black tabular-nums">{s.value}</p>
            <p className="mt-1 text-[10px] leading-4 text-neutral-500 sm:text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      <div className="mb-5 min-w-0 rounded-2xl border border-neutral-100 bg-white p-4 sm:p-6">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Créer un code</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="coupon-code" className="mb-1.5 block text-xs font-semibold leading-5 text-neutral-600">Code</label>
              <div className="admin-mobile-toolbar flex min-w-0 gap-2">
                <input id="coupon-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Généré auto"
                  className="min-h-12 min-w-0 w-full flex-1 border border-neutral-200 rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all uppercase" />
                <button type="button" onClick={() => setForm({ ...form, code: generateCode() })}
                  aria-label="Generate promo code" className="min-h-12 min-w-12 shrink-0 flex items-center justify-center px-3 py-2.5 border border-neutral-200 rounded-xl text-neutral-400 hover:text-black hover:border-neutral-400 transition-colors text-xs" title="Générer un code">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="coupon-type" className="mb-1.5 block text-xs font-semibold leading-5 text-neutral-600">Type</label>
              <select id="coupon-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })}
                className="min-h-12 min-w-0 max-w-full w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all">
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (MAD)</option>
              </select>
            </div>
            <div>
              <label htmlFor="coupon-value" className="mb-1.5 block text-xs font-semibold leading-5 text-neutral-600">
                Valeur {form.type === "percent" ? "(%)" : "(MAD)"} *
              </label>
              <input type="number" min="0" step="0.01" required id="coupon-value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percent" ? "ex: 15" : "ex: 50"}
                className="min-h-12 min-w-0 max-w-full w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" inputMode="decimal" />
            </div>
            <div>
              <label htmlFor="coupon-min_order" className="mb-1.5 block text-xs font-semibold leading-5 text-neutral-600">Commande min. (MAD)</label>
              <input type="number" min="0" id="coupon-min_order" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                placeholder="Pas de minimum"
                className="min-h-12 min-w-0 max-w-full w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" inputMode="decimal" />
            </div>
            <div>
              <label htmlFor="coupon-max_uses" className="mb-1.5 block text-xs font-semibold leading-5 text-neutral-600">Max utilisations</label>
              <input type="number" min="1" id="coupon-max_uses" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Illimité"
                className="min-h-12 min-w-0 max-w-full w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" inputMode="decimal" />
            </div>
            <div>
              <label htmlFor="coupon-expires_at" className="mb-1.5 block text-xs font-semibold leading-5 text-neutral-600">Expiration</label>
              <input type="date" id="coupon-expires_at" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="min-h-12 min-w-0 max-w-full w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center">
            <button type="submit" disabled={saving}
              className="min-h-12 w-full bg-black text-white px-6 py-3 sm:w-auto rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-neutral-800 transition-colors">
              {saving ? "…" : "Créer le code"}
            </button>
            {msg && <p role="status" className={`text-xs font-semibold ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}
          </div>
        </form>
      </div>

      {/* Coupons list */}
      <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Codes existants</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-400">Chargement…</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-neutral-600">Aucun code promo</p>
            <p className="text-xs text-neutral-400 mt-1">Créez votre premier code ci-dessus</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <ResponsiveTable className="w-full text-sm min-w-0 lg:min-w-[680px]">
            <thead>
              <tr className="border-b border-neutral-100 text-[11px] text-neutral-400 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">Code</th>
                <th className="px-5 py-3 text-left font-semibold">Réduction</th>
                <th className="px-5 py-3 text-left font-semibold">Min. commande</th>
                <th className="px-5 py-3 text-left font-semibold">Utilisations</th>
                <th className="px-5 py-3 text-left font-semibold">Expiration</th>
                <th className="px-5 py-3 text-center font-semibold">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                const exhausted = c.max_uses !== null && c.used_count >= c.max_uses;
                return (
                  <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-neutral-100 px-2 py-0.5 rounded">{c.code}</span>
                        <button onClick={() => copyCode(c.code)} className="text-neutral-300 hover:text-black transition-colors" title="Copier">
                          {copied === c.code
                            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          }
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-bold">{c.type === "percent" ? `${c.value}%` : `${c.value} MAD`}</td>
                    <td className="px-5 py-3 text-neutral-500">{c.min_order ? `${c.min_order} MAD` : <span className="text-neutral-300">—</span>}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${exhausted ? "text-red-500" : "text-neutral-600"}`}>
                        {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-neutral-500">
                      {c.expires_at
                        ? <span className={expired ? "text-red-500 font-semibold" : ""}>{new Date(c.expires_at).toLocaleDateString("fr-FR")}</span>
                        : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggleActive(c)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${c.active && !expired && !exhausted ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>
                        {c.active && !expired && !exhausted ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(c.id)} className="text-neutral-300 hover:text-red-500 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ResponsiveTable>
          </div>
        )}
      </div>
    </div>
  );
}
