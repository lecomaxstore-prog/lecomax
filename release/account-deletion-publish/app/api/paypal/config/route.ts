import { NextResponse } from "next/server";
import { isPayPalEnabled } from "@/lib/paypal-server";

export function GET() {
  return NextResponse.json(
    { enabled: isPayPalEnabled() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
