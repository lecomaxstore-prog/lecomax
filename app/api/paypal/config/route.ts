import { NextResponse } from "next/server";

export function GET() {
  const enabled = Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() &&
    process.env.PAYPAL_CLIENT_SECRET?.trim() &&
    process.env.PAYPAL_WEBHOOK_ID?.trim(),
  );
  return NextResponse.json(
    { enabled },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
