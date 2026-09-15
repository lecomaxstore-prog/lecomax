import { publicDatabaseError } from "@/lib/public-error";
import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/announcements
export async function GET() {
  const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/announcements
export async function POST(req: NextRequest) {
  const securityDenied = await protectAdminMutation(req, { key: "announcements/route.ts:POST" });
  if (securityDenied) return securityDenied;
  let body: unknown;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { data, error } = await supabase.from("announcements").insert(body as object).select().single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
