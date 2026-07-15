import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "@/lib/admin-session";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/settings
export async function GET() {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

// POST /api/settings  (upsert all keys) — admin only
export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (!session || !(await verifySessionToken(session))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // body is expected to be Record<string, string>
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Format de paramètres invalide" }, { status: 400 });
  }
  const values = body as Record<string, unknown>;
  const shippingCost = Number(values.shipping_cost);
  const freeThreshold = Number(values.free_shipping_threshold);
  if ("shipping_cost" in values && (!Number.isFinite(shippingCost) || shippingCost < 0)) {
    return NextResponse.json({ error: "Les frais de livraison doivent être un nombre positif." }, { status: 400 });
  }
  if ("free_shipping_threshold" in values && (!Number.isFinite(freeThreshold) || freeThreshold < 0)) {
    return NextResponse.json({ error: "Le seuil de livraison gratuite doit être un nombre positif." }, { status: 400 });
  }
  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
