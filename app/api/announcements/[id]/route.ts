import { publicDatabaseError } from "@/lib/public-error";
import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/announcements/[id]  — activate / deactivate / update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const securityDenied = await protectAdminMutation(req, { key: "announcements/[id]/route.ts:PUT" });
  if (securityDenied) return securityDenied;
  const { id } = await params;
  let body: unknown;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { data, error } = await supabase.from("announcements").update(body as object).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/announcements/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const securityDenied = await protectAdminMutation(_req, { key: "announcements/[id]/route.ts:DELETE" });
  if (securityDenied) return securityDenied;
  const { id } = await params;
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ success: true });
}
