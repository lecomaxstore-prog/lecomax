import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { enforceRateLimit } from "@/lib/api-security";
import { isPayPalEnabled } from "@/lib/paypal-server";
import {
  PAYMENT_SETTING_KEYS,
  paymentMethodAvailability,
  paymentMethodsFromSettings,
} from "@/lib/payment-methods";

export async function GET(request: NextRequest) {
  const blocked = enforceRateLimit(request, "payment-methods:read", 120, 60_000);
  if (blocked) return blocked;
  const city = request.nextUrl.searchParams.get("city")?.trim().slice(0, 100) ?? "";
  const subtotal = Number(request.nextUrl.searchParams.get("subtotal") ?? 0);
  if (!Number.isFinite(subtotal) || subtotal < 0 || subtotal > 1_000_000) {
    return NextResponse.json({ error: "Sous-total invalide." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key,value")
    .in("key", ["enable_cod", "enable_paypal", ...PAYMENT_SETTING_KEYS]);
  if (error) {
    return NextResponse.json(
      { error: "Moyens de paiement indisponibles." },
      { status: 503 },
    );
  }
  const settings = Object.fromEntries(
    (data ?? []).map((row) => [row.key, row.value]),
  );
  const methods = paymentMethodsFromSettings(settings).map((method) => {
    const availability = paymentMethodAvailability(method, city, subtotal);
    const configured =
      method.provider !== "paypal" || isPayPalEnabled();
    return {
      ...method,
      available: availability.available && configured,
      unavailableReason: configured
        ? availability.reason
        : method.unavailableMessage,
    };
  });
  return NextResponse.json(methods, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
