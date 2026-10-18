import "server-only";
import { AuthError } from "./owner-auth-core";
import { NextRequest, NextResponse } from "next/server";
import { ownerAuth, bearer } from "./owner-auth-server";
export const mobileJson = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function mobileOwner(req: NextRequest) {
  try {
    await ownerAuth().authenticate(bearer(req));
    return process.env.OWNER_EMAIL!.trim().toLowerCase();
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) return null;
    throw error;
  }
}
