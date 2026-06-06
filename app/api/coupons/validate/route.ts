import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { code, order_total } = await req.json();
  if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .single();

  if (error || !data) return NextResponse.json({ error: "Code invalide ou inactif" }, { status: 404 });

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Ce code promo a expiré" }, { status: 400 });
  }

  // Check max uses
  if (data.max_uses !== null && data.used_count >= data.max_uses) {
    return NextResponse.json({ error: "Ce code promo a atteint son nombre d'utilisations maximum" }, { status: 400 });
  }

  // Check min order
  if (data.min_order !== null && order_total < data.min_order) {
    return NextResponse.json({ error: `Commande minimum de ${data.min_order} MAD requis` }, { status: 400 });
  }

  // Calculate discount
  const discount = data.type === "percent"
    ? Math.round(order_total * data.value / 100)
    : Math.min(data.value, order_total);

  return NextResponse.json({
    id: data.id,
    code: data.code,
    type: data.type,
    value: data.value,
    discount,
  });
}
