import { NextRequest, NextResponse } from "next/server";
import { capturePayPalCheckout } from "@/lib/paypal-server";
import { enforceRateLimit } from "@/lib/api-security";

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, "paypal:mobile:capture", 15, 60_000);
  if (blocked) return blocked;
  if (request.headers.get("x-lecomax-client") !== "mobile_app") {
    return NextResponse.json({ error: "Client non autorisé." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    orderId?: unknown;
  } | null;
  const orderId =
    typeof body?.orderId === "string" ? body.orderId.trim() : "";

  try {
    return NextResponse.json(await capturePayPalCheckout(orderId));
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYPAL_CAPTURE_FAILED";
    console.error("Mobile PayPal capture failed:", code);
    return NextResponse.json(
      {
        error:
          code === "PAYPAL_NOT_CONFIGURED" || code === "PAYPAL_AUTH_FAILED"
            ? "La vérification PayPal est momentanément indisponible."
            : "PayPal n’a pas confirmé le paiement.",
        code,
      },
      { status: code === "PAYPAL_AUTH_FAILED" ? 503 : 422 },
    );
  }
}
