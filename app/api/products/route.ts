import { recordAdminActivity } from "@/lib/admin-activity";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { cleanProductPayload } from "@/lib/product-api-validation";
import { productWriteError, writeProductWithSchemaCompatibility } from "@/lib/product-schema-compatibility";
import {
  cleanColorStock,
  colorStockTotal,
  syncOutOfStockTags,
} from "@/lib/product-inventory";
import { publishProductDiscovery } from "@/lib/product-discovery";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PUBLIC_FIELDS =
  "id,slug,name,brand,category,price,original_price,description,description_images,images,video,colors,sizes,featured,stock,color_stock,preorder_enabled,preorder_estimated_at,preorder_message,active,tags,created_at";

// GET /api/products
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("active") === "true";
  const search = searchParams.get("search")?.trim();
  const createdBy = searchParams.get("created_by")?.trim();
  const sort = searchParams.get("sort");
  const limitParam = searchParams.get("limit");
  const requestedLimit = limitParam === null ? null : Number(limitParam);
  const limit =
    requestedLimit !== null && Number.isInteger(requestedLimit)
      ? Math.min(100, Math.max(1, requestedLimit))
      : null;
  const publicRequest = activeOnly && !createdBy;

  if (!publicRequest) {
    const blocked = await protectAdminRead(req, {
      key: "products:list",
      limit: 180,
    });
    if (blocked) return blocked;
  }

  let query = supabase
    .from("products")
    .select(publicRequest ? PUBLIC_FIELDS : "*")
    .order(sort === "stock" ? "stock" : "created_at", {
      ascending: sort === "stock",
    });

  if (createdBy) query = query.eq("created_by", createdBy.slice(0, 254));
  if (category) {
    if (!["homme", "femme", "chaussures", "accessoires"].includes(category)) {
      return NextResponse.json(
        { error: "Catégorie invalide." },
        { status: 400 },
      );
    }
    query = query.eq("category", category);
  }
  if (activeOnly) query = query.eq("active", true);
  if (searchParams.has("cart_slugs")) {
    let slugs: unknown;
    try { slugs = JSON.parse(searchParams.get("cart_slugs")!); } catch { slugs = null; }
    if (!Array.isArray(slugs) || slugs.length < 1 || slugs.length > 50 || slugs.some(slug => typeof slug !== "string" || !slug.trim() || slug.length > 160)) {
      return NextResponse.json({ error: "Articles du panier invalides." }, { status: 400 });
    }
    query = query.in("slug", slugs);
  }
  if (search) {
    const safeSearch = search
      .replace(/[%_,().]/g, " ")
      .trim()
      .slice(0, 80);
    if (safeSearch) {
      const term = `%${safeSearch}%`;
      query = query.or(
        `name.ilike.${term},description.ilike.${term},category.ilike.${term},brand.ilike.${term}`,
      );
    }
  }
  if (limit) query = query.limit(limit);

  let { data, error } = await query;
  // Stores that have not enabled preorders still use the original schema.
  // Keep the public allowlist when retrying; never expose admin-only columns.
  if (publicRequest && error && ["42703", "PGRST204"].includes(error.code) && /preorder_(enabled|estimated_at|message)/.test(error.message)) {
    const legacyFields = PUBLIC_FIELDS.split(",").filter(field => !field.startsWith("preorder_")).join(",");
    ({ data, error } = await query.select(legacyFields));
  }
  if (error)
    return NextResponse.json(
      { error: "Impossible de charger les produits." },
      { status: 500 },
    );
  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

// POST /api/products
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, {
    key: "products:create",
    limit: 30,
  });
  if (blocked) return blocked;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const cleaned = cleanProductPayload(body, "create");
  if (!("payload" in cleaned))
    return NextResponse.json({ error: cleaned.error }, { status: 400 });
  const payload = { ...cleaned.payload } as Record<string, unknown>;
  const colorStock = cleanColorStock(payload.color_stock);
  if (colorStock) {
    payload.color_stock = colorStock;
    if (Object.keys(colorStock).length > 0) payload.stock = colorStockTotal(colorStock);
    payload.tags = syncOutOfStockTags(
      (payload.tags as string[] | undefined) ?? [],
      colorStock,
    );
  }

  const { data, error } = await writeProductWithSchemaCompatibility(payload, values => supabase
    .from("products")
    .insert(values)
    .select()
    .single());
  if (error) {
    console.error("Product create failed", { code: error.code, message: error.message });
    const failure = productWriteError(error, "Impossible de créer le produit.");
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
  await recordAdminActivity(req, "product", data.id, null, data);
  publishProductDiscovery({ current: data });
  return NextResponse.json(data, {
    status: 201,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
