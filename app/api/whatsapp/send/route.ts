import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  try {
    const requestBody = await readJsonLimited(req);
    const conversation_id = typeof requestBody.conversation_id === "string" ? requestBody.conversation_id : "";
    const phone = typeof requestBody.phone === "string" ? requestBody.phone.replace(/[^0-9]/g, "").slice(0, 20) : "";
    const body = typeof requestBody.body === "string" ? requestBody.body.trim().slice(0, 4000) : "";
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
