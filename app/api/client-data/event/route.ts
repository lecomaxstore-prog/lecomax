import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_EVENT_TYPES = new Set([
  "page_view",
  "product_view",
  "cart_add",
  "cart_remove",
  "search",
  "checkout_start",
  "checkout_complete",
]);

// POST — record a behavioral event
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, event_type, path, title, product_id, product_name, category, query, extra } =
    body as Record<string, unknown>;

  if (!session_id || typeof session_id !== "string") {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }
  if (!event_type || typeof event_type !== "string" || !ALLOWED_EVENT_TYPES.has(event_type)) {
    return NextResponse.json({ error: "invalid event_type" }, { status: 400 });
  }

  // Verify consent exists and has not been revoked
  const { data: consent } = await supabase
    .from("data_collection_consents")
    .select("id, revoked_at")
    .eq("session_id", session_id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!consent) {
    return NextResponse.json({ error: "no_consent" }, { status: 403 });
  }

  const { error } = await supabase.from("client_behavioral_events").insert({
    session_id,
    event_type,
    path: typeof path === "string" ? path.slice(0, 500) : null,
    title: typeof title === "string" ? title.slice(0, 200) : null,
    product_id: typeof product_id === "string" ? product_id.slice(0, 100) : null,
    product_name: typeof product_name === "string" ? product_name.slice(0, 200) : null,
    category: typeof category === "string" ? category.slice(0, 100) : null,
    query: typeof query === "string" ? query.slice(0, 200) : null,
    extra: typeof extra === "object" && extra !== null ? extra : null,
  });

  if (error) {
    console.error("client_behavioral_events insert error:", error.message);
    return NextResponse.json({ ok: true, warning: "table_missing" });
  }

  return NextResponse.json({ ok: true });
}
