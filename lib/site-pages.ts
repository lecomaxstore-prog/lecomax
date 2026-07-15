export type SitePageInput = {
  title?: string;
  slug?: string;
  content?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  active?: boolean;
  sort_order?: number;
};

const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "produit", "panier", "commande", "checkout",
  "aide", "compte", "wishlist", "homme", "femme", "chaussures", "accessoires",
]);

export function normalizePageSlug(value: unknown) {
  return String(value ?? "").toLocaleLowerCase("fr-FR").trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function validatePageInput(body: unknown, partial = false): { value?: SitePageInput; error?: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Données invalides." };
  const source = body as Record<string, unknown>;
  const value: SitePageInput = {};

  if (!partial || "title" in source) {
    const title = String(source.title ?? "").trim();
    if (title.length < 2 || title.length > 120) return { error: "Le titre doit contenir entre 2 et 120 caractères." };
    value.title = title;
  }
  if (!partial || "slug" in source) {
    const slug = normalizePageSlug(source.slug);
    if (slug.length < 2 || slug.length > 80) return { error: "L’adresse doit contenir entre 2 et 80 caractères." };
    if (RESERVED_SLUGS.has(slug)) return { error: "Cette adresse est réservée par le site. Choisissez-en une autre." };
    value.slug = slug;
  }
  if ("content" in source) {
    const content = String(source.content ?? "").trim().slice(0, 100_000);
    value.content = content ? sanitizePageHtml(content) : null;
  }
  if ("meta_title" in source) value.meta_title = String(source.meta_title ?? "").trim().slice(0, 70) || null;
  if ("meta_description" in source) value.meta_description = String(source.meta_description ?? "").trim().slice(0, 180) || null;
  if ("active" in source) value.active = source.active === true;
  if ("sort_order" in source) value.sort_order = Math.max(0, Math.min(9999, Math.trunc(Number(source.sort_order) || 0)));
  if (!partial) {
    value.active ??= true;
    value.sort_order ??= 0;
    value.content ??= null;
    value.meta_title ??= null;
    value.meta_description ??= null;
  }
  if (!Object.keys(value).length) return { error: "Aucune modification valide reçue." };
  return { value };
}

const ALLOWED_TAGS = new Set(["p", "br", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "u", "blockquote", "a", "img", "hr"]);

export function sanitizePageHtml(html: string) {
  let safe = html.replace(/<!--[\s\S]*?-->/g, "");
  safe = safe.replace(/<(script|style|iframe|object|embed|form|svg|math|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  safe = safe.replace(/<(script|style|iframe|object|embed|form|input|button|meta|link|base|svg|math|template)\b[^>]*\/?\s*>/gi, "");
  return safe.replace(/<\/?([a-z][a-z0-9-]*)([^>]*)>/gi, (whole, rawTag: string, rawAttributes: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (whole.startsWith("</")) return `</${tag}>`;
    if (["br", "hr"].includes(tag)) return `<${tag}>`;

    const attributes: string[] = [];
    const attrPattern = /([a-zA-Z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let match: RegExpExecArray | null;
    while ((match = attrPattern.exec(rawAttributes))) {
      const name = match[1].toLowerCase();
      const rawValue = match[2] ?? match[3] ?? "";
      const escaped = rawValue.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      if (name === "title" || name === "alt") attributes.push(`${name}="${escaped.slice(0, 300)}"`);
      if (tag === "a" && name === "href" && /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(rawValue)) attributes.push(`href="${escaped.slice(0, 1000)}"`);
      if (tag === "a" && name === "target" && ["_blank", "_self"].includes(rawValue)) attributes.push(`target="${rawValue}"`);
      if (tag === "img" && name === "src" && /^(https?:\/\/|\/)/i.test(rawValue)) attributes.push(`src="${escaped.slice(0, 1000)}"`);
      if (tag === "img" && ["width", "height"].includes(name) && /^\d{1,4}$/.test(rawValue)) attributes.push(`${name}="${rawValue}"`);
    }
    if (tag === "a") attributes.push('rel="noopener noreferrer"');
    return `<${tag}${attributes.length ? ` ${attributes.join(" ")}` : ""}>`;
  });
}
