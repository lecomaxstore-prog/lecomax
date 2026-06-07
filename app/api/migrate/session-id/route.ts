import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// One-time migration endpoint — adds session_id column to page_views.
// Protected by a secret query param. DELETE after use.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "lxmigrate2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // First check if column already exists
  const { error: checkErr } = await sb
    .from("page_views")
    .insert({ path: "/__session_check", session_id: "__test" });

  if (!checkErr) {
    await sb.from("page_views").delete().eq("path", "/__session_check");
    return NextResponse.json({ status: "ok", message: "session_id column already exists ✓" });
  }

  if (checkErr.code !== "PGRST204") {
    return NextResponse.json({ status: "error", message: checkErr.message });
  }

  // Column missing — use raw fetch to the Postgres meta API
  // Supabase exposes a pg.query-style endpoint via the service role
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Try via the supabase-js internal __fetch to run DDL
  // PostgREST itself can't do DDL, but supabase has a pg endpoint for service role
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id text;" }),
  });

  if (res.ok) {
    return NextResponse.json({ status: "ok", message: "session_id column added ✓" });
  }

  const resText = await res.text();
  return NextResponse.json({
    status: "manual_required",
    http: res.status,
    body: resText,
    message: "Run this in Supabase SQL editor:",
    sql: "ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id text;",
  });
}
