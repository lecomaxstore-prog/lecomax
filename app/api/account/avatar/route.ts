import { NextRequest, NextResponse } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";
import { getEcomediaUser, communityDisplayName } from "@/lib/ecomedia-auth";
import {
  ECOMEDIA_COMMUNITY_AUTHOR_PREFIX,
  decodeEcomediaCommentContent,
  encodeCommunityAuthor,
  encodeEcomediaCommentContent,
  hydrateCommunityPost,
  type EcomediaPost,
} from "@/lib/ecomedia";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function hasValidImageSignature(bytes: Buffer, type: string) {
  if (type === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (type === "image/avif") return bytes.length > 16 && bytes.toString("ascii", 4, 8) === "ftyp" && /avi[fs]/.test(bytes.toString("ascii", 8, 16));
  return false;
}

function storedAvatar(url: unknown, userId: string): { bucket: string; path: string } | null {
  if (typeof url !== "string") return null;
  const marker = "/storage/v1/object/public/";
  const stored = url.split(marker)[1];
  if (!stored) return null;
  const [bucket, ...parts] = decodeURIComponent(stored).split("/");
  const path = parts.join("/");
  const allowed = bucket === "ecomedia"
    ? path.startsWith(`community/${userId}/avatar/`)
    : bucket === "product-images" && path.startsWith(`ecomedia/community/${userId}/avatar/`);
  return allowed ? { bucket, path } : null;
}

async function removeStoredAvatar(url: unknown, userId: string) {
  const stored = storedAvatar(url, userId);
  if (stored) await sb.storage.from(stored.bucket).remove([stored.path]);
}

async function syncEcomediaAvatar(user: User, avatar: string | null) {
  const authorMeta = encodeCommunityAuthor({ id: user.id, name: communityDisplayName(user), avatar });

  const { data: posts, error: postReadError } = await sb
    .from("ecomedia_posts")
    .select("id,cta_text")
    .like("cta_text", `${ECOMEDIA_COMMUNITY_AUTHOR_PREFIX}%${user.id}%`);
  if (postReadError) throw postReadError;
  const ownedPosts = (posts ?? []).filter(post => {
    const hydrated = hydrateCommunityPost({ cta_text: post.cta_text } as EcomediaPost);
    return hydrated.author_id === user.id;
  });
  if (ownedPosts.length) {
    const results = await Promise.all(ownedPosts.map(post => sb.from("ecomedia_posts").update({ cta_text: authorMeta }).eq("id", post.id)));
    const failed = results.find(result => result.error);
    if (failed?.error) throw failed.error;
  }

  if (!user.email) return;
  const { data: comments, error: commentReadError } = await sb
    .from("ecomedia_comments")
    .select("id,content")
    .eq("email", user.email);
  if (commentReadError) throw commentReadError;
  if (comments?.length) {
    const results = await Promise.all(comments.map(comment => {
      const decoded = decodeEcomediaCommentContent(comment.content);
      return sb.from("ecomedia_comments").update({
        content: encodeEcomediaCommentContent({
          author: { id: user.id, avatar },
          parentId: decoded.parentId,
          content: decoded.content,
        }),
      }).eq("id", comment.id).eq("email", user.email!);
    }));
    const failed = results.find(result => result.error);
    if (failed?.error) throw failed.error;
  }
}

async function updateAvatar(user: User, avatarUrl: string | null) {
  const previousMetadata = { ...(user.user_metadata ?? {}) };
  const previousAvatar = previousMetadata.avatar_url ?? previousMetadata.picture ?? null;
  const metadata = { ...(user.user_metadata ?? {}), avatar_url: avatarUrl, picture: avatarUrl };
  const { data, error } = await sb.auth.admin.updateUserById(user.id, { user_metadata: metadata });
  if (error || !data.user) throw error ?? new Error("Profil indisponible");
  try {
    await syncEcomediaAvatar(data.user, avatarUrl);
  } catch (reason) {
    const rollback = await sb.auth.admin.updateUserById(user.id, { user_metadata: previousMetadata });
    if (rollback.data.user) await syncEcomediaAvatar(rollback.data.user, previousAvatar).catch(() => undefined);
    throw reason;
  }
  return data.user;
}

export async function POST(req: NextRequest) {
  const user = await getEcomediaUser(req);
  if (!user) return NextResponse.json({ error: "Connectez-vous pour modifier votre photo." }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 }); }
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Sélectionnez une photo." }, { status: 400 });
  if (!IMAGE_TYPES.includes(file.type)) return NextResponse.json({ error: "Utilisez une image JPG, PNG, WEBP ou AVIF." }, { status: 415 });
  if (file.size <= 0 || file.size > MAX_AVATAR_SIZE) return NextResponse.json({ error: "La photo doit peser moins de 5 Mo." }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(bytes, file.type)) return NextResponse.json({ error: "Le contenu du fichier ne correspond pas à une image valide." }, { status: 415 });

  const filename = `${Date.now()}-${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  let bucket = "ecomedia";
  let path = `community/${user.id}/avatar/${filename}`;
  let upload = await sb.storage.from(bucket).upload(path, bytes, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (upload.error) {
    bucket = "product-images";
    path = `ecomedia/community/${user.id}/avatar/${filename}`;
    upload = await sb.storage.from(bucket).upload(path, bytes, { contentType: file.type, cacheControl: "31536000", upsert: false });
  }
  if (upload.error) return NextResponse.json({ error: "Impossible d’envoyer la photo pour le moment." }, { status: 500 });

  const avatarUrl = sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  const previousAvatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  try {
    await updateAvatar(user, avatarUrl);
    if (previousAvatar !== avatarUrl) await removeStoredAvatar(previousAvatar, user.id);
  } catch {
    await sb.storage.from(bucket).remove([path]);
    return NextResponse.json({ error: "La photo a été envoyée, mais le profil n’a pas pu être mis à jour." }, { status: 500 });
  }
  return NextResponse.json({ avatarUrl }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: NextRequest) {
  const user = await getEcomediaUser(req);
  if (!user) return NextResponse.json({ error: "Connectez-vous pour modifier votre photo." }, { status: 401 });
  const previousAvatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  try {
    await updateAvatar(user, null);
    await removeStoredAvatar(previousAvatar, user.id);
  } catch {
    return NextResponse.json({ error: "Impossible de supprimer la photo pour le moment." }, { status: 500 });
  }
  return NextResponse.json({ avatarUrl: null }, { headers: { "Cache-Control": "no-store" } });
}
