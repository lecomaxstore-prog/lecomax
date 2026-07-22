import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { shippingConfigFromSettings } from "@/lib/shipping-config";
import { resolveShippingQuote, type ShippingZoneRule } from "@/lib/shipping-zones";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim().slice(0, 100) ?? "";
  const subtotal = Number(req.nextUrl.searchParams.get("subtotal"));
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Sous-total invalide." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const [{ data: zones, error: zonesError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("shipping_zones").select("id,name,cities,standard_rate,free_threshold,estimated_days,sort_order,active").eq("active", true),
    supabase.from("settings").select("key,value").in("key", ["shipping_cost", "free_shipping_threshold", "shipping_estimated_days"]),
  ]);
  if (zonesError || settingsError) {
    return NextResponse.json({ error: "Tarifs de livraison indisponibles." }, { status: 503 });
  }

  const fallback = shippingConfigFromSettings(Object.fromEntries((settings ?? []).map((row) => [row.key, row.value])));
  const quote = resolveShippingQuote(city, subtotal, (zones ?? []) as ShippingZoneRule[], fallback);
  return NextResponse.json(quote, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
