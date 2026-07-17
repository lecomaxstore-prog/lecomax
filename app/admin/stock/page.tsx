"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/supabase";

type Filter = "alerts" | "out" | "low" | "all";

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [threshold, setThreshold] = useState(5);
  const [thresholdReady, setThresholdReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [colorInputs, setColorInputs] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const saved = Number(localStorage.getItem("admin-stock-threshold"));
    if (Number.isInteger(saved) && saved >= 1 && saved <= 100) setThreshold(saved);
    setThresholdReady(true);
  }, []);

  useEffect(() => {
    if (!thresholdReady) return;
    localStorage.setItem("admin-stock-threshold", String(threshold));
  }, [threshold, thresholdReady]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 3200);
  };

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products?sort=stock", { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger le stock.");
      const data = await res.json();
      setProducts(Array.isArray(data) ? [...data].sort((a, b) => Number(a.stock) - Number(b.stock)) : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function updateProduct(id: string, body: Record<string, unknown>, success: string, key = id) {
    setUpdating(key);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof result.error === "string" ? result.error : "Modification refusée");
      showToast(success);
      await load(false);
      return true;
    } catch (updateError) {
      showToast(updateError instanceof Error ? updateError.message : "Impossible d’enregistrer le stock.", false);
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function updateStock(id: string) {
    const value = Number(stockInputs[id]);
    if (!Number.isInteger(value) || value < 0) {
      showToast("Saisissez une quantité entière égale ou supérieure à zéro.", false);
      return;
    }
    if (await updateProduct(id, { stock: value }, "Stock total mis à jour")) {
      setStockInputs((current) => { const next = { ...current }; delete next[id]; return next; });
    }
  }

  async function updateColorStock(id: string, product: Product) {
    const inputs = colorInputs[id] ?? {};
    const merged: Record<string, number> = { ...(product.color_stock ?? {}) };
    let changed = false;
    for (const [color, rawValue] of Object.entries(inputs)) {
      if (rawValue === "") continue;
      const value = Number(rawValue);
      if (!Number.isInteger(value) || value < 0) {
        showToast(`Quantité invalide pour ${color}.`, false);
        return;
      }
      merged[color] = value;
      changed = true;
    }
    if (!changed) return;
    if (await updateProduct(id, { color_stock: merged }, "Stocks des variantes mis à jour", `${id}_color`)) {
      setColorInputs((current) => { const next = { ...current }; delete next[id]; return next; });
    }
  }

  const activeProducts = useMemo(() => products.filter((product) => product.active), [products]);
  const outCount = activeProducts.filter((product) => Number(product.stock) === 0).length;
  const lowCount = activeProducts.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= threshold).length;
  const healthyCount = activeProducts.filter((product) => Number(product.stock) > threshold).length;

  const visibleProducts = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("fr-FR");
    return products.filter((product) => {
      const stock = Number(product.stock);
      const matchesFilter = filter === "all"
        || (product.active && filter === "alerts" && stock <= threshold)
        || (product.active && filter === "out" && stock === 0)
        || (product.active && filter === "low" && stock > 0 && stock <= threshold);
      const matchesSearch = !needle || `${product.name} ${product.category ?? ""} ${product.slug ?? ""}`.toLocaleLowerCase("fr-FR").includes(needle);
      return matchesFilter && matchesSearch;
    });
  }, [filter, products, search, threshold]);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 sm:space-y-6">
      <header className="relative overflow-hidden rounded-[28px] bg-neutral-950 px-5 py-6 text-white shadow-xl sm:px-7 sm:py-7">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#3ecf4c]/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#65df70]"><span className="h-2 w-2 rounded-full bg-[#3ecf4c]" />Inventaire en direct</div>
            <h1 className="text-2xl font-black tracking-[-0.035em] sm:text-3xl">Gestion du stock</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Repérez les ruptures, ajustez les quantités et gérez les variantes depuis un seul espace.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-xs font-bold text-white/60">
              Alerte sous
              <span className="flex items-center gap-2"><input type="number" min={1} max={100} value={threshold} onChange={(event) => setThreshold(Math.min(100, Math.max(1, Number(event.target.value) || 1)))} className="h-9 w-16 rounded-xl border border-white/10 bg-black/30 px-2 text-center text-sm font-black text-white outline-none focus:border-[#3ecf4c]" /><span>unités</span></span>
            </label>
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-black transition hover:bg-[#3ecf4c] disabled:opacity-60">
              <svg className={loading ? "animate-spin" : ""} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/></svg>
              Actualiser
            </button>
          </div>
        </div>
      </header>

      <section aria-label="Résumé du stock" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ruptures" value={outCount} helper="Action urgente" tone="red" active={filter === "out"} onClick={() => setFilter("out")} />
        <StatCard label="Stock faible" value={lowCount} helper={`Entre 1 et ${threshold} unités`} tone="orange" active={filter === "low"} onClick={() => setFilter("low")} />
        <StatCard label="Stock sain" value={healthyCount} helper="Aucune intervention" tone="green" active={false} />
        <StatCard label="Produits actifs" value={activeProducts.length} helper={`${products.length - activeProducts.length} inactif${products.length - activeProducts.length > 1 ? "s" : ""}`} tone="neutral" active={filter === "all"} onClick={() => setFilter("all")} />
      </section>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">Le stock n’a pas pu être chargé.</p><p className="mt-1 text-xs">{error}</p></div><button onClick={() => void load()} className="min-h-11 rounded-xl bg-red-700 px-4 font-bold text-white">Réessayer</button></div>}

      <section className="overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-3 sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-2xl bg-neutral-100 p-1 [scrollbar-width:none]">
              {([{ id: "alerts", label: "À traiter", count: outCount + lowCount }, { id: "out", label: "Ruptures", count: outCount }, { id: "low", label: "Stock faible", count: lowCount }, { id: "all", label: "Tous", count: products.length }] as { id: Filter; label: string; count: number }[]).map((item) => (
                <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-black transition sm:px-4 ${filter === item.id ? "bg-black text-white shadow-sm" : "text-neutral-500 hover:text-black"}`}>{item.label}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${filter === item.id ? "bg-white/15" : "bg-white"}`}>{item.count}</span></button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1 sm:min-w-[280px]"><span className="sr-only">Rechercher un produit</span><svg aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un produit…" className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/5" /></label>
              <Link href="/admin/products" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 px-4 text-xs font-bold text-neutral-600 transition hover:border-black hover:text-black">Catalogue complet</Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4" aria-label="Chargement du stock">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />)}</div>
        ) : visibleProducts.length === 0 ? (
          <div className="px-5 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m22 4-10 10-3-3"/></svg></span><h2 className="mt-4 text-base font-black">{search ? "Aucun produit trouvé" : "Tout est sous contrôle"}</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-neutral-400">{search ? "Modifiez votre recherche ou choisissez un autre filtre." : `Aucun produit ne se trouve sous le seuil de ${threshold} unités.`}</p></div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {visibleProducts.map((product) => <StockRow key={product.id} p={product} stockInputs={stockInputs} setStockInputs={setStockInputs} colorInputs={colorInputs} setColorInputs={setColorInputs} updating={updating} updateStock={updateStock} updateColorStock={updateColorStock} threshold={threshold} />)}
          </div>
        )}
      </section>

      {toast && <div role="status" className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border p-4 text-sm font-bold shadow-2xl lg:bottom-6 ${toast.ok ? "border-emerald-200 bg-emerald-950 text-white" : "border-red-200 bg-red-700 text-white"}`}><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${toast.ok ? "bg-[#3ecf4c]" : "bg-white"}`} />{toast.msg}</div>}
    </div>
  );
}

