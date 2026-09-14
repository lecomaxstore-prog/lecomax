import {
  asStock,
  cleanColorStock,
  cleanColorSizeStock,
  cleanSizeStock,
  colorSizeStockTotal,
  colorTotalsFromColorSizeStock,
  colorStockTotal,
  CLOTHING_SIZE_VALUES,
  SHOE_SIZE_VALUES,
  sizeStockTotal,
  sizeTotalsFromColorSizeStock,
  syncColorSizeStockTags,
  syncSizeInventoryTags,
  type ProductSizeGuideType,
} from "@/lib/product-inventory";
import { cleanColorImageMap, syncColorImageTags } from "@/lib/product-color-images";
import { PRODUCT_SIZE_GUIDE_PREFIX, productSizeGuideFromTags } from "@/mobile/src/lib/product-size-guide";

const CATEGORIES = new Set(["homme", "femme", "chaussures", "accessoires"]);
const MAX_TEXT = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown, maxItems = 100, maxLength = 200) {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  if (value.some(item => typeof item !== "string" || !item.trim() || item.trim().length > maxLength)) return null;
  const cleaned = value.map(item => item.trim());
  return new Set(cleaned).size === cleaned.length ? cleaned : null;
}

function urlArray(value: unknown, maxItems = 40) {
  const values = stringArray(value, maxItems, 2_000);
  if (!values) return null;
  return values.every((url) => url.startsWith("/") || /^https?:\/\//i.test(url)) ? values : null;
}

function optionalNumber(value: unknown, { min = 0, max = 1_000_000 } = {}) {
  if (value === null || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (String(value).trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : undefined;
}

export function cleanProductPayload(body: unknown, mode: "create" | "update") {
  if (!isRecord(body)) return { error: "Données produit invalides." } as const;
  const payload: Record<string, unknown> = {};
  if ("preorder_enabled" in body) {
    if (typeof body.preorder_enabled !== "boolean") return { error: "Précommande invalide." } as const;
    payload.preorder_enabled = body.preorder_enabled;
  }
  if ("preorder_estimated_at" in body) {
    const date = body.preorder_estimated_at;
    if (date !== null && date !== "" && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)) return { error: "Date de disponibilité invalide." } as const;
    payload.preorder_estimated_at = date || null;
  }
  if ("preorder_message" in body) {
    const message = body.preorder_message;
    if (message !== null && (typeof message !== "string" || message.length > 500)) return { error: "Message de précommande invalide (500 caractères maximum)." } as const;
    payload.preorder_message = typeof message === "string" ? message.trim() || null : null;
  }

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
    if (price === undefined || price === null || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) return { error: "Prix produit invalide." } as const;
    payload.price = price;
  }
  if ("original_price" in body) {
    const price = optionalNumber(body.original_price);
    if (price === undefined || (price !== null && Math.abs(price * 100 - Math.round(price * 100)) > 0.000001)) return { error: "Prix d’origine invalide." } as const;
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
    const values = key === "tags" && Array.isArray(body[key])
      ? stringArray(body[key], 101, 20_000) : stringArray(body[key]);
    if (!values) return { error: `Liste ${key} invalide.` } as const;
    if (key === "tags") {
      const guides = values.filter(tag => tag.startsWith(PRODUCT_SIZE_GUIDE_PREFIX));
      if (guides.length > 1 || (guides.length && !productSizeGuideFromTags(guides)) || values.some(tag => !tag.startsWith(PRODUCT_SIZE_GUIDE_PREFIX) && tag.length > 200)) {
        return { error: "Guide des tailles ou tags invalides." } as const;
      }
    }
    payload[key] = values;
  }

  if ("color_images" in body) {
    if (!("tags" in body) || !("colors" in body)) {
      return { error: "Couleurs et tags requis pour associer les images." } as const;
    }
    const colorImages = cleanColorImageMap(body.color_images);
    if (!colorImages) return { error: "Association des images aux couleurs invalide." } as const;
    const colors = payload.colors as string[];
    if (Object.keys(colorImages).some((color) => !colors.includes(color))) {
      return { error: "Une galerie d’images utilise une couleur non sélectionnée." } as const;
    }
    if ("images" in body) {
      const productImages = urlArray(body.images);
      if (!productImages || Object.values(colorImages).some((row) => row.some((image) => !productImages.includes(image)))) {
        return { error: "Chaque image de couleur doit appartenir aux images du produit." } as const;
      }
    }
    payload.tags = syncColorImageTags(payload.tags as string[], colorImages);
  }

  if ("size_guide_type" in body || "size_stock" in body) {
    if (!("tags" in body) || !("sizes" in body)) {
      return { error: "Les tailles et les tags sont requis pour mettre à jour l’inventaire par taille." } as const;
    }
    const guideType = String(body.size_guide_type ?? "none") as ProductSizeGuideType;
    if (!["none", "clothing", "shoes", "custom"].includes(guideType)) {
      return { error: "Type de tailles invalide." } as const;
    }
    const sizes = payload.sizes as string[];
    // Guides provide suggestions; actual option values remain strings so that
    // decimal shoe sizes and custom manufacturer labels survive unchanged.
    if (sizes.some(size => size.length > 40 || /[\u0000-\u001f]/.test(size))) return { error: "Taille invalide (40 caractères maximum)." } as const;

    let sizeStock: Record<string, number> | undefined;
    if ("size_stock" in body) {
      const cleanedSizeStock = cleanSizeStock(body.size_stock);
      if (!cleanedSizeStock) return { error: "Stock des tailles invalide." } as const;
      if (Object.keys(cleanedSizeStock).some((size) => !sizes.includes(size))) {
        return { error: "Le stock contient une taille qui n’est pas sélectionnée." } as const;
      }
      if (sizes.some((size) => !(size in cleanedSizeStock))) {
        return { error: "Indiquez le stock de chaque taille sélectionnée." } as const;
      }
      sizeStock = cleanedSizeStock;
      payload.stock = sizeStockTotal(cleanedSizeStock);
    }
    payload.tags = syncSizeInventoryTags(payload.tags as string[], guideType, sizeStock);
  }

  if ("size_stock" in body && "color_stock" in body) {
    const sizeStock = cleanSizeStock(body.size_stock);
    const colorStock = cleanColorStock(body.color_stock);
    if (sizeStock && colorStock && Object.keys(colorStock).length > 0 && sizeStockTotal(sizeStock) !== colorStockTotal(colorStock)) {
      return { error: "Le total du stock par taille doit correspondre au total du stock par couleur." } as const;
    }
  }

  if ("variant_stock" in body) {
    if (!("colors" in body) || !("sizes" in body) || !("tags" in body)) {
      return { error: "Couleurs, tailles et tags sont requis pour le stock des combinaisons." } as const;
    }
    const variantStock = cleanColorSizeStock(body.variant_stock);
    if (!variantStock) return { error: "Stock des combinaisons couleur/taille invalide." } as const;
    const colors = payload.colors as string[];
    const sizes = payload.sizes as string[];
    if (
      Object.keys(variantStock).length !== colors.length ||
      colors.some((color) => !(color in variantStock)) ||
      Object.values(variantStock).some((row) =>
        Object.keys(row).length !== sizes.length || sizes.some((size) => !(size in row)),
      )
    ) {
      return { error: "Indiquez le stock de chaque combinaison couleur/taille sélectionnée." } as const;
    }
    const guideType = String(body.size_guide_type ?? "custom") as ProductSizeGuideType;
    const sizeTotals = sizeTotalsFromColorSizeStock(variantStock);
    payload.color_stock = colorTotalsFromColorSizeStock(variantStock);
    payload.stock = colorSizeStockTotal(variantStock);
    payload.tags = syncColorSizeStockTags(
      syncSizeInventoryTags(payload.tags as string[], guideType, sizeTotals),
      variantStock,
    );
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
  for (const key of ["active", "featured"] as const) {
    if (!(key in body)) continue;
    if (typeof body[key] !== "boolean") return { error: `Statut ${key} invalide.` } as const;
    payload[key] = body[key];
  }
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
    if (!("active" in payload)) payload.active = false;
  }
  if (Object.keys(payload).length === 0) return { error: "Aucune modification valide." } as const;
  return { payload } as const;
}
