import { publicDatabaseError } from "@/lib/public-error";
import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const securityDenied = await protectAdminMutation(req, { key: "messages/[id]/route.ts:PUT" });
  if (securityDenied) return securityDenied;
  const { id } = await params;
  const body = await readJsonLimited(req);
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ read: body.read === true })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const securityDenied = await protectAdminMutation(_req, { key: "messages/[id]/route.ts:DELETE" });
  if (securityDenied) return securityDenied;
  const { id } = await params;
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 400 });
  return NextResponse.json({ ok: true });
}
