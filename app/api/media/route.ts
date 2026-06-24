import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/media — list all files in product-images bucket
export async function GET() {
  const { data, error } = await supabase.storage.from("product-images").list("", {
    limit: 500,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files = (data ?? []).map((f) => ({
    name: f.name,
    size: f.metadata?.size ?? 0,
    type: f.metadata?.mimetype ?? "",
    created_at: f.created_at,
    url: supabase.storage.from("product-images").getPublicUrl(f.name).data.publicUrl,
  }));

  return NextResponse.json(files);
}

// DELETE /api/media?name=filename.jpg
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { error } = await supabase.storage.from("product-images").remove([name]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
