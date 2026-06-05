import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET = "product-images";

// POST /api/upload  (multipart/form-data  field: "file")
export async function POST(req: NextRequest) {
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

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé. Utilisez JPG, PNG, WEBP, AVIF ou GIF." },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 MB)." }, { status: 413 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: urlData.publicUrl, filename }, { status: 201 });
}
