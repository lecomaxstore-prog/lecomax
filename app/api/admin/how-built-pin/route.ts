import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifySessionToken } from "@/lib/admin-session";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MARKER = "how-built-pin@lecomax.local";
const OWNER_PIN = "1970";

async function requireOwner(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  const email = session ? await verifySessionToken(session) : null;
  const owner = (process.env.ADMIN_EMAIL ?? "contact@lecomax.com").trim().toLowerCase();
  return email?.trim().toLowerCase() === owner ? email : null;
}

function clientKey(req: NextRequest, email: string) {
  return `${email}:${req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"}`;
}

export async function GET(req: NextRequest) {
  if (!(await requireOwner(req))) return NextResponse.json({ error: "Accès réservé au propriétaire." }, { status: 403 });
  const access = req.cookies.get("how_built_access")?.value;
  const valid = access ? (await verifySessionToken(access, 8 * 60 * 60 * 1000)) === MARKER : false;
  return valid ? NextResponse.json({ unlocked: true }) : NextResponse.json({ unlocked: false }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const email = await requireOwner(req);
  if (!email) return NextResponse.json({ error: "Accès réservé au propriétaire." }, { status: 403 });

  const key = clientKey(req, email);
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= 5) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
  }
  if (!current || current.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  else current.count += 1;

  const body = await req.json().catch(() => null);
  if (typeof body?.pin !== "string" || body.pin !== OWNER_PIN) {
    return NextResponse.json({ error: "Code PIN incorrect." }, { status: 401 });
  }

  attempts.delete(key);
  const token = await createSessionToken(MARKER);
  const response = NextResponse.json({ unlocked: true });
  response.cookies.set("how_built_access", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 8 * 60 * 60,
    path: "/admin/how-it-was-built",
  });
  return response;
}

export async function DELETE(req: NextRequest) {
  if (!(await requireOwner(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const response = NextResponse.json({ locked: true });
  response.cookies.set("how_built_access", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 0, path: "/admin/how-it-was-built" });
  return response;
}
