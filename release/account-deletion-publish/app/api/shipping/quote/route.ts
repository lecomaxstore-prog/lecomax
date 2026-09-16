import { NextRequest, NextResponse } from "next/server";
import { loadCommerceConfiguration } from "@/lib/commerce-server";
import { shippingConfigFromSettings } from "@/lib/shipping-config";
import { resolveShippingQuote } from "@/lib/shipping-zones";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim().slice(0, 100) ?? "";
  const subtotal = Number(req.nextUrl.searchParams.get("subtotal"));
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Sous-total invalide." }, { status: 400 });
  }

  try {
  const { settings, zones } = await loadCommerceConfiguration();
  const quote = resolveShippingQuote(city, subtotal, zones, shippingConfigFromSettings(settings));
  return NextResponse.json(quote, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Tarifs de livraison indisponibles.", code: "SETTINGS_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
