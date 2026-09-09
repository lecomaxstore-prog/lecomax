import { readFileSync, writeFileSync } from 'node:fs';
let path='app/admin/settings/page.tsx', text=readFileSync(path,'utf8');
text=text.replace('import { useEffect,', 'import { STORE_SETTING_DEFAULTS, validateStoreSettings } from "@/lib/store-settings";\nimport { useEffect,');
// Preserve non-business defaults; central business fields always come last.
text=text.replace('  og_image: "/ecomax-hero-banner.jpg.png?v=2",','  og_image: "/ecomax-hero-banner.jpg.png?v=2",\n  ...STORE_SETTING_DEFAULTS,');
text=text.replace('    e?.preventDefault();','    e?.preventDefault();\n    if (saving) return;\n    const invalid = validateStoreSettings(settings);\n    if (invalid) { setMsg({ type: "err", text: invalid }); return; }');
const anchor='          {activeTab === "shipping" && (';
const block=`          {activeTab === "shipping" && (
            <Section title="Contrôle central de la boutique" icon={<span>⚙</span>}>
              <p className="mb-4 text-sm text-neutral-500">Appliqué au site, à l’application et aux nouvelles commandes. Les commandes existantes conservent leurs montants.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ["checkout_maximum_order", "Commande maximum (MAD, 0 = sans limite)"],
                  ["low_stock_threshold", "Seuil de stock faible (unités)"],
                  ["tax_rate", "Taux de taxe (%)"],
                ] as const).map(([key,label]) => <label key={key} className="text-sm font-semibold">{label}<input type="number" min="0" step={key === "low_stock_threshold" ? "1" : "0.01"} value={settings[key]} onChange={event => setSettings(current => ({ ...current, [key]: event.target.value }))} className="mt-2 block w-full rounded-xl border border-neutral-200 px-3 py-2" /></label>)}
                {([
                  ["free_shipping_enabled", "Activer la livraison gratuite"],
                  ["preorder_enabled", "Autoriser les précommandes configurées sur les produits"],
                  ["tax_enabled", "Activer le calcul des taxes"],
                  ["tax_included", "Les prix incluent déjà les taxes"],
                ] as const).map(([key,label]) => <label key={key} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings[key] === "true"} onChange={event => setSettings(current => ({ ...current, [key]: String(event.target.checked) }))} />{label}</label>)}
              </div>
              <button type="button" disabled={saving} onClick={() => handleSave()} className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer les règles"}</button>
            </Section>
          )}

`;
if(!text.includes(anchor)) throw new Error('Shipping tab not found');
text=text.replace(anchor,block+anchor);
writeFileSync(path,text);
