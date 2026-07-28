import { NextRequest, NextResponse } from "next/server";

const PAYPAL_ID = /^[A-Z0-9_-]{8,64}$/i;

export function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("token") ?? "";
  const redirect = new URL("lecomax://paypal");
  redirect.searchParams.set(
    "status",
    PAYPAL_ID.test(orderId) ? "approved" : "error",
  );
  if (PAYPAL_ID.test(orderId)) redirect.searchParams.set("orderId", orderId);
  return NextResponse.redirect(redirect, 302);
}
