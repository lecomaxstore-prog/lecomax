import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Params = { params: Promise<{ id: string }> };

/** GET /api/whatsapp/conversations/[id] — get messages for a conversation */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const { data: messages, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("timestamp", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark conversation as read (reset unread_count)
  await supabase
    .from("whatsapp_conversations")
    .update({ unread_count: 0 })
    .eq("id", id);

  return NextResponse.json(messages || []);
}

/** PATCH /api/whatsapp/conversations/[id] — update status */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ["status"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const { error } = await supabase
    .from("whatsapp_conversations")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
