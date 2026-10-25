export type EditorialLocale = { title: string; description: string; productDescription: string; keywords: string[] };
export type EditorialContent = { fr: EditorialLocale; ar: EditorialLocale; evidence: {locale: "fr" | "ar"; claim: string; sourceQuote: string}[] };
export type EditorialSource = {name: string; description?: string; brand?: string; category?: string; [key: string]: unknown};
export type EditorialRevision = {revision: number; content: EditorialContent; source: EditorialSource; actor: string; created_at: string};
export type EditorialEvent = {id: string; revision: number; action: string; actor: string; notes: string; created_at: string};
export type EditorialState = {version: number; revision: number; source: EditorialSource; head: EditorialRevision | null; published: EditorialContent | null; revisions: EditorialRevision[]; events: EditorialEvent[]; canPublish?: boolean};
export type LocalEditorialDraft = {content: EditorialContent; notes: string; base: Pick<EditorialState, "version" | "revision" | "source">};
export const editorialDraftKey = (scope: string, id: string) => `lecomax.editorial.v1:${JSON.stringify([scope, id])}`;
/** Recovery accepts unfinished text (including newlines); server validation still gates saving. */
export function parseLocalEditorialDraft(raw: string | null): LocalEditorialDraft | null {
  if (!raw || raw.length > 100_000) return null;
  try {
    const value = JSON.parse(raw);
    if (!Number.isSafeInteger(value.base?.version) || value.base.version < 1 || !Number.isSafeInteger(value.base?.revision) || value.base.revision < 0 ||
      !object(value.base.source) || typeof value.base.source.name !== "string" || typeof value.notes !== "string" || value.notes.length > 2000) return null;
    const content = value.content;
    for (const lang of ["fr", "ar"]) {
      const item = content?.[lang];
      if (!object(item) || !["title", "description", "productDescription"].every(k => typeof item[k] === "string" && item[k].length <= 4000) ||
        !Array.isArray(item.keywords) || item.keywords.length > 6 || !item.keywords.every(k => typeof k === "string" && k.length <= 4000)) return null;
    }
    if (!Array.isArray(content.evidence) || content.evidence.length > 8 || !content.evidence.every((e: Record<string, unknown>) => object(e) &&
      ["fr", "ar"].includes(String(e.locale)) && ["claim", "sourceQuote"].every(k => typeof e[k] === "string" && e[k].length <= 1000))) return null;
    return {content:value.content, notes:value.notes, base:{version:value.base.version, revision:value.base.revision, source:value.base.source}};
  } catch { return null; }
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: string[]) => Object.keys(v).sort().join(",") === expected.sort().join(",");
const text = (v: unknown, max: number) => typeof v === "string" && [...v].length <= max && !/[<>\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/u.test(v);
/** Incomplete drafts are saveable. Publication uses the stricter factual/language assessment. */
export function validEditorialDraft(v: unknown): v is EditorialContent {
  if (!object(v) || !keys(v, ["fr", "ar", "evidence"])) return false;
  for (const lang of ["fr", "ar"]) {
    const item = v[lang];
    if (!object(item) || !keys(item, ["title", "description", "productDescription", "keywords"]) ||
      !["title", "description", "productDescription"].every(field => text(item[field], 2000)) ||
      !Array.isArray(item.keywords) || item.keywords.length > 6 || !item.keywords.every(word => text(word, 100))) return false;
  }
  return Array.isArray(v.evidence) && v.evidence.length <= 8 && v.evidence.every(e => object(e) && keys(e, ["locale", "claim", "sourceQuote"]) &&
    ["fr", "ar"].includes(String(e.locale)) && text(e.claim, 500) && text(e.sourceQuote, 500));
}
export function blankEditorial(): EditorialContent {
  return {fr: {title: "", description: "", productDescription: "", keywords: []}, ar: {title: "", description: "", productDescription: "", keywords: []}, evidence: []};
}
