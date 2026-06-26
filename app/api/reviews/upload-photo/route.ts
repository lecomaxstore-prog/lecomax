import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const slug = (formData.get("slug") as string | null) ?? "product";

    if (!file) {
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
    const fileName = `${slug}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error } = await supabase.storage
      .from("review-photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("review-photos")
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
