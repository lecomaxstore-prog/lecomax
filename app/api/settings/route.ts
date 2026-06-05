import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/settings
export async function GET() {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/settings  (upsert all keys)
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // body is expected to be Record<string, string>
  const rows = Object.entries(body as Record<string, string>).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
