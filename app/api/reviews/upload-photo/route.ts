import { publicDatabaseError } from "@/lib/public-error";
import { readFormDataLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/api-security";
import { validMediaBytes } from "@/lib/upload-validation";
import { sensitiveRateLimit } from "@/lib/sensitive-rate-limit";

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "review:photo", 10, 600_000);
  if (limited) return limited;
  const sharedLimit = await sensitiveRateLimit(req, "review-photo");
  if (sharedLimit) return sharedLimit;
  try {
    const formData = await readFormDataLimited(req, 5 * 1024 * 1024 + 100_000);
    const file = formData.get("photo") as File | null;
    const slug = (formData.get("slug") as string | null) ?? "product";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté. Utilisez JPG, PNG ou WebP." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La photo ne doit pas dépasser 5 Mo." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const fileName = `reviews/${crypto.randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!(await validMediaBytes(buffer, file.type))) return NextResponse.json({ error: "Image invalide." }, { status: 415 });

    const { data, error } = await supabase.storage
      .from("review-photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("review-photos")
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (e: unknown) {
    return NextResponse.json({ error: "La photo n'a pas pu être envoyée." }, { status: 400 });
  }
}
