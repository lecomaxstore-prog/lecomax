import "server-only";

import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getEcomediaUser } from "@/lib/ecomedia-auth";
import { verifySessionToken } from "@/lib/admin-session";
import { getAdminAccess } from "./admin-access";
import { adminApiPermission, hasAdminPermission } from "./admin-policy";
import { sameRequestOrigin } from "./request-origin";
import { securityLog } from "./security-log";

export async function getCustomerUser(req: NextRequest): Promise<User | null> {
  return getEcomediaUser(req);
}

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !sameRequestOrigin(req)) {
    securityLog("origin_denied", new URL(req.url).pathname);
    return false;
  }
  const access = await getAdminAccess(req);
  const allowed = hasAdminPermission(access, adminApiPermission(new URL(req.url).pathname, req.method));
  if (!allowed && req.cookies.get("admin_session")) securityLog("authorization_denied", new URL(req.url).pathname);
  return allowed;
}
