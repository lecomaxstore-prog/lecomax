"use client";
import { useEffect, useState } from "react";
import { brandId, mergeBrands, type ProductBrand } from "@/mobile/src/lib/product-brands";

export default function ProductBrandPicker({ value, onChange, existingNames }: {
  value: string; onChange: (name: string) => void; existingNames: (string | undefined | null)[];
}) {
  const [saved, setSaved] = useState<ProductBrand[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [failedLogo, setFailedLogo] = useState<string>();
  async function load() {
    setError("");
    try {
      const res = await fetch("/api/products/brands", { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger les marques. Réessayez.");
      setSaved(await res.json()); setLoaded(true);
    } catch (e) { setError((e as Error).message); }
  }
  useEffect(() => { void load(); }, []);
  const brands = mergeBrands(saved, [...existingNames, value]);
  const selected = brands.find(b => b.id === brandId(value));
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const body = new FormData(); body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Import du logo impossible.");
      setLogo(data.url);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/products/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, logo }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible.");
      setSaved(current => [...current.filter(b => b.id !== data.id), data]);
      onChange(data.name); setEditing(false);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">
    <label htmlFor="product-brand" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">Marque</label>
    <div className="flex items-center gap-3">
      {selected?.logo && failedLogo !== selected.logo && <img src={selected.logo} alt={selected.name} onError={() => setFailedLogo(selected.logo)} className="h-9 w-20 object-contain" />}
      <select id="product-brand" value={selected?.id || ""} onChange={e => onChange(brands.find(b => b.id === e.target.value)?.name || "")} className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm">
        <option value="">Sans marque</option>
        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </div>
    <p className="text-xs text-neutral-500" aria-live="polite">{selected ? `${selected.name} : cette marque et son logo seront affichés sur le produit dans l’application et sur le site après enregistrement.` : "Choisissez une marque pour afficher son nom et son logo dans l’application et sur le site."}</p>
    <div className="flex flex-wrap gap-4 text-xs font-semibold">
      <button type="button" disabled={busy || !loaded} onClick={() => { setName(""); setLogo(""); setEditing(true); }}>+ Ajouter une marque</button>
      {selected && <button type="button" disabled={busy || !loaded} onClick={() => { setName(selected.name); setLogo(selected.logo.startsWith("/") ? "" : selected.logo); setEditing(true); }}>Modifier le logo</button>}
    </div>
    {editing && <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <label className="block text-xs">Nom de la marque<input aria-label="Nom de la marque" value={name} maxLength={80} disabled={busy} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label>
      <label className="block text-xs">Logo officiel (PNG, JPG ou WebP)<input aria-label="Importer le logo officiel" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => void upload(e.target.files?.[0])} className="mt-2 block w-full text-xs" /></label>
      <label className="block text-xs">Ou adresse HTTPS du logo<input aria-label="Adresse du logo" type="url" value={logo} disabled={busy} onChange={e => setLogo(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label>
      {/^https:\/\//.test(logo) && <img src={logo} alt="Aperçu du logo" className="h-12 w-28 object-contain" />}
      <p className="text-xs text-neutral-500">La marque sera disponible pour tous vos produits. Sans logo, son nom reste affiché.</p>
      <div className="flex gap-4"><button type="button" disabled={busy || !name.trim()} onClick={() => void save()} className="rounded-lg bg-green-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "En cours…" : "Enregistrer et sélectionner"}</button><button type="button" disabled={busy} onClick={() => setEditing(false)} className="text-xs">Annuler</button></div>
    </div>}
    {error && <div role="alert" className="text-xs text-red-700">{error} {!loaded && <button type="button" onClick={() => void load()} className="underline">Réessayer</button>}</div>}
  </div>;
}
