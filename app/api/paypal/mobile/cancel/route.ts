import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect("lecomax://paypal?status=cancelled", 302);
}
