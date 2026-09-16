"use client";
import AdminLoading from "@/components/admin/AdminLoading";
import { useEffect, useState, useCallback } from "react";

type CartItem = { name: string; quantity: number; price: number; size?: string };
type AbandonedCart = {
  id: string;
  phone: string | null;
  name: string | null;
  email: string | null;
  items: CartItem[];
  total: number;
  reminded: boolean;
  updated_at: string;
  created_at: string;
};

const WaIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.126 1.527 5.862L.057 23.885l6.162-1.616A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.366l-.359-.213-3.72.976.993-3.628-.234-.373A9.818 9.818 0 1112 21.818z"/>
  </svg>
);

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `Il y a ${Math.floor(h / 24)}j`;
  if (h > 0) return `Il y a ${h}h`;
  return `Il y a ${m}min`;
}

function buildWaReminder(cart: AbandonedCart): string {
  const name = cart.name ?? "cher(e) client(e)";
  const itemsList = cart.items.map((i) => `• ${i.name}${i.size ? ` (${i.size})` : ""} x${i.quantity}`).join("\n");
  return `https://wa.me/${(cart.phone ?? "").replace(/\s+/g, "").replace(/^0/, "212")}?text=${encodeURIComponent(
    `Bonjour ${name} ! 👋\n\nVous avez laissé des articles dans votre panier chez *L'ecomax* :\n\n${itemsList}\n\n💰 Total : *${cart.total} MAD*\n\n🛒 Finalisez votre commande ici :\nhttps://lecomax.com/panier\n\nL'équipe *L'ecomax* 🛍`
  )}`;
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "reminded">("all");
  const [search, setSearch] = useState("");
  const [apiError, setApiError] = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/abandoned-carts", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossible de charger les paniers abandonnés.");
      setCarts(Array.isArray(data) ? data : []);
    } catch (error) {
      setCarts([]);
      setApiError(error instanceof Error ? error.message : "Impossible de charger les paniers abandonnés.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markReminded(id: string) {
    try {
      const response = await fetch(`/api/abandoned-carts/${id}`, { method: "PATCH" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Mise à jour impossible.");
      setCarts((prev) => prev.map((c) => c.id === id ? { ...c, reminded: true } : c));
      showToast("Marqué comme contacté ✓");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Mise à jour impossible.", false);
    }
  }

  async function deleteCart(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/abandoned-carts?id=${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Suppression impossible.");
      setCarts((prev) => prev.filter((c) => c.id !== id));
      showToast("Supprimé ✓");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Suppression impossible.", false);
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = carts.filter((c) => {
    if (filter === "pending" && c.reminded) return false;
    if (filter === "reminded" && !c.reminded) return false;
    const q = search.toLowerCase();
    return !q || (c.name ?? "").toLowerCase().includes(q) || (c.phone ?? "").includes(q) || (c.email ?? "").toLowerCase().includes(q);
  });

  const totalValue = filtered.reduce((s, c) => s + (c.total ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black flex items-center gap-2">
          🛒 Paniers abandonnés
        </h1>
        <p className="text-neutral-500 text-xs mt-0.5">
          Clients ayant commencé une commande sans la finaliser
        </p>
      </div>

      {toast && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${toast.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.msg}
        </div>
      )}

      {apiError && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm">!</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black">Connexion aux paniers impossible</p>
            <p className="mt-1 text-[11px] leading-5 text-red-600">{apiError}</p>
          </div>
          <button type="button" onClick={load} className="min-h-9 shrink-0 rounded-xl border border-red-200 bg-white px-3 text-[10px] font-black uppercase tracking-wide hover:bg-red-100">Réessayer</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: carts.length, color: "text-neutral-900" },
          { label: "À contacter", value: carts.filter((c) => !c.reminded).length, color: "text-amber-600" },
          { label: "Valeur", value: `${totalValue.toFixed(0)} MAD`, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-neutral-100 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
          {(["all", "pending", "reminded"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
              {f === "all" ? "Tous" : f === "pending" ? "À contacter" : "Contactés"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, téléphone, email…"
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <AdminLoading />
      ) : apiError ? null : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 text-sm bg-white rounded-2xl border border-neutral-100">
          {carts.length === 0
            ? "Aucun panier abandonné pour l'instant. Les paniers s'enregistrent dès qu'un client remplit son numéro ou email à la caisse."
            : "Aucun résultat."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cart) => (
            <div key={cart.id}
              className={`bg-white rounded-2xl border p-4 ${cart.reminded ? "border-neutral-100 opacity-70" : "border-amber-100 ring-1 ring-amber-50"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-sm">{cart.name ?? "Client inconnu"}</p>
                    {cart.reminded
                      ? <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400">Contacté</span>
                      : <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">À contacter</span>}
                    <span className="text-[10px] text-neutral-400">{timeAgo(cart.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                    {cart.phone && <span>📱 {cart.phone}</span>}
                    {cart.email && <span>✉ {cart.email}</span>}
                    <span className="font-bold text-neutral-800">{cart.total} MAD</span>
                    <span>{cart.items?.length ?? 0} article{(cart.items?.length ?? 0) > 1 ? "s" : ""}</span>
                  </div>
                  {/* Items list */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(cart.items ?? []).slice(0, 4).map((item, i) => (
                      <span key={i} className="text-[10px] bg-neutral-100 px-2 py-1 rounded-lg font-medium text-neutral-700">
                        {item.name}{item.size ? ` · ${item.size}` : ""} ×{item.quantity}
                      </span>
                    ))}
                    {(cart.items?.length ?? 0) > 4 && (
                      <span className="text-[10px] text-neutral-400">+{cart.items.length - 4} autres</span>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {cart.phone && (
                    <a
                      href={buildWaReminder(cart)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markReminded(cart.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1db954] text-white text-xs font-bold rounded-xl transition-colors">
                      <WaIcon />
                      Rappel WhatsApp
                    </a>
                  )}
                  {!cart.reminded && (
                    <button onClick={() => markReminded(cart.id)}
                      className="px-3 py-2 border border-neutral-200 text-xs font-semibold rounded-xl hover:border-neutral-400 transition-colors text-neutral-600">
                      ✓ Marqué contacté
                    </button>
                  )}
                  <button onClick={() => deleteCart(cart.id)} disabled={deletingId === cart.id}
                    className="p-2 border border-neutral-200 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors text-neutral-400 disabled:opacity-50">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
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
