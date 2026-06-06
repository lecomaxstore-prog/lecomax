import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/products
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const active = searchParams.get("active");
  const search = searchParams.get("search");
  const limit = searchParams.get("limit");

  let query = supabase.from("products").select("*").order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (active === "true") query = query.eq("active", true);
  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `name.ilike.${term},description.ilike.${term},category.ilike.${term},brand.ilike.${term}`
    );
  }
  if (limit) query = query.limit(parseInt(limit));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/products
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data, error } = await supabase.from("products").insert(body as object).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
