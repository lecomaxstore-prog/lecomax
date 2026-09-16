import { publicDatabaseError } from "@/lib/public-error";
import type { NextRequest } from "next/server";
import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** GET /api/chat/sessions/[id] — messages for a session */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const securityDenied = await protectAdminRead(_req, { key: "chat/sessions/[id]/route.ts:GET" });
  if (securityDenied) return securityDenied;
  const { id } = await params;
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", id)
    .order("timestamp", { ascending: true });

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data || []);
}

/** PATCH /api/chat/sessions/[id] — update session status or clear unread */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const securityDenied = await protectAdminMutation(req, { key: "chat/sessions/[id]/route.ts:PATCH" });
  if (securityDenied) return securityDenied;
  const { id } = await params;
  const body = await readJsonLimited(req);

  const { error } = await supabase
    .from("chat_sessions")
    .update(body)
    .eq("id", id);

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
