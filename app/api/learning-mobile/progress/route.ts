import { NextRequest } from "next/server";
import { mobileOwner, mobileJson } from "@/lib/learning-mobile-auth";
import { ownerDatabase } from "@/lib/owner-auth-database.mjs";
import { readJsonLimited } from "@/lib/request-body";
import { sensitiveRateLimit } from "@/lib/sensitive-rate-limit";
import { validateBackup } from "@/lib/academy-backup";

async function access(req: NextRequest) {
  const owner = await mobileOwner(req);
  if (!owner)
    return { response: mobileJson({ error: "OWNER_LOGIN_REQUIRED" }, 401) };
  const limited = await sensitiveRateLimit(
    req,
    "academy-progress",
    owner,
    true,
  );
  return limited ? { response: limited } : { owner };
}
export async function GET(req: NextRequest) {
  try {
    const a = await access(req);
    if (a.response) return a.response;
    const result = await ownerDatabase().query(
      "SELECT revision, snapshot, updated_at FROM learning_private.academy_progress WHERE owner_id = $1",
      [a.owner],
    );
    return mobileJson(
      result.rows[0] || { revision: 0, snapshot: null, updated_at: null },
    );
  } catch {
    return mobileJson({ error: "PROGRESS_STORAGE_UNAVAILABLE" }, 503);
  }
}
export async function PUT(req: NextRequest) {
  try {
    const a = await access(req);
    if (a.response) return a.response;
    const input = validateBackup(
      await readJsonLimited(req, 4_000_000).catch(() => null),
    );
    if (!input) return mobileJson({ error: "INVALID_BACKUP" }, 400);
    const db = ownerDatabase();
    const result =
      input.revision === 0
        ? await db.query(
            "INSERT INTO learning_private.academy_progress (owner_id, revision, snapshot) VALUES ($1, nextval('learning_private.academy_revision'), $2::jsonb) ON CONFLICT (owner_id) DO NOTHING RETURNING revision, updated_at",
            [a.owner, JSON.stringify(input.snapshot)],
          )
        : await db.query(
            "UPDATE learning_private.academy_progress SET snapshot = $2::jsonb, revision = nextval('learning_private.academy_revision'), updated_at = now() WHERE owner_id = $1 AND revision = $3 RETURNING revision, updated_at",
            [a.owner, JSON.stringify(input.snapshot), input.revision],
          );
    return result.rows[0]
      ? mobileJson(result.rows[0])
      : mobileJson({ error: "BACKUP_CONFLICT" }, 409);
  } catch {
    return mobileJson({ error: "PROGRESS_STORAGE_UNAVAILABLE" }, 503);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const a = await access(req);
    if (a.response) return a.response;
    const body = await readJsonLimited(req, 1000).catch(() => null);
    if (
      !body ||
      typeof body !== "object" ||
      !("revision" in body) ||
      !Number.isSafeInteger(body.revision) ||
      Number(body.revision) < 1
    )
      return mobileJson({ error: "INVALID_INPUT" }, 400);
    const result = await ownerDatabase().query(
      "DELETE FROM learning_private.academy_progress WHERE owner_id = $1 AND revision = $2 RETURNING revision",
      [a.owner, body.revision],
    );
    return result.rows.length
      ? mobileJson({ deleted: true })
      : mobileJson({ error: "BACKUP_CONFLICT" }, 409);
  } catch {
    return mobileJson({ error: "PROGRESS_STORAGE_UNAVAILABLE" }, 503);
  }
}
