import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  const body = await req.json();
  const reviews = Array.isArray(body.reviews) ? body.reviews : [];
  const { error } = await supabase.from("settings").upsert(
    { key: KEY, value: JSON.stringify(reviews), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
