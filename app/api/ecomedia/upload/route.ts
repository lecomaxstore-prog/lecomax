import { publicDatabaseError } from "@/lib/public-error";
import { readFormDataLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { enforceRateLimit } from "@/lib/api-security";
import { validMediaBytes } from "@/lib/upload-validation";
import { getEcomediaUser } from "@/lib/ecomedia-auth";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BUCKET = "ecomedia";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

async function getActor(req: NextRequest) {
  // A Bearer token means this came from the public community composer.
  // Prefer it when the same browser also has an admin cookie.
  const user = await getEcomediaUser(req);
  if (user) return { id: user.id, isAdmin: false };

  if (await isAdminRequest(req)) return { id: "admin", isAdmin: true };
  return null;
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "community:upload", 15, 600_000);
  if (limited) return limited;
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  let formData: FormData;
  try { formData = await readFormDataLimited(req, actor.isAdmin ? 101 * 1024 * 1024 : MAX_IMAGE_SIZE + 100_000); }
  catch { return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 }); }
  const file = formData.get("file") as File | null;
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier sélectionné" }, { status: 400 });

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Format non autorisé." }, { status: 415 });
  }
  if (!actor.isAdmin && !isImage) {
    return NextResponse.json({ error: "Les membres peuvent publier uniquement du texte et une photo." }, { status: 403 });
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `Fichier trop volumineux (maximum ${isVideo ? "100" : "15"} Mo).` }, { status: 413 });
  }

  const extensionByMime: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
    "video/mp4": "mp4", "video/webm": "webm", "video/ogg": "ogv", "video/quicktime": "mov",
  };
  const extension = extensionByMime[file.type];
  const folder = isVideo ? "videos" : "images";
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const path = `${actor.isAdmin ? "admin" : `community/${actor.id}`}/${folder}/${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!(await validMediaBytes(bytes, file.type))) return NextResponse.json({ error: "Fichier invalide ou dimensions excessives." }, { status: 415 });

  let usedBucket = BUCKET;
  let storedPath = path;
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) {
    if (!error.message.toLowerCase().includes("bucket") && !error.message.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
    }
    usedBucket = "product-images";
    storedPath = `ecomedia/${path}`;
    const { error: fallbackError } = await sb.storage.from(usedBucket).upload(storedPath, bytes, { contentType: file.type, upsert: false });
    if (fallbackError) return NextResponse.json({ error: publicDatabaseError(fallbackError) }, { status: 500 });
  }

  const { data: publicUrl } = sb.storage.from(usedBucket).getPublicUrl(storedPath);
  return NextResponse.json(
    { url: publicUrl.publicUrl, filename: storedPath, type: isVideo ? "video" : "image" },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
