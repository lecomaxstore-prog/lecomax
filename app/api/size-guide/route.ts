import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

const DEFAULT_SHOES = [
  { eu: "38", us: "6",   uk: "5",   cm: "24.0" },
  { eu: "39", us: "6.5", uk: "5.5", cm: "24.5" },
  { eu: "40", us: "7",   uk: "6",   cm: "25.0" },
  { eu: "41", us: "7.5", uk: "6.5", cm: "25.5" },
  { eu: "42", us: "8.5", uk: "7.5", cm: "26.5" },
  { eu: "43", us: "9.5", uk: "8.5", cm: "27.5" },
  { eu: "44", us: "10",  uk: "9",   cm: "28.0" },
  { eu: "45", us: "11",  uk: "10",  cm: "29.0" },
  { eu: "46", us: "12",  uk: "11",  cm: "30.0" },
];

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
      shoes: shoes ? JSON.parse(shoes.value) : DEFAULT_SHOES,
    });
  } catch {
    return NextResponse.json({ clothing: DEFAULT_CLOTHING, shoes: DEFAULT_SHOES });
  }
}

export async function POST(req: Request) {
  try {
    const { clothing, shoes } = await req.json();
    await sb().from("settings").upsert([
      { key: "size_guide_clothing", value: JSON.stringify(clothing) },
      { key: "size_guide_shoes",    value: JSON.stringify(shoes) },
    ], { onConflict: "key" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
