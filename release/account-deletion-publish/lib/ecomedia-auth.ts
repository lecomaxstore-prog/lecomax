import "server-only";
import type { NextRequest } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";

const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function getEcomediaUser(req: NextRequest): Promise<User | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  return error ? null : data.user;
}

export function communityDisplayName(user: User): string {
  const metadata = user.user_metadata ?? {};
  const value = metadata.full_name ?? metadata.name ?? metadata.prenom ?? user.email?.split("@")[0] ?? "Membre";
  return String(value).trim().slice(0, 50) || "Membre";
}

export function communityAvatar(user: User): string | null {
  const value = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  return typeof value === "string" && value.startsWith("http") ? value.slice(0, 500) : null;
}
