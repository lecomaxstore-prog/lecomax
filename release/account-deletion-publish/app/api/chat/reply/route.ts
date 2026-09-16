import { publicDatabaseError } from "@/lib/public-error";
import type { NextRequest } from "next/server";
import { protectAdminRead, protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkChatSession } from "@/lib/chat-session-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** POST /api/chat/reply — admin sends a reply to a session */
export async function POST(req: NextRequest) {
  const securityDenied = await protectAdminMutation(req, { key: "chat/reply/route.ts:POST" });
  if (securityDenied) return securityDenied;
  const { session_id, body } = await readJsonLimited(req);
  if (!session_id || !body?.trim()) {
    return NextResponse.json({ error: "session_id and body required" }, { status: 400 });
  }

  const { data: session } = await supabase.from("chat_sessions").select("*").eq("id", session_id).single();
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const lifecycle = await checkChatSession(supabase, session);
  if (lifecycle.status === "resolved") return NextResponse.json({ error: "Conversation terminée" }, { status: 409 });
  const { data: active } = await supabase.from("chat_sessions").update({ last_at: new Date().toISOString() })
    .eq("id", session_id).neq("status", "resolved").select("id").maybeSingle();
  if (!active) return NextResponse.json({ error: "Conversation terminée" }, { status: 409 });

  const { error } = await supabase.from("chat_messages").insert({
    session_id,
    direction: "out",
    body: body.trim(),
    sent_by: "agent",
  });

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });

  await supabase.from("chat_sessions").update({
    last_message: body.trim(),
    last_at: new Date().toISOString(),
  }).eq("id", session_id);

  return NextResponse.json({ ok: true });
}
