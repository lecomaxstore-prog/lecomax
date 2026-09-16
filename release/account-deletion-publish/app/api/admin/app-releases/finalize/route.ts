import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";
import { adminActor, hashStoredApk, releaseSupabase } from "@/lib/app-release-server";
import {
  APP_RELEASE_BUCKET,
  releaseStoragePath,
  validateReleaseDraft,
} from "@/lib/app-releases";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, {
    key: "app-releases:finalize",
    limit: 8,
    windowMs: 600_000,
  });
  if (blocked) return blocked;
  const body = await readJsonLimited(req).catch(() => null);
  const parsed = validateReleaseDraft(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const actor = await adminActor(req);
  if (!actor) return NextResponse.json({ error: "Session administrateur invalide." }, { status: 401 });

  const expectedPath = releaseStoragePath(parsed.data.versionName, parsed.data.versionCode);
  if ((body as Record<string, unknown>)?.storagePath !== expectedPath) {
    return NextResponse.json({ error: "Chemin de stockage invalide." }, { status: 400 });
  }

  const client = releaseSupabase();
  let verified: Awaited<ReturnType<typeof hashStoredApk>>;
  try {
    verified = await hashStoredApk(expectedPath);
  } catch (error) {
    await client.storage.from(APP_RELEASE_BUCKET).remove([expectedPath]);
    const message = error instanceof Error && error.message === "APK_SIGNATURE_INVALID"
      ? "Le fichier envoyé n’est pas une archive APK valide."
      : "Impossible de lire le fichier envoyé.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (verified.fileSize !== parsed.data.fileSize) {
    await client.storage.from(APP_RELEASE_BUCKET).remove([expectedPath]);
    return NextResponse.json({ error: "La taille du fichier envoyé ne correspond pas." }, { status: 400 });
  }

  try {
    const fileName = `lecomax-v${parsed.data.versionName}.apk`;
    const { data, error } = await client
      .from("app_releases")
      .insert({
        platform: "android",
        version_name: parsed.data.versionName,
        version_code: parsed.data.versionCode,
        storage_path: expectedPath,
        file_name: fileName,
        file_size: verified.fileSize,
        sha256: verified.sha256,
        minimum_android_version: parsed.data.minimumAndroidVersion,
        release_notes: parsed.data.releaseNotes,
        required: parsed.data.required,
        created_by: actor,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await client.from("app_release_audit").insert({
      release_id: data.id,
      actor_email: actor,
      action: "created",
      details: { versionName: parsed.data.versionName, versionCode: parsed.data.versionCode },
    });
    return NextResponse.json({ release: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible d’enregistrer cette version." }, { status: 400 });
  }
}
