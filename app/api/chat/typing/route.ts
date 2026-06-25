import { NextRequest, NextResponse } from "next/server";

// Separate maps for each direction — ephemeral, 5-second TTL
const agentTypingMap = new Map<string, number>();  // admin → client
const clientTypingMap = new Map<string, number>(); // client → admin

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { session_id, typing, from } = body as { session_id?: string; typing?: boolean; from?: "agent" | "client" };
  if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const map = from === "client" ? clientTypingMap : agentTypingMap;
  if (typing) map.set(session_id, Date.now());
  else map.delete(session_id);

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get("session_id");
  const from = req.nextUrl.searchParams.get("from") ?? "agent";
  if (!session_id) return NextResponse.json({ typing: false });

  const map = from === "client" ? clientTypingMap : agentTypingMap;
  const ts = map.get(session_id);
  const typing = ts !== undefined && Date.now() - ts < 5000;
  if (!typing && ts !== undefined) map.delete(session_id);
  return NextResponse.json({ typing });
}
