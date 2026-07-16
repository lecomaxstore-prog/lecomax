import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectAdminMutation } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm", "video/ogg", "video/mpeg", "video/x-msvideo"];
const MAX_IMAGE = 20 * 1024 * 1024;  // 20 MB
const MAX_VIDEO = 500 * 1024 * 1024; // 500 MB
const BUCKET = "product-images";

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "storage:media", limit: 10, windowMs: 600_000 });
  if (blocked) return blocked;
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE.includes(file.type);
  const isVideo = ALLOWED_VIDEO.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Type non supporté. Images: JPG, PNG, WEBP. Vidéos: MP4, MOV, WEBM." },
      { status: 415 }
    );
  }

  const maxSize = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return NextResponse.json({ error: `Fichier trop volumineux (max ${maxMB} MB).` }, { status: 413 });
  }

  const extensionByType: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/ogg": "ogv", "video/mpeg": "mpeg", "video/x-msvideo": "avi" };
  const ext = extensionByType[file.type] ?? (isVideo ? "mp4" : "jpg");
  const prefix = isVideo ? "videos" : "studio";
  const filename = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return NextResponse.json({ url: urlData.publicUrl, filename }, { status: 201 });
}
