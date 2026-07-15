import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Params = { params: Promise<{ id: string }> };

/** GET /api/whatsapp/conversations/[id] — get messages for a conversation */
export async function GET(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
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
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  if (!body || typeof body !== "object" || !["active", "escalated", "resolved"].includes(body.status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }
  const update = { status: body.status };

  const { error } = await supabase
    .from("whatsapp_conversations")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
