export const pasteFieldLabels = {
  name: "Nom du produit", brand: "Marque", description: "Description", category: "Catégorie",
  price: "Prix (MAD)", original_price: "Ancien prix (MAD)", stock: "Stock", tags: "Tags", weight: "Poids (kg)",
} as const;
export type PastedProduct = Partial<Record<keyof typeof pasteFieldLabels, string>>;
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_*-]/g, " ").replace(/\s+/g, " ").trim();
const aliases: Record<string, keyof PastedProduct> = {
  name: "name", nom: "name", "nom du produit": "name", titre: "name", title: "name", "product name": "name",
  marque: "brand", brand: "brand", description: "description", "description du produit": "description",
  category: "category", categorie: "category", prix: "price", price: "price", "prix (mad)": "price", "prix de vente": "price",
  "ancien prix": "original_price", "ancien prix (mad)": "original_price", "original price": "original_price",
  stock: "stock", quantite: "stock", "quantite en stock": "stock", tags: "tags", "mots cles": "tags", keywords: "tags",
  poids: "weight", weight: "weight", "poids (kg)": "weight",
};

/** Deterministic import: never infer missing facts, prices, currency or inventory. */
export function parseProductPaste(source: string): { fields: PastedProduct; warnings: string[] } {
  if (source.length > 20_000) throw new Error("Le texte dépasse 20 000 caractères.");
  const raw = source.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const values: Record<string, unknown> = {};
  const warnings: string[] = [];
  if (raw.startsWith("{")) {
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw new Error("Le JSON est incomplet ou incorrect. Vérifiez les guillemets et les virgules."); }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Collez un seul objet produit.");
    Object.assign(values, parsed);
  } else {
    let current = "";
    for (const line of raw.split(/\r?\n/)) {
      const clean = line.trim().replace(/^#{1,6}\s+/, "").replace(/^[-*•]\s+/, "").replace(/\*\*/g, "");
      const table = clean.match(/^\|\s*([^|]+)\|\s*(.*?)\s*\|$/);
      const label = table ?? clean.match(/^([^:：]{1,60})[:：]\s*(.*)$/);
      const heading = aliases[normalize(clean)];
      if (label) {
        current = label[1].trim();
        if (Object.hasOwn(values, current)) warnings.push(`Champ répété : ${current}. La dernière valeur est utilisée.`);
        values[current] = label[2].trim();
      } else if (heading) {
        current = clean; values[current] = "";
      } else if (current && aliases[normalize(current)] === "description") {
        values[current] = String(values[current]) + "\n" + line;
      }
    }
  }
  const fields: PastedProduct = {};
  for (const [label, rawValue] of Object.entries(values)) {
    const key = aliases[normalize(label)];
    if (!key) { warnings.push(`Champ non importé : ${label}. Complétez-le manuellement si nécessaire.`); continue; }
    const value = (Array.isArray(rawValue) && key === "tags" && rawValue.every(v => typeof v === "string")
      ? rawValue.join(", ") : typeof rawValue === "string" || typeof rawValue === "number" ? String(rawValue) : "").trim();
    if (!value) continue;
    if (key === "price" || key === "original_price" || key === "stock" || key === "weight") {
      let numeric = value;
      if (key === "price" || key === "original_price") numeric = numeric.replace(/\s*(MAD|DH|DHS)\s*$/i, "");
      if (key === "weight") numeric = numeric.replace(/\s*kg\s*$/i, "");
      if (key === "stock") numeric = numeric.replace(/\s+(?:unités?|unites?|articles?|pièces?|pieces?|units?|items?)(?:\s+en stock)?\s*$/i, "");
      numeric = numeric.replace(/\s/g, "").replace(",", ".");
      if (!/^\d+(?:\.\d{1,3})?$/.test(numeric) || !Number.isFinite(Number(numeric)) || (key === "stock" && !Number.isInteger(Number(numeric)))) {
        warnings.push(`${pasteFieldLabels[key]} non importé : valeur ou unité ambiguë (${value}).`); continue;
      }
      fields[key] = String(Number(numeric));
    } else if (key === "category") {
      const category = normalize(value);
      if (!["homme", "femme", "chaussures", "accessoires"].includes(category)) { warnings.push(`Catégorie non reconnue : ${value}. Choisissez-la dans le formulaire.`); continue; }
      fields[key] = category;
    } else {
      if (value.length > (key === "description" ? 12000 : 1000) || /<[^>]+>/.test(value) || (key === "tags" && value.split(",").some(tag => tag.trim().startsWith("__")))) {
        warnings.push(`${pasteFieldLabels[key]} non importé : contenu non pris en charge.`); continue;
      }
      fields[key] = value;
    }
  }
  if (!Object.keys(fields).length) throw new Error("Aucun champ reconnu. Utilisez les libellés de l’exemple : Nom du produit, Description, Prix, Stock…");
  return { fields, warnings };
}
