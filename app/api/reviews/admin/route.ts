import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/reviews/admin — admin-only: insert a review without order verification
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { product_slug, author_name, city, rating, title, review_body, color } = body as Record<string, string | number>;

  if (!product_slug || !author_name || !rating || !review_body) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  const { data, error } = await supabase.from("reviews").insert({
    product_slug,
    email: "admin@lecomax.com",
    author_name,
    city: city || null,
    rating: Number(rating),
    title: title || null,
    body: review_body,
    color: color || null,
    verified: true,
    approved: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