function StatCard({ label, value, helper, tone, active, onClick }: { label: string; value: number; helper: string; tone: "red" | "orange" | "green" | "neutral"; active: boolean; onClick?: () => void }) {
  const styles = { red: "bg-red-50 text-red-700 border-red-100", orange: "bg-orange-50 text-orange-700 border-orange-100", green: "bg-emerald-50 text-emerald-700 border-emerald-100", neutral: "bg-white text-neutral-950 border-neutral-200" }[tone];
  const content = <><span className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-65">{label}</span><span className="mt-2 block text-3xl font-black tabular-nums tracking-tight">{value}</span><span className="mt-1 block truncate text-[11px] font-semibold opacity-60">{helper}</span></>;
  return onClick ? <button type="button" onClick={onClick} aria-pressed={active} className={`min-w-0 rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c] sm:p-5 ${styles} ${active ? "ring-2 ring-current ring-offset-2" : ""}`}>{content}</button> : <div className={`min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 ${styles}`}>{content}</div>;
}

function StockRow({ p, stockInputs, setStockInputs, colorInputs, setColorInputs, updating, updateStock, updateColorStock, threshold }: { p: Product; stockInputs: Record<string, string>; setStockInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>; colorInputs: Record<string, Record<string, string>>; setColorInputs: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>; updating: string | null; updateStock: (id: string) => void; updateColorStock: (id: string, product: Product) => void; threshold: number }) {
  const stock = Number(p.stock) || 0;
  const isOut = stock === 0;
  const isLow = stock > 0 && stock <= threshold;
  const draft = stockInputs[p.id] ?? "";
  const hasColors = Boolean(p.colors?.length);
  const severity = isOut ? { label: "Épuisé", classes: "bg-red-100 text-red-700" } : isLow ? { label: `${stock} restant${stock > 1 ? "s" : ""}`, classes: "bg-orange-100 text-orange-700" } : { label: `${stock} en stock`, classes: "bg-emerald-100 text-emerald-700" };
  const setDraft = (value: number) => setStockInputs((current) => ({ ...current, [p.id]: String(Math.max(0, Number.isFinite(value) ? value : stock)) }));

  return (
    <article className={`p-4 transition-colors sm:p-5 ${isOut ? "bg-red-50/20" : isLow ? "bg-orange-50/15" : "hover:bg-neutral-50/60"}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 sm:h-14 sm:w-14">{p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-neutral-300"><path d="M3 3h18v18H3z"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="line-clamp-2 text-sm font-black leading-5 text-neutral-950 sm:text-[15px]">{p.name}</h3><p className="mt-1 truncate text-xs font-medium text-neutral-400">{p.price} MAD · {p.category || "Sans catégorie"}{!p.active ? " · Inactif" : ""}</p></div><span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${severity.classes}`}>{severity.label}</span></div>

          <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-neutral-200 bg-white p-1 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-black/5">
              <button type="button" onClick={() => setDraft((draft === "" ? stock : Number(draft)) - 1)} aria-label="Retirer une unité" className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-neutral-500 hover:bg-neutral-100 hover:text-black">−</button>
              <input type="number" min={0} inputMode="numeric" aria-label={`Nouveau stock total pour ${p.name}`} placeholder={String(stock)} value={draft} onChange={(event) => setStockInputs((current) => ({ ...current, [p.id]: event.target.value }))} onKeyDown={(event) => event.key === "Enter" && draft !== "" && updateStock(p.id)} className="h-9 min-w-0 flex-1 bg-transparent px-2 text-center text-sm font-black tabular-nums outline-none" />
              <button type="button" onClick={() => setDraft((draft === "" ? stock : Number(draft)) + 1)} aria-label="Ajouter une unité" className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-neutral-500 hover:bg-neutral-100 hover:text-black">+</button>
            </div>
            <button type="button" onClick={() => updateStock(p.id)} disabled={updating === p.id || draft === "" || Number(draft) === stock} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-4 text-xs font-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400">{updating === p.id && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}Enregistrer</button>
            <Link href={`/admin/products?id=${encodeURIComponent(p.id)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-500 transition hover:border-black hover:text-black">Modifier le produit</Link>
          </div>
        </div>
      </div>

      {hasColors && <details className="group mt-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 sm:ml-[72px]"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-black text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]"><span>Stock par variante <span className="ml-1 font-semibold text-neutral-400">({p.colors!.length} couleurs)</span></span><svg className="transition-transform group-open:rotate-180" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6"/></svg></summary><div className="space-y-3 border-t border-neutral-200 p-3 sm:p-4">{p.colors!.map((color) => { const saved = p.color_stock?.[color] ?? 0; return <label key={color} className="grid grid-cols-[minmax(80px,1fr)_110px] items-center gap-3"><span className="truncate text-xs font-bold text-neutral-600">{color}<span className="ml-2 text-[10px] font-medium text-neutral-400">Actuel : {saved}</span></span><input type="number" min={0} inputMode="numeric" placeholder={String(saved)} value={colorInputs[p.id]?.[color] ?? ""} onChange={(event) => setColorInputs((current) => ({ ...current, [p.id]: { ...current[p.id], [color]: event.target.value } }))} className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-center text-sm font-black outline-none focus:border-black" /></label>; })}<button type="button" onClick={() => updateColorStock(p.id, p)} disabled={updating === `${p.id}_color` || !colorInputs[p.id] || Object.values(colorInputs[p.id] ?? {}).every((value) => value === "")} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 text-xs font-black text-white disabled:opacity-35 sm:w-auto">{updating === `${p.id}_color` ? "Enregistrement…" : "Enregistrer les variantes"}</button></div></details>}
    </article>
  );
}
