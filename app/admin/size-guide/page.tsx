"use client";
import { useEffect, useState, useCallback } from "react";

type ClothingRow = { label: string; fr: string; poitrine: string; taille: string };
type ShoeRow    = { eu: string; us: string; uk: string; cm: string };

const CLOTHING_DEFAULTS: ClothingRow[] = [
  { label: "XS",  fr: "34-36", poitrine: "82-86",   taille: "62-66" },
  { label: "S",   fr: "36-38", poitrine: "86-90",   taille: "66-70" },
  { label: "M",   fr: "38-40", poitrine: "90-94",   taille: "70-74" },
  { label: "L",   fr: "40-42", poitrine: "94-98",   taille: "74-78" },
  { label: "XL",  fr: "42-44", poitrine: "98-104",  taille: "78-84" },
  { label: "XXL", fr: "44-46", poitrine: "104-110", taille: "84-90" },
];

const SHOES_DEFAULTS: ShoeRow[] = [
  { eu: "38", us: "6",   uk: "5",   cm: "24.0" },
  { eu: "39", us: "6.5", uk: "5.5", cm: "24.5" },
  { eu: "40", us: "7",   uk: "6",   cm: "25.0" },
  { eu: "41", us: "7.5", uk: "6.5", cm: "25.5" },
  { eu: "42", us: "8.5", uk: "7.5", cm: "26.5" },
  { eu: "43", us: "9.5", uk: "8.5", cm: "27.5" },
  { eu: "44", us: "10",  uk: "9",   cm: "28.0" },
  { eu: "45", us: "11",  uk: "10",  cm: "29.0" },
  { eu: "46", us: "12",  uk: "11",  cm: "30.0" },
];

function TableEditor<T extends Record<string, string>>({
  title,
  rows,
  columns,
  onChange,
  emptyRow,
}: {
  title: string;
  rows: T[];
  columns: { key: keyof T; label: string }[];
  onChange: (rows: T[]) => void;
  emptyRow: T;
}) {
  const update = (i: number, key: keyof T, val: string) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [key]: val } : r));
    onChange(next);
  };
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));
  const add    = () => onChange([...rows, { ...emptyRow }]);
  const moveUp   = (i: number) => { if (i === 0) return; const a = [...rows]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; onChange(a); };
  const moveDown = (i: number) => { if (i === rows.length - 1) return; const a = [...rows]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; onChange(a); };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <h2 className="font-bold text-sm">{title}</h2>
        <button type="button" onClick={add}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-black text-white rounded-lg hover:bg-neutral-800">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter ligne
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              {columns.map((c) => (
                <th key={String(c.key)} className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">{c.label}</th>
              ))}
              <th className="px-4 py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-2">
                    <input
                      value={row[c.key] as string}
                      onChange={(e) => update(i, c.key, e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-black bg-neutral-50 focus:bg-white transition-all"
                    />
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => moveUp(i)} title="Monter"
                      className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-black transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                    <button type="button" onClick={() => moveDown(i)} title="Descendre"
                      className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-black transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <button type="button" onClick={() => remove(i)} title="Supprimer"
                      className="p-1.5 hover:bg-red-50 rounded-lg text-neutral-400 hover:text-red-600 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-6 py-8 text-center text-sm text-neutral-400">Aucune ligne. Cliquez sur &quot;Ajouter ligne&quot;.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SizeGuidePage() {
  const [clothing, setClothing] = useState<ClothingRow[]>(CLOTHING_DEFAULTS);
  const [shoes, setShoes]       = useState<ShoeRow[]>(SHOES_DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/size-guide");
    if (res.ok) {
      const data = await res.json();
      setClothing(data.clothing ?? CLOTHING_DEFAULTS);
      setShoes(data.shoes ?? SHOES_DEFAULTS);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/size-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clothing, shoes }),
    });
    setSaving(false);
    if (res.ok) setMsg({ type: "ok", text: "Guide des tailles sauvegardé ✓" });
    else setMsg({ type: "err", text: "Erreur lors de la sauvegarde" });
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Guide des tailles</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Gérez les tableaux de tailles affichés sur le site</p>
        </div>
        <a href="/guide-des-tailles" target="_blank"
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 border border-neutral-200 px-3 py-2 rounded-xl hover:border-black hover:text-black transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Voir sur le site
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex gap-3 items-start text-sm text-blue-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <div>
              Ces tableaux s&apos;affichent dans la modale &quot;Guide des tailles&quot; sur les pages produits ainsi que sur la page <strong>/guide-des-tailles</strong>.
              Toute modification est visible immédiatement sur le site.
            </div>
          </div>

          {/* Clothing sizes */}
          <TableEditor<ClothingRow>
            title="Vêtements — Tableau des tailles"
            rows={clothing}
            columns={[
              { key: "label",    label: "Taille (ex: S, M…)" },
              { key: "fr",       label: "FR (ex: 36-38)" },
              { key: "poitrine", label: "Poitrine (cm)" },
              { key: "taille",   label: "Tour de taille (cm)" },
            ]}
            onChange={setClothing}
            emptyRow={{ label: "", fr: "", poitrine: "", taille: "" }}
          />

          {/* Shoes sizes */}
          <TableEditor<ShoeRow>
            title="Chaussures — Tableau des pointures"
            rows={shoes}
            columns={[
              { key: "eu", label: "EU" },
              { key: "us", label: "US" },
              { key: "uk", label: "UK" },
              { key: "cm", label: "CM" },
            ]}
            onChange={setShoes}
            emptyRow={{ eu: "", us: "", uk: "", cm: "" }}
          />

          {/* Save */}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="bg-black text-white font-bold px-6 py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sauvegarde…</>
                : "Sauvegarder les changements"}
            </button>
            <button type="button" onClick={load}
              className="text-sm text-neutral-500 hover:text-black transition-colors underline underline-offset-2">
              Réinitialiser
            </button>
            {msg && (
              <span className={`text-sm font-semibold ${msg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>
                {msg.text}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
