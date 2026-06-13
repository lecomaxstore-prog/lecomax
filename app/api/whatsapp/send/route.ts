import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

export async function POST(req: Request) {
  try {
    const { conversation_id, phone, body } = await req.json();
    if (!phone || !body || !conversation_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Send via Meta Cloud API
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WA_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err }, { status: 502 });
    }

    // Save to DB
    await supabase.from("whatsapp_messages").insert({
      conversation_id,
      direction: "out",
      body,
      sent_by: "agent",
    });

    // Keep conversation as escalated (agent is handling), update last message
    await supabase
      .from("whatsapp_conversations")
      .update({ last_message: body, last_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("WA send error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
