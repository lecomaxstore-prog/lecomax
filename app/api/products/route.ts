import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { cleanProductPayload } from "@/lib/product-api-validation";
import { cleanColorStock, colorStockTotal, syncOutOfStockTags } from "@/lib/product-inventory";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PUBLIC_FIELDS = "id,slug,name,brand,category,price,original_price,description,images,colors,sizes,featured,stock,color_stock,active,tags,created_at";

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
  const limit = requestedLimit !== null && Number.isInteger(requestedLimit)
    ? Math.min(100, Math.max(1, requestedLimit))
    : null;
  const publicRequest = activeOnly && !createdBy;

  if (!publicRequest) {
    const blocked = await protectAdminRead(req, { key: "products:list", limit: 180 });
    if (blocked) return blocked;
  }

  let query = supabase
    .from("products")
    .select(publicRequest ? PUBLIC_FIELDS : "*")
    .order(sort === "stock" ? "stock" : "created_at", { ascending: sort === "stock" });

  if (createdBy) query = query.eq("created_by", createdBy.slice(0, 254));
  if (category) {
    if (!["homme", "femme", "chaussures", "accessoires"].includes(category)) {
      return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
    }
    query = query.eq("category", category);
  }
  if (activeOnly) query = query.eq("active", true);
  if (search) {
    const safeSearch = search.replace(/[%_,().]/g, " ").trim().slice(0, 80);
    if (safeSearch) {
      const term = `%${safeSearch}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},category.ilike.${term},brand.ilike.${term}`);
    }
  }
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Impossible de charger les produits." }, { status: 500 });
  return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store, max-age=0" } });
}

// POST /api/products
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "products:create", limit: 30 });
  if (blocked) return blocked;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const cleaned = cleanProductPayload(body, "create");
  if (!("payload" in cleaned)) return NextResponse.json({ error: cleaned.error }, { status: 400 });
  const payload = { ...cleaned.payload } as Record<string, unknown>;
  const colorStock = cleanColorStock(payload.color_stock);
  if (colorStock) {
    payload.color_stock = colorStock;
    payload.stock = colorStockTotal(colorStock);
    payload.tags = syncOutOfStockTags((payload.tags as string[] | undefined) ?? [], colorStock);
  }

  const { data, error } = await supabase.from("products").insert(payload).select().single();
  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "Un produit utilise déjà ce slug." : "Impossible de créer le produit." },
      { status: duplicate ? 409 : 500 },
    );
  }
  revalidatePath("/", "layout");
  revalidatePath("/boutique");
  revalidatePath(`/produit/${data.slug}`);
  return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
}
