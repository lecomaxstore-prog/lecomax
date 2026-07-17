import "server-only";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_TIMEOUT_MS = 1800;

function timeoutFetch(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = init?.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;
    return fetch(input, { ...init, signal });
  };
}

/** A server-only Supabase client that fails fast and lets pages use local fallbacks. */
export function createServerSupabaseClient(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timeoutFetch(timeoutMs) },
  });
}
