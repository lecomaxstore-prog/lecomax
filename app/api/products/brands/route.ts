import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { mergeBrands, validateBrand } from "@/mobile/src/lib/product-brands";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const prefix = "product_brand:";

export async function GET() {
  const { data, error } = await db.from("settings").select("value").like("key", `${prefix}%`);
  if (error) return NextResponse.json({ error: "Marques indisponibles. Réessayez." }, { status: 503 });
  const brands = (data ?? []).flatMap(row => {
    try { const brand = validateBrand(JSON.parse(row.value)); return brand ? [brand] : []; }
    catch { return []; }
  });
  return NextResponse.json(mergeBrands(brands), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "products:brands", limit: 30 });
  if (blocked) return blocked;
  const brand = validateBrand(await readJsonLimited(req, 4096).catch(() => null));
  if (!brand) return NextResponse.json({ error: "Nom requis (80 caractères maximum), logo HTTPS valide ou vide." }, { status: 400 });
  // One deterministic row per name: concurrent saves cannot erase other brands.
  const key = prefix + createHash("sha256").update(brand.id).digest("hex");
  const { error } = await db.from("settings").upsert({ key, value: JSON.stringify(brand) }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: "Impossible d’enregistrer la marque." }, { status: 503 });
  return NextResponse.json(brand);
}
