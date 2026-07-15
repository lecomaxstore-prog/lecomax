import { NextResponse } from "next/server";
import { getServerShippingConfig } from "@/lib/shipping-config-server";

export async function GET() {
  const config = await getServerShippingConfig();
  return NextResponse.json(config, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
