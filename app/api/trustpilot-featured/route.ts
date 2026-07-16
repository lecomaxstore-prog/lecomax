import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KEY = "trustpilot_featured";

export async function GET() {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", KEY)
    .single();
  try {
    const reviews = data?.value ? JSON.parse(data.value) : [];
    return NextResponse.json({ reviews: Array.isArray(reviews) ? reviews : [] });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "trustpilot:featured", limit: 20 });
  if (blocked) return blocked;
  let body: { reviews?: unknown };
  try { body = await req.json() as { reviews?: unknown }; } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const reviews = (Array.isArray(body.reviews) ? body.reviews : []).slice(0, 50).flatMap((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const review = raw as Record<string, unknown>;
    const name = text(review.name, 100);
    const content = text(review.text, 2_000);
    const rating = Math.floor(Number(review.rating));
    if (!name || !content || rating < 1 || rating > 5) return [];
    const photo = text(review.photo, 300_000);
    const safePhoto = photo.startsWith("https://") || /^data:image\/(?:jpeg|png|webp);base64,/i.test(photo) ? photo : "";
    return [{
      id: text(review.id, 100) || crypto.randomUUID(),
      name,
      title: text(review.title, 200),
      text: content,
      rating,
      date: Number.isFinite(Date.parse(String(review.date))) ? new Date(String(review.date)).toISOString() : new Date().toISOString(),
      url: text(review.url, 1_000).startsWith("https://") ? text(review.url, 1_000) : undefined,
      photo: safePhoto || undefined,
    }];
  });
  if (!reviews.length && Array.isArray(body.reviews) && body.reviews.length) {
    return NextResponse.json({ error: "Aucun avis valide." }, { status: 400 });
  }
  const { error } = await supabase.from("settings").upsert(
    { key: KEY, value: JSON.stringify(reviews), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
