import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";
import { publishOfferNotification } from "@/lib/offer-notification";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/promotions
export async function GET() {
  const { data, error } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

// POST /api/promotions
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "promotions:create", limit: 30 });
  if (blocked) return blocked;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { data, error } = await supabase.from("promotions").insert(body as object).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  publishOfferNotification(data.id, "promotion");
  return NextResponse.json(data, { status: 201 });
}
