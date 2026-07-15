import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/avif", "image/gif", "image/heic", "image/heif",
];
// Extension → MIME fallback for mobile browsers that report empty type
const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", avif: "image/avif", gif: "image/gif",
  heic: "image/heic", heif: "image/heif",
};
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB — mobile photos can be large
const BUCKET = "product-images";

// POST /api/upload  (multipart/form-data  field: "file")
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided (field: file)" }, { status: 400 });
  }

  // Some Android/iOS browsers send an empty MIME type — fall back to extension
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const mimeType = file.type || EXT_TO_MIME[ext] || "";

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé. Utilisez JPG, PNG, WEBP, AVIF ou GIF." },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 15 MB)." }, { status: 413 });
  }

  const safeExtension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif", "image/heic": "heic", "image/heif": "heif" } as Record<string, string>)[mimeType];
  const filename = `admin/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${safeExtension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: urlData.publicUrl, filename }, { status: 201 });
}
