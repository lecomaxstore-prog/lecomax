import "server-only";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export function supportFailure(error: { code?: string } | null, fallback: string) {
  const missing = ["PGRST202", "PGRST205", "42P01", "42883"].includes(error?.code ?? "");
  const status = missing ? 503 : error?.code === "P0002" ? 404 : error?.code === "22023" ? 409 : 500;
  return NextResponse.json({
    error: missing ? "L’assistance est momentanément indisponible. Réessayez plus tard." : fallback,
    code: missing ? "SUPPORT_SETUP_REQUIRED" : "SUPPORT_REQUEST_FAILED",
  }, { status, headers: { "Cache-Control": "no-store" } });
}

export function supportDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Support database is not configured.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function supportCustomerName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  const value = metadata.full_name ?? metadata.name ?? metadata.prenom ?? user.email?.split("@")[0] ?? "Client L’ECOMAX";
  return String(value).trim().slice(0, 80) || "Client L’ECOMAX";
}
