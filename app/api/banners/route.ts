import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { validateHeroBanner } from "@/lib/hero-banners";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const admin = await isAdminRequest(req);
  let query = supabase
    .from("banners")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (!admin) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = validateHeroBanner(body);
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data, error } = await supabase.from("banners").insert(parsed.value).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/", "page");
  return NextResponse.json(data, { status: 201 });
}
