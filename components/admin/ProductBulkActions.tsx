"use client";
import { useRef, useState } from 'react';
import { BULK_LIMIT, type BulkAction } from '@/lib/product-bulk';
import { useAdminConfirmation } from './ConfirmDialog';

const labels: Record<BulkAction, string> = { publish: 'Publier', unpublish: 'Masquer', archive: 'Archiver', category: 'Changer de catégorie', promotion: 'Appliquer une réduction (%)', stock: 'Ajuster le stock (+ / −)', delete: 'Supprimer définitivement' };
export default function ProductBulkActions({ products, selected, onSelection, onComplete }: {
  products: { id: string; name: string }[]; selected: Set<string>; onSelection: (ids: Set<string>) => void; onComplete: () => Promise<void>;
}) {
  const [action, setAction] = useState<BulkAction>('unpublish');
  const [value, setValue] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [report, setReport] = useState('');
  const { confirm, dialog } = useAdminConfirmation();
  async function apply() {
    if (working.current || !selected.size || selected.size > BULK_LIMIT) return;
    working.current = true; setBusy(true);
    const ids = [...selected];
    try {
      const names = ids.map(id => products.find(product => product.id === id)?.name ?? id).join('\n');
      if (!await confirm(`${labels[action]} — ${ids.length} produit(s)\n${names}\n${value ? `Valeur : ${value}. ` : ''}${action === 'stock' ? `Couleur : ${color || 'aucune'}, taille : ${size || 'aucune'}. ` : ''}${action === 'delete' ? 'Cette suppression est irréversible.' : action === 'archive' ? 'Les produits seront masqués et marqués comme archivés. Publier permet de les restaurer.' : ''}`)) return;
      setReport('Traitement en cours…');
      const response = await fetch('/api/admin/products/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, action, confirmation: `${action}:${ids.length}`, value: action === 'category' ? value : Number(value), color: color.trim(), size: size.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Action impossible.');
      const results: { id: string; ok: boolean; error?: string }[] = data.results;
      const failed = results.filter(result => !result.ok);
      setReport(`${results.length - failed.length} réussi(s), ${failed.length} échec(s).${failed.map(result => `\n${products.find(product => product.id === result.id)?.name ?? result.id} : ${result.error}`).join('')}`);
      onSelection(new Set(failed.map(result => result.id)));
      await onComplete();
    } catch (error) {
      onSelection(new Set());
      setReport(`${error instanceof Error ? error.message : 'Erreur réseau.'} Actualisez et vérifiez les produits avant toute nouvelle tentative : certaines modifications peuvent avoir été enregistrées.`);
    } finally { working.current = false; setBusy(false); }
  }
  return <section aria-label="Actions groupées" className="mb-4 min-w-0 rounded-2xl border bg-white p-3">
    {dialog}
    <fieldset disabled={busy} className="flex min-w-0 flex-wrap items-end gap-3 disabled:opacity-60">
      <button type="button" className="min-h-11 rounded-xl border px-3 text-sm" onClick={() => onSelection(new Set(products.slice(0, BULK_LIMIT).map(product => product.id)))}>Sélectionner les {Math.min(products.length, BULK_LIMIT)} premiers</button>
      <button type="button" className="min-h-11 px-2 text-sm" onClick={() => onSelection(new Set())}>Effacer ({selected.size})</button>
      <label className="min-w-0 text-xs">Action<select aria-label="Action groupée" value={action} onChange={event => { setAction(event.target.value as BulkAction); setValue(''); }} className="mt-1 block min-h-11 w-full max-w-full rounded-xl border px-2 text-sm">{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {action === 'category' && <label className="text-xs">Catégorie<select value={value} onChange={event => setValue(event.target.value)} className="mt-1 block min-h-11 rounded-xl border px-2"><option value="">Choisir</option>{['homme','femme','chaussures','accessoires'].map(category => <option key={category}>{category}</option>)}</select></label>}
      {(action === 'promotion' || action === 'stock') && <label className="text-xs">{action === 'stock' ? 'Quantité à ajouter / retirer' : 'Pourcentage'}<input type="number" value={value} onChange={event => setValue(event.target.value)} className="mt-1 block min-h-11 w-36 rounded-xl border px-2" /></label>}
      {action === 'stock' && <><label className="text-xs">Couleur exacte<input value={color} onChange={event => setColor(event.target.value)} className="mt-1 block min-h-11 w-36 rounded-xl border px-2" /></label><label className="text-xs">Taille exacte<input value={size} onChange={event => setSize(event.target.value)} placeholder="44.5" className="mt-1 block min-h-11 w-28 rounded-xl border px-2" /></label></>}
      <button type="button" disabled={!selected.size || selected.size > BULK_LIMIT || (['stock','promotion','category'].includes(action) && !value)} onClick={apply} className="min-h-11 rounded-xl bg-black px-4 text-sm font-bold text-white disabled:opacity-40">{busy ? 'Traitement…' : `Appliquer (${selected.size})`}</button>
    </fieldset>
    <p className="mt-2 text-xs text-neutral-500">Maximum {BULK_LIMIT} produits. La réduction utilise le prix de référence, y compris pour chaque couleur. Les stocks exigent une variante existante.</p>
    {report && <p role="status" className="mt-3 whitespace-pre-line break-words text-sm">{report}</p>}
  </section>;
}
