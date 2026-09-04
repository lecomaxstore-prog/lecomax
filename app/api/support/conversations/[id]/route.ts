import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api-security";
import { getCustomerUser } from "@/lib/request-auth";
import { supportDatabase } from "@/lib/support-server";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const limited = enforceRateLimit(req, `support-read:${user.id}`, 120, 60_000);
  if (limited) return limited;
  const { id } = await context.params;
  const db = supportDatabase();
  const { data: conversation } = await db.from("support_conversations").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  const { data: messages, error } = await db.from("support_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }).limit(500);
  if (error) return NextResponse.json({ error: "Impossible de charger les messages." }, { status: 500 });
  const now = new Date().toISOString();
  await Promise.all([
    db.from("support_conversations").update({ customer_unread: 0, updated_at: now }).eq("id", id).eq("user_id", user.id),
    db.from("support_messages").update({ read_at: now }).eq("conversation_id", id).eq("sender_type", "support").is("read_at", null),
  ]);
  return NextResponse.json({ conversation: { ...conversation, customer_unread: 0 }, messages: messages ?? [] });
}
