import pg from "pg";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ownerTarget } from "../operations/seo-vercel/lib/environment-target.mjs";
let pool;
let poolConnection;
export function ownerDatabase() {
  const connectionString = process.env.OWNER_DATABASE_URL;
  if (!connectionString) throw new Error("OWNER_DATABASE_URL_REQUIRED");
  const project = ownerTarget(process.env, connectionString);
  if (process.env.OWNER_DATABASE_BINDING !== `${project}:${createHash('sha256').update(connectionString).digest('hex')}`) {
    throw new Error("ENVIRONMENT_ISOLATION_REQUIRED");
  }
  if (pool && poolConnection !== connectionString) throw new Error("ENVIRONMENT_ISOLATION_REQUIRED");
  const url = new URL(connectionString);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (
    process.env.NODE_ENV === "production" &&
    (local ||
      ["disable", "no-verify", "prefer"].includes(
        url.searchParams.get("sslmode"),
      ))
  )
    throw new Error("OWNER_DATABASE_TLS_REQUIRED");
  if (!local) {
    url.searchParams.delete("sslmode");
    url.searchParams.delete("ssl");
  }
  pool ??= new pg.Pool({
    connectionString: url.toString(),
    max: 4,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    ...(!local ? { ssl: {
      rejectUnauthorized: true,
      ...(url.hostname.endsWith(".supabase.com") || url.hostname.endsWith(".supabase.co")
        ? { ca: readFileSync(path.join(process.cwd(), "supabase", "prod-ca-2021.crt"), "utf8") }
        : {}),
    } } : {}),
  });
  poolConnection = connectionString;
  if (pool.listenerCount("error") === 0) pool.on("error", () => {});
  const wrap = (client) => ({
    query: (sql, values) => client.query(sql, values),
    transaction: async (fn) => {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const result = await fn(wrap(c));
        await c.query("COMMIT");
        return result;
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    },
  });
  return wrap(pool);
}
