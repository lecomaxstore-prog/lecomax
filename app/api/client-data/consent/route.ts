import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST — register a new consent
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, browser, os, screen_width, screen_height, language, timezone, referrer } =
    body as Record<string, string | number | null>;

  if (!session_id || typeof session_id !== "string") {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  // Extract IP — Vercel sets x-forwarded-for
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip_address = forwarded ? forwarded.split(",")[0].trim() : (realIp ?? null);

  // Geo — populated automatically by Vercel Edge Network
  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const city = req.headers.get("x-vercel-ip-city") ?? null;
  const latitude = req.headers.get("x-vercel-ip-latitude") ?? null;
  const longitude = req.headers.get("x-vercel-ip-longitude") ?? null;

  // Upsert: if session already consented, update consented_at
  const { error } = await supabase.from("data_collection_consents").upsert(
    {
      session_id,
      consented_at: new Date().toISOString(),
      revoked_at: null,
      browser: browser ?? null,
      os: os ?? null,
      screen_width: screen_width ?? null,
      screen_height: screen_height ?? null,
      language: language ?? null,
      timezone: timezone ?? null,
      referrer: referrer ?? null,
      ip_address,
      country,
      city,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    },
    { onConflict: "session_id" }
  );

  if (error) {
    // Table may not exist yet — fail silently so UX is not broken
    console.error("data_collection_consents insert error:", error.message);
    return NextResponse.json({ ok: true, warning: "table_missing" });
  }

  return NextResponse.json({ ok: true });
}

// DELETE — revoke consent (soft delete with revoked_at timestamp)
export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id } = body as { session_id?: string };
  if (!session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  await supabase
    .from("data_collection_consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("session_id", session_id);

  return NextResponse.json({ ok: true });
}
