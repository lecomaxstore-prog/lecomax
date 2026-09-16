import { chatVisitor, chatVisitorToken, CHAT_VISITOR_COOKIE } from "@/lib/chat-ownership";
import { sameRequestOrigin } from "@/lib/request-origin";
import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkChatSession } from "@/lib/chat-session-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** POST /api/chat/start — create or resume a session for a visitor */
export async function POST(req: Request) {
  if (!sameRequestOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, fresh } = await readJsonLimited(req);
  const visitor_id = await chatVisitor(req) || crypto.randomUUID();
  const respond = async (value: unknown) => {
    const response = NextResponse.json(value, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(CHAT_VISITOR_COOKIE, await chatVisitorToken(visitor_id), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/chat", maxAge: 30 * 86400 });
    return response;
  };
  if (typeof visitor_id !== "string" || visitor_id.length < 8 || visitor_id.length > 100) return NextResponse.json({ error: "visitor_id required" }, { status: 400 });

  if (fresh === true) {
    const { error } = await supabase.from("chat_sessions").update({ status: "resolved", unread_count: 0 })
      .eq("visitor_id", visitor_id).neq("status", "resolved");
    if (error) return NextResponse.json({ error: "Unable to close previous conversation" }, { status: 503 });
  }

  // Resume existing open session
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("visitor_id", visitor_id)
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const lifecycle = await checkChatSession(supabase, existing);
    if (lifecycle.status !== "resolved") return respond(existing);
  }

  // Create new session
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ visitor_id, name: name || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return respond(data);
}
