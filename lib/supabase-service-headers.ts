/**
 * Headers for direct Supabase REST/Auth requests made by the server.
 * New `sb_secret_...` keys are API keys, not JWT Bearer tokens.
 */
import { supabaseHeaders } from "../operations/seo-vercel/lib/supabase-headers.mjs";

export function supabaseServiceHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return {
    ...extra,
    ...supabaseHeaders(key),
  };
}
