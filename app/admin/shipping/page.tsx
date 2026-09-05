"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type ShippingZone = {
  id: string;
  name: string;
  cities: string[];
  standard_rate: number;
  express_rate: number | null;
  free_threshold: number | null;
  estimated_days: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

const emptyForm = {
  name: "",
  cities: "",
  standard_rate: "",
  express_rate: "",
  free_threshold: "",
  estimated_days: "2-4 jours",
  active: true,
  sort_order: "0",
};

export default function ShippingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const isNew = searchParams.get("new") === "1";

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (m: string, ok = true) => {
    setToast({ msg: m, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/shipping");
    const data = await res.json();
    setZones(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editId) {
      const z = zones.find((x) => x.id === editId);
      if (z) setForm({
        name: z.name,
        cities: z.cities.join(", "),
        standard_rate: String(z.standard_rate),
        express_rate: z.express_rate ? String(z.express_rate) : "",
        free_threshold: z.free_threshold ? String(z.free_threshold) : "",
        estimated_days: z.estimated_days,
        active: z.active,
        sort_order: String(z.sort_order),
      });
    } else if (isNew) {
      setForm({ ...emptyForm });
    }
  }, [editId, isNew, zones]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      name: form.name.trim(),
      cities: form.cities.split(",").map((s) => s.trim()).filter(Boolean),
      standard_rate: parseFloat(form.standard_rate) || 0,
      express_rate: form.express_rate ? parseFloat(form.express_rate) : null,
      free_threshold: form.free_threshold ? parseFloat(form.free_threshold) : null,
      estimated_days: form.estimated_days.trim(),
      active: form.active,
      sort_order: parseInt(form.sort_order) || 0,
    };
    const url = editId ? `/api/shipping/${editId}` : "/api/shipping";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setMsg({ type: "err", text: json.error ?? "Erreur inconnue" });
    else { setMsg({ type: "ok", text: "Zone enregistrée ✓" }); load(); setTimeout(() => router.replace("/admin/shipping"), 1000); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette zone de livraison ?")) return;
    const res = await fetch(`/api/shipping/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("Zone supprimée ✓"); load(); }
    else { const j = await res.json(); showToast(j.error ?? "Erreur", false); }
  }

  async function toggleActive(zone: ShippingZone) {
    const res = await fetch(`/api/shipping/${zone.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !zone.active }),
    });
    if (res.ok) load();
  }

  const showForm = isNew || !!editId;

  if (showForm) return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.replace("/admin/shipping")} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-black">{editId ? "Modifier la zone" : "Nouvelle zone de livraison"}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Configurez les tarifs et villes couvertes</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Informations générales</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Nom de la zone *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex: Casablanca, Grand Casablanca…"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                Villes couvertes
                <span className="ml-1 text-[10px] text-neutral-400 font-normal normal-case">Séparées par des virgules — vide = toutes les villes</span>
              </label>
              <textarea value={form.cities} onChange={(e) => setForm({ ...form, cities: e.target.value })}
                rows={2} placeholder="Casablanca, Mohammedia, Bouskoura…"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Délai estimé</label>
              <input value={form.estimated_days} onChange={(e) => setForm({ ...form, estimated_days: e.target.value })}
                placeholder="2-4 jours"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Ordre d'affichage</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all" />
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tarification</h2>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
            <input
              type="checkbox"
              checked={Number(form.standard_rate) === 0}
              onChange={(event) => setForm({ ...form, standard_rate: event.target.checked ? "0" : "40" })}
              className="mt-0.5 h-4 w-4 rounded border-emerald-300 accent-emerald-600"
            />
            <span>
              <span className="block text-sm font-black text-emerald-900">Livraison toujours gratuite dans cette zone</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-emerald-700">S'applique uniquement aux villes listées ci-dessus, quel que soit le montant du panier.</span>
            </span>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Tarif standard *</label>
              <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                <input required type="number" step="0.01" min="0" value={form.standard_rate}
                  onChange={(e) => setForm({ ...form, standard_rate: e.target.value })}
                  className="flex-1 pl-4 py-3 text-sm focus:outline-none bg-transparent w-0" />
                <span className="pr-3 text-xs text-neutral-400 font-semibold">MAD</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Tarif express</label>
              <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                <input type="number" step="0.01" min="0" value={form.express_rate}
                  onChange={(e) => setForm({ ...form, express_rate: e.target.value })}
                  placeholder="—"
                  className="flex-1 pl-4 py-3 text-sm focus:outline-none bg-transparent w-0" />
                <span className="pr-3 text-xs text-neutral-400 font-semibold">MAD</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Livraison gratuite à partir de</label>
              <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-black bg-neutral-50 focus-within:bg-white transition-all">
                <input type="number" step="0.01" min="0" value={form.free_threshold}
                  onChange={(e) => setForm({ ...form, free_threshold: e.target.value })}
                  placeholder="—"
                  className="flex-1 pl-4 py-3 text-sm focus:outline-none bg-transparent w-0" />
                <span className="pr-3 text-xs text-neutral-400 font-semibold">MAD</span>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
            <div onClick={() => setForm({ ...form, active: !form.active })}
              className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.active ? "bg-black" : "bg-neutral-200"}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.active ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-sm font-medium">Zone active</span>
          </label>
        </div>

        {msg && (
          <div className={`text-sm px-4 py-3 rounded-xl ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button type="submit" disabled={saving}
            className="flex-1 bg-black text-white font-bold py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</> : "Enregistrer"}
          </button>
          <button type="button" onClick={() => router.replace("/admin/shipping")}
            className="px-6 py-3 border border-neutral-200 rounded-xl text-sm font-medium hover:border-black transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.ok ? "bg-black text-white" : "bg-red-600 text-white"}`}>
          {toast.ok ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> : "✕"}
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Livraison</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Zones de livraison et tarifs pour le Maroc</p>
        </div>
        <button onClick={() => router.push("/admin/shipping?new=1")}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 sm:w-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle zone
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-neutral-100 p-4">
          <p className="text-2xl font-black">{zones.filter(z => z.active).length}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Zones actives</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 p-4">
          <p className="text-2xl font-black">{zones.some(z => z.active) ? `${Math.min(...zones.filter(z => z.active).map(z => z.standard_rate))} MAD` : "—"}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Tarif minimum</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 p-4">
          <p className="text-2xl font-black">{zones.filter(z => z.free_threshold && z.active).length}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Zones avec livraison gratuite</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
          <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
              <path d="M5 12l7-7 7 7"/><path d="M12 5v14"/>
            </svg>
          </div>
          <p className="text-neutral-500 text-sm">Aucune zone configurée</p>
          <button onClick={() => router.push("/admin/shipping?new=1")} className="mt-3 text-sm font-bold text-black underline underline-offset-2">
            Créer la première zone
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {zones.map((zone) => (
            <div key={zone.id} className={`rounded-xl border bg-white p-4 transition-all sm:p-5 ${zone.active ? "border-neutral-200" : "border-neutral-100 opacity-60"}`}>
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${zone.active ? "bg-emerald-50" : "bg-neutral-100"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={zone.active ? "#10b981" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm">{zone.name}</h3>
                    {!zone.active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400">Inactive</span>}
                  </div>
                  <p className="text-xs text-neutral-500 mb-2">
                    {zone.cities.length > 0 ? zone.cities.join(", ") : "Toutes les villes non couvertes par d'autres zones"}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-xs text-neutral-600">Standard: <strong>{zone.standard_rate} MAD</strong></span>
                    </div>
                    {zone.express_rate && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className="text-xs text-neutral-600">Express: <strong>{zone.express_rate} MAD</strong></span>
                      </div>
                    )}
                    {zone.free_threshold && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs text-neutral-600">Gratuit dès <strong>{zone.free_threshold} MAD</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span className="text-xs text-neutral-500">{zone.estimated_days}</span>
                    </div>
                  </div>
                </div>

                <div className="flex w-full items-center justify-end gap-2 border-t border-neutral-100 pt-3 sm:w-auto sm:border-0 sm:pt-0 shrink-0">
                  <button onClick={() => toggleActive(zone)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${zone.active ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                    {zone.active ? "Désactiver" : "Activer"}
                  </button>
                  <button onClick={() => router.push(`/admin/shipping?id=${zone.id}`)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500 hover:text-black">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(zone.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-red-600">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <p className="text-xs font-bold text-blue-700 mb-1">Comment fonctionnent les zones ?</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Lors du checkout, la ville du client détermine la zone applicable. Si la ville ne correspond à aucune zone, la zone &quot;Reste du Maroc&quot; (ordre le plus élevé) est utilisée. La livraison gratuite s'applique si le panier dépasse le seuil configuré.
          </p>
        </div>
      </div>
    </div>
  );
}
