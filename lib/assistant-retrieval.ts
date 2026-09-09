import { selectedInventory } from "../mobile/src/lib/purchasability.ts";
import { normalizeSearchText, rankProducts, type SearchableProduct } from "./product-search.ts";
import type { SearchIntent, RecommendationResult } from "./assistant-types";

// Extended product type with sizing and full attributes
export type CatalogProduct = SearchableProduct & {
  sizes?: string[] | null;
  brand?: string | null;
  subCategory?: string | null;
  color_stock?: Record<string, number> | null;
};

export async function getAssistantCatalog(constraints?: SearchIntent["constraints"]): Promise<CatalogProduct[]> {
  const { supabase } = await import("./supabase");
  let query = supabase
    .from("products")
    .select("slug, name, brand, category, price, original_price, description, images, colors, sizes, tags, featured, stock, color_stock, created_at")
    .eq("active", true);

  if (constraints) {
    if (constraints.budgetMax) query = query.lte("price", constraints.budgetMax);
    if (constraints.budgetMin) query = query.gte("price", constraints.budgetMin);
    // Note: We avoid strict ilike on category here to prevent false negatives from synonyms (e.g. "sneakers" vs "chaussures").
    // The exact filtering is better handled in filterByConstraints after lexical expansion.
  }

  // Limit to 200 items to prevent memory explosion, we assume top active/featured products
  query = query.order("featured", { ascending: false }).limit(200);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as CatalogProduct[];
}

export function filterByConstraints(
  products: CatalogProduct[],
  constraints: SearchIntent["constraints"]
): CatalogProduct[] {
  if (!constraints) return products;

  return products.filter((product) => {
    // 1. Budget (Already handled by DB, but good to double check)
    if (constraints.budgetMax && product.price > constraints.budgetMax) return false;
    if (constraints.budgetMin && product.price < constraints.budgetMin) return false;

    // 2. Category
    if (constraints.category) {
      const pCat = normalizeSearchText(product.category || "");
      const cCat = normalizeSearchText(constraints.category);
      if (pCat && cCat && !pCat.includes(cCat) && !cCat.includes(pCat)) return false;
    }

    // 3. Brands (Excluded)
    if (constraints.excludedBrands && constraints.excludedBrands.length > 0) {
      const pBrand = normalizeSearchText(product.brand || "");
      if (constraints.excludedBrands.some(b => pBrand.includes(normalizeSearchText(b)))) return false;
    }

    // Use the same stock resolver as checkout, including JSON variant tags.
    const reqSizes = constraints.sizes?.map(normalizeSearchText) ?? [];
    const reqColors = constraints.colors?.map(normalizeSearchText) ?? [];
    const colors = product.colors?.length ? product.colors : [undefined];
    const sizes = product.sizes?.length ? product.sizes : [undefined];
    const candidates = colors.filter(color => !reqColors.length || (color && reqColors.some(value => normalizeSearchText(color).includes(value))));
    const matchingSizes = sizes.filter(size => !reqSizes.length || (size && reqSizes.includes(normalizeSearchText(size))));
    if (!candidates.some(color => matchingSizes.some(size => selectedInventory({
      stock: Number(product.stock ?? 0), colors: product.colors ?? [], sizes: product.sizes ?? [], tags: product.tags ?? [], color_stock: product.color_stock ?? undefined,
    }, color, size) > 0))) return false;

    return true;
  });
}

/**
 * Ranks products based on intent constraints (budget, brand, priorities).
 */
export function rankAssistantProducts(
  products: CatalogProduct[],
  query: string,
  constraints: SearchIntent["constraints"]
): RecommendationResult[] {
  // Use existing lexical search first to get base scores
  let baseScored = products.map(p => ({ product: p, score: 0 }));
  
  if (query) {
    const lexicallyRanked = rankProducts(products, query);
    // Merge scores back (simplified: rankProducts returns sorted array, but we want scores, wait, rankProducts strips scores).
    // Let's compute manually or use list position.
    baseScored = products.map(p => {
      const rank = lexicallyRanked.findIndex(r => r.slug === p.slug);
      let score = rank === -1 ? 0 : 100 - rank;
      return { product: p, score };
    });
  } else {
    // If no query, score based on featured/new
    baseScored = products.map(p => ({
      product: p,
      score: p.featured ? 50 : 10
    }));
  }

  // Apply constraint bonuses
  return baseScored
    .map(({ product, score }) => {
      let finalScore = score;
      let reason = "Correspond à votre recherche.";
      let label: RecommendationResult["label"] = undefined;

      if (constraints) {
        // Brand preference
        if (constraints.preferredBrands?.some(b => normalizeSearchText(product.brand || "").includes(normalizeSearchText(b)))) {
          finalScore += 50;
          reason = `Marque ${product.brand} que vous avez demandée.`;
          label = "Best Match";
        }
        
        // Priority checks (Comfort, lightweight, etc. parsed into description)
        if (constraints.priorities) {
          const desc = normalizeSearchText(product.description || "");
          let hitCount = 0;
          for (const prio of constraints.priorities) {
             if (desc.includes(normalizeSearchText(prio))) {
               hitCount++;
             }
          }
          if (hitCount > 0) {
            finalScore += (hitCount * 20);
            reason = `Idéal pour vos priorités (${constraints.priorities.join(", ")}).`;
            if (!label) label = "Premium Choice";
          }
        }
      }

      // Budget choice
      if (constraints?.budgetMax && product.price <= constraints.budgetMax * 0.7) {
        label = "Budget Choice";
      }

      return {
        productSlug: product.slug,
        productName: product.name,
        productPrice: product.price,
        productImage: (product.images && product.images.length > 0) ? product.images[0] : undefined,
        score: finalScore,
        reason,
        label
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
