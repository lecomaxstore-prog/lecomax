import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifySessionToken } from "@/lib/admin-session";
import {
  APP_RELEASE_BUCKET,
  isApkHeader,
  type AndroidReleaseRow,
} from "@/lib/app-releases";

export function releaseSupabase() {
  return createServerSupabaseClient(15_000);
}

export async function adminActor(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  return token ? await verifySessionToken(token) : null;
}

export async function latestAndroidRelease() {
  const { data, error } = await releaseSupabase()
    .from("app_releases")
    .select("*")
    .eq("platform", "android")
    .eq("published", true)
    .order("version_code", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AndroidReleaseRow | null;
}

export async function hashStoredApk(storagePath: string) {
  const client = releaseSupabase();
  const { data, error } = await client.storage.from(APP_RELEASE_BUCKET).createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) throw new Error("APK_STORAGE_READ_FAILED");
  const response = await fetch(data.signedUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok || !response.body) throw new Error("APK_STORAGE_READ_FAILED");

  const hash = createHash("sha256");
  let total = 0;
  const header: number[] = [];
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const bytes = Buffer.from(value);
    total += bytes.length;
    if (header.length < 4) header.push(...bytes.subarray(0, 4 - header.length));
    hash.update(bytes);
  }
  if (!isApkHeader(Uint8Array.from(header))) throw new Error("APK_SIGNATURE_INVALID");
  return { sha256: hash.digest("hex"), fileSize: total };
}
