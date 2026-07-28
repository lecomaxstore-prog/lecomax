import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { cleanCouponPayload } from "@/lib/coupon-admin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "coupons:list", limit: 90 });
  if (blocked) return blocked;
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "coupons:create", limit: 20 });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const cleaned = cleanCouponPayload({ ...((body && typeof body === "object") ? body : {}), active: true });
  if (!cleaned.payload) {
    return NextResponse.json({ error: cleaned.error }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      ...cleaned.payload,
      used_count: 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
