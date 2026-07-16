import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { protectAdminMutation } from "@/lib/api-security";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BUCKET = "product-images";
type StorageEntry = { name: string; id?: string | null; created_at?: string; metadata?: { size?: number; mimetype?: string } | null };

async function listFolder(prefix = "", depth = 0): Promise<Array<StorageEntry & { path: string }>> {
  if (depth > 5) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;
  const output: Array<StorageEntry & { path: string }> = [];
  for (const entry of (data ?? []) as StorageEntry[]) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!entry.id && !entry.metadata) output.push(...await listFolder(path, depth + 1));
    else output.push({ ...entry, path });
  }
  return output;
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const entries = await listFolder();
    return NextResponse.json(entries.map((entry) => ({ name: entry.path, size: entry.metadata?.size ?? 0, type: entry.metadata?.mimetype ?? "", created_at: entry.created_at ?? "", url: supabase.storage.from(BUCKET).getPublicUrl(entry.path).data.publicUrl })).sort((a, b) => Date.parse(b.created_at || "0") - Date.parse(a.created_at || "0")));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de charger les médias." }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "storage:delete", limit: 30, windowMs: 600_000 });
  if (blocked) return blocked;
  const name = req.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length > 500 || name.startsWith("/") || name.includes("..") || name.includes("\\")) return NextResponse.json({ error: "Chemin de fichier invalide." }, { status: 400 });
  const { data, error } = await supabase.storage.from(BUCKET).remove([name]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true, name });
}
