import "server-only";

import { createClient } from "@supabase/supabase-js";

export function supportDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Support database is not configured.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function supportCustomerName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  const value = metadata.full_name ?? metadata.name ?? metadata.prenom ?? user.email?.split("@")[0] ?? "Client L’ECOMAX";
  return String(value).trim().slice(0, 80) || "Client L’ECOMAX";
}
