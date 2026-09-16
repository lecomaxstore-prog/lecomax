import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function needsLegacySchemaFallback(error: { message: string; code?: string } | null) {
  if (!error) return false;
  return (error.code === "42703" || error.code === "PGRST204") && /reminded_at/i.test(error.message);
}

// PATCH /api/abandoned-carts/[id] — admin-only contact status update.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });

  let result = await supabase
    .from("abandoned_carts")
    .update({ reminded: true, reminded_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,reminded,reminded_at")
    .maybeSingle();

  if (needsLegacySchemaFallback(result.error)) {
    result = await supabase
      .from("abandoned_carts")
      .update({ reminded: true })
      .eq("id", id)
      .select("id,reminded")
      .maybeSingle();
  }

  if (result.error) {
    console.error("[abandoned-carts] status update failed", result.error);
    return NextResponse.json({ error: "Impossible de mettre à jour ce panier." }, { status: 503 });
  }
  if (!result.data) return NextResponse.json({ error: "Panier introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true, cart: result.data });
}
