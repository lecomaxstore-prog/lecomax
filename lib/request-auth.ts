import "server-only";

import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getEcomediaUser } from "@/lib/ecomedia-auth";
import { verifySessionToken } from "@/lib/admin-session";
import { getAdminAccess } from "./admin-access";
import { adminApiPermission, hasAdminPermission } from "./admin-policy";

export async function getCustomerUser(req: NextRequest): Promise<User | null> {
  return getEcomediaUser(req);
}

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const access = await getAdminAccess(req);
  return hasAdminPermission(access, adminApiPermission(new URL(req.url).pathname, req.method));
}
