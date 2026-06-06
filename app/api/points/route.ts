import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/*
  Required Supabase table (run once in your SQL editor):

  CREATE TABLE IF NOT EXISTS user_points (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email       text UNIQUE NOT NULL,
    points      integer DEFAULT 0 NOT NULL,
    updated_at  timestamptz DEFAULT now()
  );
*/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const POINTS_PER_ORDER = 50;
const TIERS = [
  { name: "Gold",   min: 1000, next: null,  nextLabel: null },
  { name: "Silver", min: 500,  next: 1000,  nextLabel: "Gold" },
  { name: "Bronze", min: 0,    next: 500,   nextLabel: "Silver" },
];

export function getTier(points: number) {
  return TIERS.find((t) => points >= t.min) ?? TIERS[TIERS.length - 1];
}

// GET /api/points?email=xxx
export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const { data, error } = await supabase
    .from("user_points")
    .select("points")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const points = data?.points ?? 0;
  const tier = getTier(points);

  return NextResponse.json({ points, tier: tier.name, next: tier.next, nextLabel: tier.nextLabel });
}

// POST /api/points — add POINTS_PER_ORDER to a user's balance
// Body: { email: string, amount?: number }
export async function POST(req: NextRequest) {
  let body: { email?: string; amount?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { email, amount = POINTS_PER_ORDER } = body;
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  if (typeof amount !== "number" || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  // Upsert: increment if exists, create with `amount` if not
  const { data: existing } = await supabase
    .from("user_points")
    .select("points")
    .eq("email", email)
    .single();

  const newPoints = (existing?.points ?? 0) + amount;

  const { error } = await supabase
    .from("user_points")
    .upsert({ email, points: newPoints, updated_at: new Date().toISOString() }, { onConflict: "email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tier = getTier(newPoints);
  return NextResponse.json({ points: newPoints, tier: tier.name, next: tier.next, nextLabel: tier.nextLabel, awarded: amount });
}
