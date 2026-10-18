import { NextRequest } from "next/server";
import { ownerAuthRoute } from "@/lib/owner-auth-server";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  return ownerAuthRoute(req, "logout");
}
