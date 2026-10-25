import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseCredential } from "../operations/seo-vercel/lib/environment-target.mjs";

const DEFAULT_TIMEOUT_MS = 1800;

function timeoutFetch(timeoutMs: number, publicCache: { revalidate: number; tags: string[] } | undefined, configuredUrl: string, configuredKey: string): typeof fetch {
  return async (input, init) => {
    if (configuredUrl !== process.env.NEXT_PUBLIC_SUPABASE_URL || configuredKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw Error("ENVIRONMENT_ISOLATION_REQUIRED");
    }
    const target = await supabaseCredential(process.env, configuredUrl,
      configuredKey, process.env.SUPABASE_SERVICE_KEY_BINDING, "service_role");
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.origin !== target.origin) throw Error("ENVIRONMENT_ISOLATION_REQUIRED");
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = init?.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const caching = publicCache && method === "GET"
      ? { cache: "force-cache" as const, next: publicCache }
      : { cache: "no-store" as const };
    return fetch(input, { ...init, ...caching, signal, redirect: "error" });
  };
}

/** A server-only Supabase client that fails fast and lets pages use local fallbacks. */
export function createServerSupabaseClient(timeoutMs = DEFAULT_TIMEOUT_MS, publicCache?: { revalidate: number; tags: string[] }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timeoutFetch(timeoutMs, publicCache, url, key) },
  });
}

/** Only for public storefront reads. Auth, admin and checkout keep the uncached default. */
export function createPublicSupabaseClient(tags: string[], revalidate = 300) {
  return createServerSupabaseClient(DEFAULT_TIMEOUT_MS, { revalidate, tags });
}
