import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api-security";
import { releaseSupabase } from "@/lib/app-release-server";
import { APP_RELEASE_BUCKET } from "@/lib/app-releases";
import { trustedApkArtifact } from "@/lib/app-release-hosts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

type Context = { params: Promise<{ filename: string }> };

async function serve(req: NextRequest, context: Context, includeBody: boolean) {
  const limited = enforceRateLimit(req, "app-release:download", 60, 60_000);
  if (limited) return limited;
  const { filename } = await context.params;
  if (!/^lecomax-v[0-9A-Za-z.-]+\.apk$/.test(filename)) {
    return NextResponse.json({ error: "Fichier Android introuvable." }, { status: 404 });
  }
  const client = releaseSupabase();
  const { data: release, error } = await client
    .from("app_releases")
    .select("id,storage_path,file_name,file_size,sha256")
    .eq("file_name", filename)
    .eq("platform", "android")
    .eq("published", true)
    .maybeSingle();
  if (error || !release) return NextResponse.json({ error: "Fichier Android introuvable." }, { status: 404 });

  if (release.storage_path.startsWith("external:")) {
    const externalUrl = trustedApkArtifact(release.storage_path.slice("external:".length));
    if (!externalUrl) {
      return NextResponse.json(
        { error: "Le téléchargement est temporairement indisponible." },
        { status: 503 },
      );
    }
    if (includeBody) {
      await client.rpc("increment_app_release_download", {
        target_release_id: release.id,
      });
    }
    return NextResponse.redirect(externalUrl, 307);
  }

  const { data, error: signedUrlError } = await client.storage
    .from(APP_RELEASE_BUCKET)
    .createSignedUrl(release.storage_path, 300);
  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.json({ error: "Le téléchargement est temporairement indisponible." }, { status: 503 });
  }
  const range = req.headers.get("range");
  const storageResponse = await fetch(data.signedUrl, {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(120_000),
  });
  if (!storageResponse.ok && storageResponse.status !== 206) {
    return NextResponse.json({ error: "Le téléchargement est temporairement indisponible." }, { status: 503 });
  }

  if (includeBody && (!range || range.startsWith("bytes=0-"))) {
    await client.rpc("increment_app_release_download", { target_release_id: release.id });
  }
  const headers = new Headers({
    "Content-Type": "application/vnd.android.package-archive",
    "Content-Disposition": `attachment; filename="${release.file_name}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": storageResponse.headers.get("accept-ranges") || "bytes",
    "X-APK-SHA256": release.sha256,
  });
  for (const name of ["content-length", "content-range", "etag", "last-modified"]) {
    const value = storageResponse.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(includeBody ? storageResponse.body : null, {
    status: storageResponse.status,
    headers,
  });
}

export async function GET(req: NextRequest, context: Context) {
  return serve(req, context, true);
}

export async function HEAD(req: NextRequest, context: Context) {
  return serve(req, context, false);
}
