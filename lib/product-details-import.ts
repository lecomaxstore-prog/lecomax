export type ImportedDetail = { key: string; value: string };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function validateImportedDetails(input: unknown): ImportedDetail[] {
  if (!Array.isArray(input) || input.length > 40) throw new Error("Import limité à 40 détails.");
  return input.map(item => {
    if (!item || typeof item.key !== "string" || typeof item.value !== "string") throw new Error("Détail invalide.");
    const key = item.key.trim(); const value = item.value.trim();
    if (!key || !value || key.length > 80 || value.length > 2000 || /[:：\n<>]/.test(key) || /<[^>]+>/.test(value)) throw new Error("Nom ou valeur de détail invalide.");
    return { key, value };
  });
}

export function parseDetailsPaste(text: string): ImportedDetail[] {
  if (text.length > 20000) throw new Error("Le texte dépasse 20 000 caractères.");
  const raw = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  if (/^[{[]/.test(raw)) {
    const data = JSON.parse(raw);
    return validateImportedDetails(Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({ key, value })));
  }
  const details: ImportedDetail[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const clean = line.trim().replace(/^[-*•]\s+|^\d+[.)]\s+/, "").replace(/\*\*/g, "");
    const pair = clean.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/) ?? clean.match(/^([^:：]{1,80})[:：]\s*(.+)$/);
    if (pair && !/^[\s:|-]+$/.test(clean) && !/^(caracteristique|detail|champ|attribute)$/i.test(normalize(pair[1]))) details.push({ key: pair[1], value: pair[2] });
  }
  if (!details.length) throw new Error("Aucun détail reconnu. Utilisez « Matière : coton » ou l’analyse IA.");
  return validateImportedDetails(details);
}

export function mergeImportedDetails(existing: ImportedDetail[], incoming: ImportedDetail[]): ImportedDetail[] {
  const merged = existing.filter(item => item.key.trim() || item.value.trim()).map(item => ({ ...item }));
  for (const item of incoming) {
    const index = merged.findIndex(current => normalize(current.key) === normalize(item.key));
    if (index < 0) merged.push(item); else merged[index] = item;
  }
  return merged;
}
