import "server-only";

import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getEcomediaUser } from "@/lib/ecomedia-auth";
import { verifySessionToken } from "@/lib/admin-session";

export async function getCustomerUser(req: NextRequest): Promise<User | null> {
  return getEcomediaUser(req);
}

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("admin_session")?.value;
  return token ? Boolean(await verifySessionToken(token)) : false;
}
