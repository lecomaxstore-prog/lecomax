import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import argon2 from "argon2";
export type Database = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }>;
  transaction: <T>(fn: (db: Database) => Promise<T>) => Promise<T>;
};
export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function ownerConfig(env: NodeJS.ProcessEnv = process.env) {
  const email = env.OWNER_EMAIL?.trim().toLowerCase();
  const hash = env.OWNER_PASSWORD_HASH;
  const secret = env.SESSION_SECRET;
  const parts = hash?.split("$");
  const params: Record<string, string> = Object.fromEntries(
    (parts?.[3] || "").split(",").map((p) => p.split("=")),
  );
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    parts?.length !== 6 ||
    parts[1] !== "argon2id" ||
    parts[2] !== "v=19" ||
    Object.keys(params).sort().join(",") !== "m,p,t" ||
    !Object.values(params).every((v) => /^\d+$/.test(v)) ||
    +params.m < 19456 ||
    +params.m > 1048576 ||
    +params.t < 2 ||
    +params.t > 20 ||
    +params.p < 1 ||
    +params.p > 16 ||
    !/^[A-Za-z0-9+/]{22,}={0,2}$/.test(parts[4]) ||
    !/^[A-Za-z0-9+/]{43,}={0,2}$/.test(parts[5]) ||
    !secret ||
    !/^[a-f0-9]{64,128}$/i.test(secret)
  )
    throw new Error("OWNER_AUTH_CONFIGURATION_INVALID");
  return {
    email,
    hash: hash!,
    secret: secret!,
    version: createHmac("sha256", secret)
      .update(email + "\0" + hash)
      .digest("hex"),
  };
}
export type OwnerConfig = ReturnType<typeof ownerConfig>;
export function createOwnerAuth(db: Database, config: OwnerConfig) {
  const digest = (value: string) =>
    createHmac("sha256", config.secret).update(value).digest("hex");
  const opaque = () => randomBytes(32).toString("base64url");
  const denied = () => new AuthError(401, "INVALID_CREDENTIALS");
  const validToken = (token: unknown): token is string =>
    typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
  const audit = (event: string) =>
    console.info(
      JSON.stringify({
        event: "learning_auth_" + event,
        at: new Date().toISOString(),
      }),
    );
  async function throttle(key: string, max: number, seconds: number) {
    const { rows } = await db.query(
      "INSERT INTO learning_private.throttle(key,hits,expires_at) VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN learning_private.throttle.expires_at<=now() THEN 1 ELSE learning_private.throttle.hits+1 END, expires_at=CASE WHEN learning_private.throttle.expires_at<=now() THEN now()+$2*interval '1 second' ELSE learning_private.throttle.expires_at END RETURNING hits",
      [digest(key), seconds],
    );
    if (rows[0].hits > max) {
      audit("throttled");
      throw new AuthError(429, "RATE_LIMIT");
    }
  }
  async function issue(tx: Database, id: string, remembered: boolean) {
    const accessToken = opaque(),
      refreshToken = opaque();
    const { rows } = await tx.query(
      "UPDATE learning_private.sessions SET access_hash=$2,access_expires=least(expires_at,now()+interval '5 minutes'),last_seen=now() WHERE id=$1 RETURNING access_expires,expires_at",
      [id, digest(accessToken)],
    );
    await tx.query(
      "INSERT INTO learning_private.tokens(hash,session_id) VALUES($1,$2)",
      [digest(refreshToken), id],
    );
    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(rows[0].access_expires).getTime(),
      sessionExpiresAt: new Date(rows[0].expires_at).getTime(),
      sessionId: id,
      remembered,
    };
  }
  return {
    async login(email: unknown, password: unknown, ip: string) {
      await throttle("login-ip:" + ip, 8, 300);
      await throttle("login-global", 40, 60);
      if (
        typeof email !== "string" ||
        email.length > 254 ||
        typeof password !== "string" ||
        !password ||
        password.length > 1024
      )
        throw new AuthError(400, "INVALID_INPUT");
      // Always perform Argon2 verification, including for incorrect email addresses.
      const matches = await argon2.verify(config.hash, password);
      const same = timingSafeEqual(
        Buffer.from(digest(email.trim().toLowerCase())),
        Buffer.from(digest(config.email)),
      );
      if (!matches || !same) {
        audit("rejected");
        throw denied();
      }
      const challenge = opaque();
      await db.query(
        "INSERT INTO learning_private.challenges(hash,credential_version,expires_at) VALUES($1,$2,now()+interval '3 minutes')",
        [digest(challenge), config.version],
      );
      audit("verified");
      return { challenge };
    },
    async confirm(challenge: unknown, remember: unknown, device: unknown) {
      if (
        !validToken(challenge) ||
        typeof remember !== "boolean" ||
        typeof device !== "string" ||
        device.length > 100
      )
        throw new AuthError(400, "INVALID_INPUT");
      return db.transaction(async (tx) => {
        const { rows } = await tx.query(
          "DELETE FROM learning_private.challenges WHERE hash=$1 AND credential_version=$2 AND expires_at>now() RETURNING hash",
          [digest(challenge), config.version],
        );
        if (!rows.length) throw denied();
        const id = randomUUID();
        await tx.query(
          "INSERT INTO learning_private.sessions(id,credential_version,device,expires_at,remembered,access_hash,access_expires) VALUES($1,$2,$3,now()+$4*interval '1 second',$5,$6,now())",
          [
            id,
            config.version,
            device,
            remember ? 2592000 : 43200,
            remember,
            digest(opaque()),
          ],
        );
        audit("session_created");
        return issue(tx, id, remember);
      });
    },
    async refresh(token: unknown) {
      if (!validToken(token)) throw denied();
      // Lock the family before inspecting token state. Reuse revocation must COMMIT.
      const result = await db.transaction(async (tx) => {
        const { rows } = await tx.query(
          "SELECT s.* FROM learning_private.sessions s JOIN learning_private.tokens t ON t.session_id=s.id WHERE t.hash=$1 FOR UPDATE OF s",
          [digest(token)],
        );
        const s = rows[0];
        if (
          !s ||
          s.revoked_at ||
          s.credential_version !== config.version ||
          new Date(s.expires_at).getTime() <= Date.now()
        )
          return null;
        const tokens = await tx.query(
          "SELECT used_at FROM learning_private.tokens WHERE hash=$1",
          [digest(token)],
        );
        if (tokens.rows[0].used_at) {
          await tx.query(
            "UPDATE learning_private.sessions SET revoked_at=now() WHERE id=$1",
            [s.id],
          );
          audit("refresh_reuse");
          return null;
        }
        await tx.query(
          "UPDATE learning_private.tokens SET used_at=now() WHERE hash=$1",
          [digest(token)],
        );
        return issue(tx, s.id, s.remembered);
      });
      if (!result) throw denied();
      return result;
    },
    async authenticate(token: unknown) {
      if (!validToken(token)) throw denied();
      const { rows } = await db.query(
        "SELECT id,device,remembered,created_at,last_seen,expires_at FROM learning_private.sessions WHERE access_hash=$1 AND credential_version=$2 AND revoked_at IS NULL AND expires_at>now() AND access_expires>now()",
        [digest(token), config.version],
      );
      if (!rows.length) throw denied();
      return rows[0];
    },
    async sessions(token: unknown) {
      const current = await this.authenticate(token);
      const { rows } = await db.query(
        "SELECT id,device,remembered,created_at,last_seen,expires_at FROM learning_private.sessions WHERE credential_version=$1 AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 100",
        [config.version],
      );
      return { currentSessionId: current.id, sessions: rows };
    },
    async revoke(token: unknown, target: unknown) {
      const current = await this.authenticate(token);
      if (target === "others")
        await db.query(
          "UPDATE learning_private.sessions SET revoked_at=now() WHERE credential_version=$1 AND id<>$2 AND revoked_at IS NULL",
          [config.version, current.id],
        );
      else if (target === "all")
        await db.query(
          "UPDATE learning_private.sessions SET revoked_at=now() WHERE credential_version=$1 AND revoked_at IS NULL",
          [config.version],
        );
      else {
        if (typeof target !== "string" || !/^[a-f0-9-]{36}$/i.test(target))
          throw new AuthError(400, "INVALID_INPUT");
        await db.query(
          "UPDATE learning_private.sessions SET revoked_at=now() WHERE id=$1 AND credential_version=$2",
          [target, config.version],
        );
      }
      audit("revoked");
      return { ok: true };
    },
    async logout(token: unknown) {
      if (!validToken(token)) throw denied();
      // Refresh proof permits revocation even when the access token just expired.
      await db.query(
        "UPDATE learning_private.sessions SET revoked_at=now() WHERE id IN (SELECT session_id FROM learning_private.tokens WHERE hash=$1)",
        [digest(token)],
      );
      audit("logout");
      return { ok: true };
    },
  };
}
