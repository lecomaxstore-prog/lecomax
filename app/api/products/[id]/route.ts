import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { cleanProductPayload } from "@/lib/product-api-validation";
import { publishProductDiscovery } from "@/lib/product-discovery";
import {
  cleanColorStock,
  colorStockTotal,
  reconcileColorStock,
  syncOutOfStockTags,
} from "@/lib/product-inventory";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type StoredProduct = {
  id: string;
  slug: string;
  stock: number;
  colors: string[] | null;
  color_stock: Record<string, number> | null;
  tags: string[] | null;
  category: string | null;
  active: boolean;
};

// GET /api/products/[id] — admin detail endpoint
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminRead(req, { key: "products:detail", limit: 120 });
  if (blocked) return blocked;
  const { id } = await params;
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: "Impossible de charger le produit." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "products:update", limit: 60 });
  if (blocked) return blocked;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const cleaned = cleanProductPayload(body, "update");
  if (!("payload" in cleaned)) return NextResponse.json({ error: cleaned.error }, { status: 400 });

  const { data: current, error: currentError } = await supabase
    .from("products")
    .select("id,slug,stock,colors,color_stock,tags,category,active")
    .eq("id", id)
    .maybeSingle();
  if (currentError) return NextResponse.json({ error: "Impossible de lire l’inventaire actuel." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

  const stored = current as StoredProduct;
  const payload = { ...cleaned.payload } as Record<string, unknown>;
  const colors = (payload.colors as string[] | undefined) ?? stored.colors ?? [];
  const currentColorStock = cleanColorStock(stored.color_stock) ?? {};
  let synchronizedColorStock: Record<string, number> | null = null;

  if ("color_stock" in payload) {
    synchronizedColorStock = payload.color_stock as Record<string, number>;
    payload.stock = colorStockTotal(synchronizedColorStock);
  } else if ("stock" in payload) {
    synchronizedColorStock = reconcileColorStock(currentColorStock, colors, payload.stock as number);
    if (synchronizedColorStock) payload.color_stock = synchronizedColorStock;
  } else if (Object.keys(currentColorStock).length > 0) {
    synchronizedColorStock = currentColorStock;
  }

  if (synchronizedColorStock) {
    const tags = (payload.tags as string[] | undefined) ?? stored.tags ?? [];
    payload.tags = syncOutOfStockTags(tags, synchronizedColorStock);
  }

  const { data, error } = await supabase.from("products").update(payload).eq("id", id).select().single();
  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "Un produit utilise déjà ce slug." : "Impossible d’enregistrer le produit." },
      { status: duplicate ? 409 : 500 },
    );
  }
  publishProductDiscovery({ current: data, previous: stored });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

// DELETE /api/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "products:delete", limit: 20 });
  if (blocked) return blocked;
  const { id } = await params;
  const { data: current } = await supabase.from("products").select("slug,category,active").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Impossible de supprimer le produit." }, { status: 500 });
  publishProductDiscovery({ previous: current });
  return NextResponse.json({ success: true });
}
