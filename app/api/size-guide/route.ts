import { DEFAULT_SHOE_GUIDE, completeShoeGuide } from "@/lib/shoe-size-guide";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { revalidatePath } from "next/cache";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const DEFAULT_CLOTHING = [
  { label: "XS",  fr: "34-36", poitrine: "82-86",   taille: "62-66" },
  { label: "S",   fr: "36-38", poitrine: "86-90",   taille: "66-70" },
  { label: "M",   fr: "38-40", poitrine: "90-94",   taille: "70-74" },
  { label: "L",   fr: "40-42", poitrine: "94-98",   taille: "74-78" },
  { label: "XL",  fr: "42-44", poitrine: "98-104",  taille: "78-84" },
  { label: "XXL", fr: "44-46", poitrine: "104-110", taille: "84-90" },
];

const DEFAULT_SHOES = DEFAULT_SHOE_GUIDE;

export async function GET() {
  try {
    const { data } = await sb()
      .from("settings")
      .select("key, value")
      .in("key", ["size_guide_clothing", "size_guide_shoes"]);

    const clothing = data?.find((r) => r.key === "size_guide_clothing");
    const shoes = data?.find((r) => r.key === "size_guide_shoes");

    return NextResponse.json({
      clothing: clothing ? JSON.parse(clothing.value) : DEFAULT_CLOTHING,
      shoes: shoes ? completeShoeGuide(JSON.parse(shoes.value)) : DEFAULT_SHOES,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ clothing: DEFAULT_CLOTHING, shoes: DEFAULT_SHOES }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  try {
    const { clothing, shoes } = await req.json();
    if (!Array.isArray(clothing) || !Array.isArray(shoes) || clothing.length > 100 || shoes.length > 100) {
      return NextResponse.json({ error: "Guide des tailles invalide." }, { status: 400 });
    }
    const validRows = [...clothing, ...shoes].every((row) =>
      row && typeof row === "object" && !Array.isArray(row) &&
      Object.keys(row).length <= 10 && Object.values(row).every((value) => typeof value === "string" && value.length <= 60)
    );
    if (!validRows) return NextResponse.json({ error: "Une valeur du guide des tailles est invalide." }, { status: 400 });
    const { error } = await sb().from("settings").upsert([
      { key: "size_guide_clothing", value: JSON.stringify(clothing) },
      { key: "size_guide_shoes",    value: JSON.stringify(shoes) },
    ], { onConflict: "key" });
    if (error) return NextResponse.json({ error: "Impossible d'enregistrer le guide des tailles." }, { status: 500 });
    // The public guide is server-rendered from these settings, while the site
    // modal and mobile app read this endpoint. Revalidate both paths so an
    // admin save is visible everywhere immediately.
    revalidatePath("/", "layout");
    revalidatePath("/guide-des-tailles");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
