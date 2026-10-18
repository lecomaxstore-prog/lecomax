import "server-only";
import { createOwnerAuth, ownerConfig, AuthError } from "./owner-auth-core";
import { ownerDatabase } from "./owner-auth-database.mjs";
import { readJsonLimited } from "./request-body";
import { NextRequest, NextResponse } from "next/server";
export function ownerAuth() {
  return createOwnerAuth(ownerDatabase(), ownerConfig());
}
export const bearer = (req: Request) =>
  req.headers.get("authorization")?.replace(/^Bearer /, "") || "";
export async function ownerAuthRoute(req: NextRequest, action: string) {
  const json = (body: unknown, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        Pragma: "no-cache",
        ...(status === 429 ? { "Retry-After": "300" } : {}),
      },
    });
  try {
    if (
      process.env.NODE_ENV === "production" &&
      req.nextUrl.protocol !== "https:" &&
      !(
        process.env.OWNER_TRUST_PROXY === "1" &&
        req.headers.get("x-forwarded-proto") === "https"
      )
    )
      return json({ error: "HTTPS_REQUIRED" }, 400);
    const auth = ownerAuth();
    if (action === "sessions" && req.method === "GET")
      return json(await auth.sessions(bearer(req)));
    const body = await readJsonLimited(req, 4096).catch(() => null);
    if (!body || typeof body !== "object")
      return json({ error: "INVALID_INPUT" }, 400);
    if (action === "login") {
      // Only trust a proxy that overwrites this header. Otherwise use a shared bucket.
      const ip =
        process.env.OWNER_TRUST_PROXY === "1"
          ? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown"
          : "shared";
      return json(await auth.login(body.email, body.password, ip));
    }
    if (action === "confirm")
      return json(
        await auth.confirm(body.challenge, body.remember, body.device),
      );
    if (action === "refresh")
      return json(await auth.refresh(body.refreshToken));
    if (action === "logout") return json(await auth.logout(body.refreshToken));
    if (action === "sessions")
      return json(await auth.revoke(bearer(req), body.target));
    return json({ error: "NOT_FOUND" }, 404);
  } catch (error) {
    if (error instanceof AuthError)
      return json({ error: error.message }, error.status);
    console.error("learning_auth_unavailable");
    return json({ error: "UNAVAILABLE" }, 503);
  }
}
