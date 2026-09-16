import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import * as tus from "tus-js-client";
import { supabaseUrl, serviceRoleKey } from "./supabase-admin-env.mjs";
import { trustedApkArtifact } from "../lib/app-release-hosts.ts";

const root = path.resolve(import.meta.dirname, "..");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "mobile", "release.config.json"), "utf8"),
);
const artifact = path.resolve(
  root,
  process.argv[2] || path.join("release", "android", config.apkFileName),
);

if (!fs.existsSync(artifact)) throw new Error(`APK not found: ${artifact}`);
const bytes = fs.readFileSync(artifact);
if (bytes.length < 1024 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
  throw new Error("The release artifact is not a valid APK archive.");
}

const externalArtifactUrl = process.env.ANDROID_EXTERNAL_URL
  ? new URL(process.env.ANDROID_EXTERNAL_URL)
  : null;
if (
  externalArtifactUrl &&
  !trustedApkArtifact(externalArtifactUrl.href)
) {
  throw new Error("ANDROID_EXTERNAL_URL must be an official Expo or Lecomax GitHub APK artifact URL.");
}
const storagePath = externalArtifactUrl
  ? `external:${externalArtifactUrl.href}`
  : `android/${config.versionCode}/${config.apkFileName}`;
const sha256 = createHash("sha256").update(bytes).digest("hex");
const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing, error: existingError } = await client
  .from("app_releases")
  .select("id,published,sha256")
  .eq("platform", "android")
  .eq("version_code", config.versionCode)
  .maybeSingle();
if (existingError) throw existingError;

let releaseId = existing?.id;
if (existing) {
  if (existing.sha256 !== sha256) {
    throw new Error("Version code already exists with a different APK checksum.");
  }
} else {
  if (!externalArtifactUrl) {
    const { data: uploadTicket, error: uploadTicketError } =
      await client.storage
        .from("app-releases")
        .createSignedUploadUrl(storagePath, { upsert: false });
    if (uploadTicketError || !uploadTicket?.token) {
      throw uploadTicketError || new Error("Unable to create a signed upload token.");
    }
    const storageUrl = new URL(supabaseUrl);
    storageUrl.hostname = storageUrl.hostname.replace(
      ".supabase.co",
      ".storage.supabase.co",
    );
    await new Promise((resolve, reject) => {
      const upload = new tus.Upload(bytes, {
        endpoint: `${storageUrl.origin}/storage/v1/upload/resumable`,
        retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
        chunkSize: 6 * 1024 * 1024,
        headers: {
          apikey: serviceRoleKey,
          "x-signature": uploadTicket.token,
          "x-upsert": "false",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: "app-releases",
          objectName: storagePath,
          contentType: "application/vnd.android.package-archive",
          cacheControl: "3600",
        },
        onError: (error) =>
          reject(
            new Error(
              error?.originalResponse
                ? `Resumable upload failed (${error.originalResponse.getStatus()}): ${error.originalResponse.getBody()}`
                : error instanceof Error
                  ? error.message.split(", originated from request", 1)[0]
                  : "Resumable upload failed.",
            ),
          ),
        onSuccess: resolve,
      });
      upload.start();
    });
  }

  const { data: release, error: insertError } = await client
    .from("app_releases")
    .insert({
      platform: "android",
      version_name: config.versionName,
      version_code: config.versionCode,
      storage_path: storagePath,
      file_name: config.apkFileName,
      file_size: bytes.length,
      sha256,
      minimum_android_version: config.minimumAndroidVersion,
      release_notes: config.releaseNotes,
      required: config.required === true,
      created_by: "release-script",
    })
    .select("id")
    .single();
  if (insertError) {
    if (!externalArtifactUrl) {
      await client.storage.from("app-releases").remove([storagePath]);
    }
    throw insertError;
  }
  releaseId = release.id;
}

if (!existing?.published) {
  const { error: publishError } = await client.rpc("publish_android_release", {
    target_release_id: releaseId,
    actor: "release-script",
    audit_action: "published",
  });
  if (publishError) throw publishError;
}

console.log(
  JSON.stringify({
    published: true,
    versionName: config.versionName,
    versionCode: config.versionCode,
    fileName: config.apkFileName,
    fileSize: bytes.length,
    sha256,
  }),
);
