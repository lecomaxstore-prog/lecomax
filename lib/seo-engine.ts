/** Pure SEO rules shared by the dashboard and server. No credentials or AI calls. */
export type SeoContent = { title: string; description: string; imageAlt: string };
export type SeoSource = { name: string; description?: string | null; category?: string | null; slug: string; images?: string[] | null; brand?: string | null };
export type SeoDocument = {
  kind: "product" | "category"; entity_id: string; slug: string; active: boolean;
  source: SeoSource; fallback: SeoContent; draft: SeoContent | null; published: SeoContent | null;
  draft_source: SeoSource | null; published_source: SeoSource | null;
  version: number; updated_at: string; published_at: string | null; provider: string | null;
};
export function plainText(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}
export function seoSlug(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100).replace(/-$/, "");
}
export function fallbackSeo(source: SeoSource, kind: "product" | "category" = "product"): SeoContent {
  const name = plainText(source.name);
  const details = plainText(source.description || "");
  return {
    title: `${name.slice(0, 110)} | L'ecomax Maroc`,
    description: (kind === "product"
      ? `${name} sur L'ecomax au Maroc. ${details || "Consultez les photos et les informations de ce produit dans notre boutique."}`
      : `${name} sur L'ecomax au Maroc. ${details || "Explorez les produits de cette catégorie et consultez leurs fiches détaillées."}`).slice(0, 180),
    imageAlt: name.slice(0, 180),
  };
}
export function validSeoContent(value: unknown): value is SeoContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return Object.keys(data).every(key => ["title", "description", "imageAlt"].includes(key)) &&
    ([ ["title", 140], ["description", 320], ["imageAlt", 240] ] as const).every(([key, max]) =>
      typeof data[key] === "string" && data[key].trim().length > 0 && data[key].length <= max && !/[<>\u0000-\u001f]/.test(data[key]));
}
export function effectiveSeo(doc: SeoDocument): SeoContent { return doc.published ?? doc.fallback; }
/** Compare canonical Unicode equivalents without removing meaningful accents or Arabic marks. */
function duplicateKey(text: string): string {
  return plainText(text).normalize("NFC").toLocaleLowerCase("fr").normalize("NFC");
}
export function sourceChanged(a: SeoSource | null, b: SeoSource): boolean {
  return !a || (["name", "description", "category", "slug", "brand", "images"] as const)
    .some(key => JSON.stringify(a[key] ?? null) !== JSON.stringify(b[key] ?? null));
}
export function auditSeo(doc: SeoDocument, documents: SeoDocument[], counts?: Map<string, number>): string[] {
  const seo = effectiveSeo(doc);
  const issues: string[] = [];
  if (!doc.published) issues.push("Métadonnées automatiques : à vérifier");
  if (doc.draft) issues.push("Brouillon en attente");
  if (doc.published && sourceChanged(doc.published_source, doc.source)) issues.push("Contenu approuvé à revalider : fiche modifiée");
  if (!plainText(doc.source.description ?? "")) issues.push("Description source manquante");
  if (!doc.source.images?.length) issues.push("Image manquante");
  if (seo.title.length > 65) issues.push("Titre long : aperçu à vérifier");
  if (seo.description.length < 70 || seo.description.length > 180) issues.push("Longueur de description à vérifier");
  const normalized = duplicateKey;
  for (const key of ["title", "description"] as const) {
    const duplicate = counts ? (counts.get(`${key}:${normalized(seo[key])}`) ?? 0) > (doc.active ? 1 : 0) : documents.some(other => other.active && (other.entity_id !== doc.entity_id || other.kind !== doc.kind) && normalized(effectiveSeo(other)[key]) === normalized(seo[key]));
    if (duplicate) {
      issues.push(key === "title" ? "Titre dupliqué" : "Description dupliquée");
    }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug)) issues.push("URL à examiner (ne pas renommer sans redirection)");
  return issues;
}
export function auditCatalogue(documents: SeoDocument[]): Map<string, string[]> {
  const counts = new Map<string, number>();
  for (const doc of documents.filter(item => item.active)) {
    for (const field of ["title", "description"] as const) {
      const key = `${field}:${duplicateKey(effectiveSeo(doc)[field])}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return new Map(documents.map(doc => [`${doc.kind}:${doc.entity_id}`, auditSeo(doc, documents, counts)]));
}
export function seoPath(kind: "product" | "category", slug: string): string {
  return `${kind === "product" ? "/produit" : ""}/${encodeURIComponent(slug)}/`;
}
export function internalLinks(doc: SeoDocument, documents: SeoDocument[]) {
  return documents.filter(other => other.active && (other.entity_id !== doc.entity_id || other.kind !== doc.kind) &&
    (other.kind === "category" ? other.slug === doc.source.category :
      doc.kind === "category" ? other.source.category === doc.slug : other.source.category === doc.source.category))
    .slice(0, 5).map(other => ({ name: other.source.name, path: seoPath(other.kind, other.slug) }));
}
