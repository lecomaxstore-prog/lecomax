import { NextRequest, NextResponse } from "next/server";

// In-memory typing state — ephemeral by design (5-second TTL)
const typingMap = new Map<string, number>(); // session_id → epoch ms

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { session_id, typing } = body as { session_id?: string; typing?: boolean };
  if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  if (typing) typingMap.set(session_id, Date.now());
  else typingMap.delete(session_id);

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ typing: false });

  const ts = typingMap.get(session_id);
  const typing = ts !== undefined && Date.now() - ts < 5000;
  if (!typing && ts !== undefined) typingMap.delete(session_id); // cleanup expired
  return NextResponse.json({ typing });
}
