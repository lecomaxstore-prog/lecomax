import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";
import { cleanCouponPayload } from "@/lib/coupon-admin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "coupons:update", limit: 40 });
  if (blocked) return blocked;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const cleaned = cleanCouponPayload(body, true);
  if (!cleaned.payload || !Object.keys(cleaned.payload).length) {
    return NextResponse.json({ error: cleaned.error ?? "Aucune modification valide." }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("coupons")
    .update(cleaned.payload)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "coupons:delete", limit: 20 });
  if (blocked) return blocked;
  const { id } = await params;
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
