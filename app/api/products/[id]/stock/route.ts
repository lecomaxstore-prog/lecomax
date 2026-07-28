import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";
import {
  asStock,
  cleanColorStock,
  colorStockTotal,
  reconcileColorStock,
  syncOutOfStockTags,
} from "@/lib/product-inventory";
import { publishProductDiscovery } from "@/lib/product-discovery";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type InventoryProduct = {
  id: string;
  slug: string;
  category: string | null;
  active: boolean;
  stock: number;
  colors: string[] | null;
  color_stock: Record<string, number> | null;
  tags: string[] | null;
};

// PATCH /api/products/[id]/stock
// Adds inventory on the server and uses the previous total as an optimistic
// lock so two simultaneous restocks cannot silently overwrite each other.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = await protectAdminMutation(req, {
    key: "products:stock",
    limit: 90,
  });
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Données de stock invalides." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (input.operation !== "add") {
    return NextResponse.json({ error: "Opération de stock invalide." }, { status: 400 });
  }
  const quantity = asStock(input.quantity);
  if (quantity === null || quantity < 1) {
    return NextResponse.json(
      { error: "La quantité doit être un entier supérieur à zéro." },
      { status: 400 },
    );
  }
  const requestedColor =
    typeof input.color === "string" ? input.color.trim().slice(0, 80) : "";

  const { id } = await params;
  const { data: currentData, error: readError } = await supabase
    .from("products")
    .select("id,slug,category,active,stock,colors,color_stock,tags")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    return NextResponse.json(
      { error: "Impossible de lire le stock actuel." },
      { status: 500 },
    );
  }
  if (!currentData) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  const current = currentData as InventoryProduct;
  const colors = [...new Set([
    ...(current.colors ?? []),
    ...Object.keys(cleanColorStock(current.color_stock) ?? {}),
  ])];
  if (requestedColor && !colors.includes(requestedColor)) {
    return NextResponse.json(
      { error: "Cette variante n’existe pas pour ce produit." },
      { status: 400 },
    );
  }

  const nextTotal = asStock(Number(current.stock) + quantity);
  if (nextTotal === null) {
    return NextResponse.json(
      { error: "Le stock maximum autorisé serait dépassé." },
      { status: 400 },
    );
  }

  const currentColorStock = cleanColorStock(current.color_stock) ?? {};
  let nextColorStock: Record<string, number> | null;
  if (requestedColor) {
    const hasAllocatedVariants = Object.keys(currentColorStock).length > 0;
    const currentVariant = hasAllocatedVariants
      ? currentColorStock[requestedColor] ?? 0
      : current.stock;
    const nextVariant = asStock(currentVariant + quantity);
    if (nextVariant === null) {
      return NextResponse.json(
        { error: "Le stock maximum de cette variante serait dépassé." },
        { status: 400 },
      );
    }
    nextColorStock = { ...currentColorStock, [requestedColor]: nextVariant };
  } else {
    nextColorStock = reconcileColorStock(currentColorStock, colors, nextTotal);
  }

  const stock = nextColorStock ? colorStockTotal(nextColorStock) : nextTotal;
  const payload: Record<string, unknown> = { stock };
  if (nextColorStock) {
    payload.color_stock = nextColorStock;
    payload.tags = syncOutOfStockTags(current.tags ?? [], nextColorStock);
  }

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .eq("stock", current.stock)
    .select()
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: "Impossible d’ajouter le stock." },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      {
        error:
          "Le stock vient d’être modifié ailleurs. Actualisez puis réessayez.",
        code: "INVENTORY_CONFLICT",
      },
      { status: 409 },
    );
  }

  publishProductDiscovery({ current: data, previous: current });
  return NextResponse.json(
    {
      product: data,
      adjustment: {
        operation: "add",
        quantity,
        color: requestedColor || null,
        previous_stock: current.stock,
        stock: data.stock,
      },
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
