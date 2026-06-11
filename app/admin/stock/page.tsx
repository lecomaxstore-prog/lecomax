"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/supabase";

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(5);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [colorInputs, setColorInputs] = useState<Record<string, Record<string, string>>>({});

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  async function load() {
    setLoading(true);
    const res = await fetch("/api/products?sort=stock");
    const data = await res.json();
    const sorted = Array.isArray(data) ? [...data].sort((a, b) => a.stock - b.stock) : [];
    setProducts(sorted);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStock(id: string) {
    const val = parseInt(stockInputs[id] ?? "");
    if (isNaN(val) || val < 0) { showToast("Stock invalide", false); return; }
    setUpdating(id);
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: val }),
    });
    if (!res.ok) { const j = await res.json(); showToast("Erreur : " + (j.error ?? "inconnue"), false); }
    else { showToast("Stock total mis à jour ✓"); await load(); }
    setUpdating(null);
  }

  async function updateColorStock(id: string, product: Product) {
    const inputs = colorInputs[id] ?? {};
    const existing: Record<string, number> = product.color_stock ?? {};
    const merged: Record<string, number> = { ...existing };
    let changed = false;
    for (const [color, val] of Object.entries(inputs)) {
      const n = parseInt(val);
      if (!isNaN(n) && n >= 0) { merged[color] = n; changed = true; }
    }
    if (!changed) return;
    setUpdating(id + "_color");
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color_stock: merged }),
    });
    if (!res.ok) { const j = await res.json(); showToast("Erreur : " + (j.error ?? "inconnue"), false); }
    else {
      showToast("Stock couleurs mis à jour ✓");
      setColorInputs((prev) => { const n = { ...prev }; delete n[id]; return n; });
      await load();
    }
    setUpdating(null);
  }

  const lowStock = products.filter((p) => p.stock <= threshold && p.active);
  const outOfStock = products.filter((p) => p.stock === 0 && p.active);
  const allLow = products.filter((p) => p.stock <= threshold);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Alertes Stock</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Produits en stock faible ou épuisé</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500">Seuil :</span>
          <input
            type="number"
            min={1}
            max={50}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-16 border border-neutral-200 rounded-xl px-2 py-1.5 text-sm text-center focus:outline-none focus:border-black"
          />
          <span className="text-neutral-500">unités</span>
        </div>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${
          toast.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <p className="text-xs text-red-400 uppercase tracking-wide font-semibold mb-1">Rupture de stock</p>
          <p className="text-3xl font-black text-red-600">{outOfStock.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4">
          <p className="text-xs text-orange-400 uppercase tracking-wide font-semibold mb-1">Stock faible (≤ {threshold})</p>
          <p className="text-3xl font-black text-orange-600">{lowStock.length}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white border border-neutral-100 rounded-2xl px-5 py-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide font-semibold mb-1">Total produits actifs</p>
          <p className="text-3xl font-black">{products.filter((p) => p.active).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allLow.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-12 text-center">
          <svg className="mx-auto mb-3 text-emerald-500" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p className="font-bold text-emerald-700">Tous les produits ont un stock suffisant !</p>
          <p className="text-sm text-emerald-500 mt-1">Aucun produit en dessous du seuil de {threshold} unités.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden divide-y divide-neutral-50">
          {allLow.map((p) => (
            <StockRow key={p.id} p={p} stockInputs={stockInputs} setStockInputs={setStockInputs} colorInputs={colorInputs} setColorInputs={setColorInputs} updating={updating} updateStock={updateStock} updateColorStock={updateColorStock} threshold={threshold} />
          ))}
        </div>
      )}

      <div className="mt-4 text-right">
        <Link href="/admin/products" className="text-sm text-neutral-400 hover:text-black underline">
          Gérer tous les produits →
        </Link>
      </div>

      {/* All products stock */}
      <div className="mt-8">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Tous les produits</h2>
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden divide-y divide-neutral-50">
          {products.map((p) => (
            <StockRow key={p.id} p={p} stockInputs={stockInputs} setStockInputs={setStockInputs} colorInputs={colorInputs} setColorInputs={setColorInputs} updating={updating} updateStock={updateStock} updateColorStock={updateColorStock} threshold={threshold} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StockRow({
  p, stockInputs, setStockInputs, colorInputs, setColorInputs, updating, updateStock, updateColorStock, threshold,
}: {
  p: Product;
  stockInputs: Record<string, string>;
  setStockInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  colorInputs: Record<string, Record<string, string>>;
  setColorInputs: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  updating: string | null;
  updateStock: (id: string) => void;
  updateColorStock: (id: string, product: Product) => void;
  threshold: number;
}) {
  const stockBadgeCls =
    p.stock === 0
      ? "bg-red-100 text-red-600"
      : p.stock <= threshold
      ? "bg-orange-100 text-orange-600"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className={`px-4 py-3.5 ${
      p.stock === 0 ? "bg-red-50/40" : p.stock <= threshold ? "bg-orange-50/30" : ""
    }`}>
      {/* Top row: image + name + badge */}
      <div className="flex items-center gap-3 mb-3">
        {p.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt={p.name}
            className="w-10 h-10 object-cover rounded-xl bg-neutral-100 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug line-clamp-2">{p.name}</p>
          <p className="text-neutral-400 text-xs mt-0.5 capitalize">{p.price} MAD · {p.category}</p>
        </div>
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${stockBadgeCls}`}>
          {p.stock === 0 ? "Épuisé" : `${p.stock}`}
        </span>
      </div>
      {/* Per-color stock inputs */}
      {p.colors && p.colors.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Stock par couleur</p>
          {p.colors.map((color) => {
            const saved = p.color_stock?.[color] ?? null;
            const inputVal = colorInputs[p.id]?.[color] ?? "";
            return (
              <div key={color} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-600 w-20 shrink-0 truncate">{color}</span>
                <input
                  type="number"
                  min={0}
                  placeholder={saved !== null ? `Actuel: ${saved}` : "Non défini"}
                  value={inputVal}
                  onChange={(e) =>
                    setColorInputs((prev) => ({
                      ...prev,
                      [p.id]: { ...prev[p.id], [color]: e.target.value },
                    }))
                  }
                  className="flex-1 border border-neutral-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-black"
                />
                {saved !== null && (
                  <span className="text-[11px] text-neutral-400 shrink-0">= {saved}</span>
                )}
              </div>
            );
          })}
          <button
            onClick={() => updateColorStock(p.id, p)}
            disabled={updating === p.id + "_color" || !colorInputs[p.id] || Object.values(colorInputs[p.id] ?? {}).every((v) => v === "")}
            className="w-full mt-1 px-4 py-2 bg-neutral-800 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-40"
          >
            {updating === p.id + "_color"
              ? <svg className="animate-spin mx-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0"/></svg>
              : "Enregistrer les stocks couleurs"}
          </button>
        </div>
      )}

      {/* Bottom row: total stock input + button */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          placeholder={`Stock total (actuel: ${p.stock})`}
          value={stockInputs[p.id] ?? ""}
          onChange={(e) => setStockInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && stockInputs[p.id] && updateStock(p.id)}
          className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
        />
        <button
          onClick={() => updateStock(p.id)}
          disabled={updating === p.id || !stockInputs[p.id]}
          className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
        >
          {updating === p.id
            ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0"/></svg>
            : "Stock total"}
        </button>
      </div>
    </div>
  );
}
