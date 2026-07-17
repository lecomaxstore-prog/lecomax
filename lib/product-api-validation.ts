import { asStock, cleanColorStock } from "@/lib/product-inventory";

const CATEGORIES = new Set(["homme", "femme", "chaussures", "accessoires"]);
const MAX_TEXT = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown, maxItems = 100, maxLength = 200) {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const cleaned = value.map((item) => String(item ?? "").trim().slice(0, maxLength)).filter(Boolean);
  return cleaned.length === value.length ? cleaned : null;
}

function urlArray(value: unknown, maxItems = 40) {
  const values = stringArray(value, maxItems, 2_000);
  if (!values) return null;
  return values.every((url) => url.startsWith("/") || /^https?:\/\//i.test(url)) ? values : null;
}

function optionalNumber(value: unknown, { min = 0, max = 1_000_000 } = {}) {
  if (value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : undefined;
}

export function cleanProductPayload(body: unknown, mode: "create" | "update") {
  if (!isRecord(body)) return { error: "Données produit invalides." } as const;
  const payload: Record<string, unknown> = {};

  if ("slug" in body) {
    const slug = String(body.slug ?? "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!/^[a-z0-9-]{2,120}$/.test(slug)) return { error: "Slug produit invalide." } as const;
    payload.slug = slug;
  }
  if ("name" in body) {
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 240) return { error: "Nom produit invalide." } as const;
    payload.name = name;
  }
  if ("category" in body) {
    const category = String(body.category ?? "");
    if (!CATEGORIES.has(category)) return { error: "Catégorie produit invalide." } as const;
    payload.category = category;
  }
  if ("price" in body) {
    const price = optionalNumber(body.price);
    if (price === undefined) return { error: "Prix produit invalide." } as const;
    payload.price = price;
  }
  if ("original_price" in body) {
    const price = optionalNumber(body.original_price);
    if (price === undefined) return { error: "Prix d’origine invalide." } as const;
    payload.original_price = price;
  }
  if ("stock" in body) {
    const stock = asStock(body.stock);
    if (stock === null) return { error: "Le stock doit être un entier positif ou nul." } as const;
    payload.stock = stock;
  }
  if ("color_stock" in body) {
    const stock = cleanColorStock(body.color_stock);
    if (!stock) return { error: "Stock des couleurs invalide." } as const;
    payload.color_stock = stock;
  }

  for (const key of ["colors", "sizes", "tags"] as const) {
    if (!(key in body)) continue;
    const values = stringArray(body[key]);
    if (!values) return { error: `Liste ${key} invalide.` } as const;
    payload[key] = values;
  }
  for (const key of ["images", "description_images"] as const) {
    if (!(key in body)) continue;
    const values = urlArray(body[key]);
    if (!values) return { error: `Liste ${key} invalide.` } as const;
    payload[key] = values;
  }
  for (const key of ["description", "brand"] as const) {
    if (!(key in body)) continue;
    const value = String(body[key] ?? "").trim();
    payload[key] = value ? value.slice(0, key === "description" ? MAX_TEXT : 120) : null;
  }
  if ("video" in body) {
    const video = String(body.video ?? "").trim();
    if (video && !/^https?:\/\//i.test(video)) return { error: "URL vidéo invalide." } as const;
    payload.video = video ? video.slice(0, 2_000) : null;
  }
  if ("weight" in body) {
    const weight = optionalNumber(body.weight, { min: 0, max: 100_000 });
    if (weight === undefined) return { error: "Poids produit invalide." } as const;
    payload.weight = weight;
  }
  if ("active" in body) payload.active = body.active !== false;
  if ("featured" in body) payload.featured = body.featured === true;
  if ("created_by" in body) {
    const email = String(body.created_by ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Créateur produit invalide." } as const;
    payload.created_by = email.slice(0, 254);
  }

  if (mode === "create") {
    for (const key of ["slug", "name", "category", "price"] as const) {
      if (!(key in payload)) return { error: `Champ obligatoire manquant : ${key}.` } as const;
    }
    if (!("stock" in payload)) payload.stock = 0;
    if (!("active" in payload)) payload.active = true;
  }
  if (Object.keys(payload).length === 0) return { error: "Aucune modification valide." } as const;
  return { payload } as const;
}
