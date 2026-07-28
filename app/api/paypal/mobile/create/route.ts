import { NextRequest, NextResponse } from "next/server";
import { createPayPalCheckout } from "@/lib/paypal-server";
import { enforceRateLimit } from "@/lib/api-security";

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, "paypal:mobile:create", 10, 60_000);
  if (blocked) return blocked;
  if (request.headers.get("x-lecomax-client") !== "mobile_app") {
    return NextResponse.json({ error: "Client non autorisé." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    amount?: unknown;
    requestId?: unknown;
  } | null;
  const amount = Number(body?.amount);
  const requestId =
    typeof body?.requestId === "string" ? body.requestId.trim() : "";

  try {
    return NextResponse.json(
      await createPayPalCheckout({ amountMad: amount, requestId }),
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYPAL_CREATE_FAILED";
    const configurationError = [
      "PAYPAL_NOT_CONFIGURED",
      "PAYPAL_AUTH_FAILED",
    ].includes(code);
    console.error("Mobile PayPal order creation failed:", code);
    return NextResponse.json(
      {
        error: configurationError
          ? "PayPal est momentanément indisponible."
          : "Impossible de démarrer le paiement PayPal.",
        code,
      },
      { status: configurationError ? 503 : 422 },
    );
  }
}
