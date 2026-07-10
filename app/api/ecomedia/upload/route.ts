import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "ecomedia";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

// POST /api/ecomedia/upload (admin only — protected by caller, no RLS bypass needed)
export async function POST(req: NextRequest) {
  let formData: FormData;
  try { formData = await req.formData(); } catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const mimeType = file.type || (ALLOWED_IMAGE_TYPES.some(t => t.endsWith(ext)) ? `image/${ext}` : `video/${ext}`);
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Type de fichier non autorisé. Images (JPG/PNG/WEBP) et vidéos (MP4/WEBM) uniquement." }, { status: 415 });
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `Fichier trop volumineux (max ${isVideo ? "100" : "15"} MB).` }, { status: 413 });
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const folder = isVideo ? "videos" : "images";
  const path = `${folder}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await sb.storage.from(BUCKET).upload(path, Buffer.from(arrayBuffer), { contentType: mimeType, upsert: false });

  if (error) {
    // If bucket doesn't exist, try creating it or use product-images bucket
    if (error.message.includes("not found") || error.message.includes("Bucket not found")) {
      // Fallback: upload to product-images bucket
      const { error: e2, data } = await sb.storage.from("product-images").upload(filename, Buffer.from(arrayBuffer), { contentType: mimeType, upsert: false });
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      const { data: urlData } = sb.storage.from("product-images").getPublicUrl(filename);
      return NextResponse.json({ url: urlData.publicUrl, filename, type: isVideo ? "video" : "image" }, { status: 201 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl, filename: path, type: isVideo ? "video" : "image" }, { status: 201 });
}
