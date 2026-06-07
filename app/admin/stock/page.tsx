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
    else { showToast("Stock mis à jour ✓"); await load(); }
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
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <p className="text-xs text-red-400 uppercase tracking-wide font-semibold mb-1">Rupture de stock</p>
          <p className="text-3xl font-black text-red-600">{outOfStock.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4">
          <p className="text-xs text-orange-400 uppercase tracking-wide font-semibold mb-1">Stock faible (≤ {threshold})</p>
          <p className="text-3xl font-black text-orange-600">{lowStock.length}</p>
        </div>
        <div className="bg-white border border-neutral-100 rounded-2xl px-5 py-4">
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
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Produit</th>
                <th className="text-center px-4 py-3">Stock actuel</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3">Nouveau stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {allLow.map((p) => (
                <tr key={p.id} className={p.stock === 0 ? "bg-red-50/50" : "hover:bg-neutral-50"}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.name} className="w-9 h-9 object-cover rounded-lg bg-neutral-100 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-neutral-400 text-xs">{p.price} MAD</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      p.stock === 0
                        ? "bg-red-100 text-red-600"
                        : p.stock <= 3
                        ? "bg-orange-100 text-orange-600"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {p.stock === 0 ? "Épuisé" : `${p.stock} unités`}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-neutral-500 text-xs capitalize">{p.category}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      placeholder={String(p.stock)}
                      value={stockInputs[p.id] ?? ""}
                      onChange={(e) => setStockInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-24 border border-neutral-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-black"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => updateStock(p.id)}
                      disabled={updating === p.id || !stockInputs[p.id]}
                      className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40"
                    >
                      {updating === p.id ? "…" : "Mettre à jour"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-right">
        <Link href="/admin/products" className="text-sm text-neutral-400 hover:text-black underline">
          Gérer tous les produits →
        </Link>
      </div>

      {/* All products stock table */}
      <div className="mt-8">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Tous les produits</h2>
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Produit</th>
                <th className="text-center px-4 py-3">Stock actuel</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3">Nouveau stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {products.map((p) => (
                <tr key={p.id} className={`${p.stock === 0 ? "bg-red-50/40" : p.stock <= threshold ? "bg-orange-50/40" : "hover:bg-neutral-50"} transition-colors`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.name} className="w-9 h-9 object-cover rounded-lg bg-neutral-100 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-neutral-400 text-xs">{p.price} MAD</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                      p.stock === 0
                        ? "bg-red-100 text-red-600"
                        : p.stock <= threshold
                        ? "bg-orange-100 text-orange-600"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {p.stock === 0 ? "Épuisé" : `${p.stock}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-neutral-500 text-xs capitalize">{p.category}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      placeholder={String(p.stock)}
                      value={stockInputs[p.id] ?? ""}
                      onChange={(e) => setStockInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && stockInputs[p.id] && updateStock(p.id)}
                      className="w-24 border border-neutral-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-black"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => updateStock(p.id)}
                      disabled={updating === p.id || !stockInputs[p.id]}
                      className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40"
                    >
                      {updating === p.id ? "…" : "Enregistrer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
