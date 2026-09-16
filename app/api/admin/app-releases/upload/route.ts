import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";
import { releaseSupabase } from "@/lib/app-release-server";
import {
  APP_RELEASE_BUCKET,
  releaseStoragePath,
  validateReleaseDraft,
} from "@/lib/app-releases";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, {
    key: "app-releases:upload-ticket",
    limit: 8,
    windowMs: 600_000,
  });
  if (blocked) return blocked;
  const body = await readJsonLimited(req).catch(() => null);
  const parsed = validateReleaseDraft(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { versionName, versionCode } = parsed.data;
  const client = releaseSupabase();
  const { data: existing } = await client
    .from("app_releases")
    .select("id")
    .or(`version_code.eq.${versionCode},version_name.eq.${versionName}`)
    .limit(1);
  if (existing?.length) {
    return NextResponse.json({ error: "Cette version ou ce code Android existe déjà." }, { status: 409 });
  }

  const path = releaseStoragePath(versionName, versionCode);
  const { data, error } = await client.storage
    .from(APP_RELEASE_BUCKET)
    .createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) {
    return NextResponse.json({ error: "Impossible de préparer l’envoi sécurisé." }, { status: 500 });
  }
  return NextResponse.json({
    bucket: APP_RELEASE_BUCKET,
    path,
    token: data.token,
    expiresIn: 7200,
  });
}
