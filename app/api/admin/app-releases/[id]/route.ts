import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";
import { adminActor, releaseSupabase } from "@/lib/app-release-server";
import { APP_RELEASE_BUCKET } from "@/lib/app-releases";

type Context = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, context: Context) {
  const blocked = await protectAdminMutation(req, { key: "app-releases:update", limit: 20 });
  if (blocked) return blocked;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const action = body?.action;
  const actor = await adminActor(req);
  if (!actor) return NextResponse.json({ error: "Session administrateur invalide." }, { status: 401 });
  const client = releaseSupabase();

  if (action === "publish" || action === "rollback") {
    const { data, error } = await client.rpc("publish_android_release", {
      target_release_id: id,
      actor,
      audit_action: action === "rollback" ? "rolled_back" : "published",
    });
    if (error) return NextResponse.json({ error: "Impossible de publier cette version." }, { status: 400 });
    return NextResponse.json({ release: data });
  }

  if (action === "unpublish") {
    const { data, error } = await client
      .from("app_releases")
      .update({ published: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("published", true)
      .select("*")
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Cette version n’est pas publiée." }, { status: 409 });
    await client.from("app_release_audit").insert({ release_id: id, actor_email: actor, action: "unpublished" });
    return NextResponse.json({ release: data });
  }

  if (action === "set-required" && typeof body?.required === "boolean") {
    const { data, error } = await client
      .from("app_releases")
      .update({ required: body.required, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Version introuvable." }, { status: 404 });
    await client.from("app_release_audit").insert({
      release_id: id,
      actor_email: actor,
      action: "updated",
      details: { required: body.required },
    });
    return NextResponse.json({ release: data });
  }

  return NextResponse.json({ error: "Action de version invalide." }, { status: 400 });
}

export async function DELETE(req: NextRequest, context: Context) {
  const blocked = await protectAdminMutation(req, {
    key: "app-releases:delete",
    limit: 8,
    windowMs: 600_000,
  });
  if (blocked) return blocked;
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  const actor = await adminActor(req);
  if (!actor) return NextResponse.json({ error: "Session administrateur invalide." }, { status: 401 });
  const client = releaseSupabase();
  const { data: release, error: readError } = await client
    .from("app_releases")
    .select("id,storage_path,version_name,published")
    .eq("id", id)
    .maybeSingle();
  if (readError || !release) return NextResponse.json({ error: "Version introuvable." }, { status: 404 });
  if (release.published) return NextResponse.json({ error: "Dépubliez cette version avant de la supprimer." }, { status: 409 });

  await client.from("app_release_audit").insert({
    release_id: id,
    actor_email: actor,
    action: "deleted",
    details: { versionName: release.version_name },
  });
  const { data: deleted, error } = await client
    .from("app_releases")
    .delete()
    .eq("id", id)
    .eq("published", false)
    .select("id")
    .maybeSingle();
  if (error || !deleted) {
    return NextResponse.json({ error: "La version a changé. Actualisez avant de la supprimer." }, { status: 409 });
  }
  const { error: storageError } = await client.storage.from(APP_RELEASE_BUCKET).remove([release.storage_path]);
  return NextResponse.json({
    success: true,
    warning: storageError ? "Les métadonnées sont supprimées, mais le nettoyage du fichier devra être réessayé." : null,
  });
}
