import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Manually parse .env.local (no dotenv dependency needed)
function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env.local */ }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Creating chat tables…");

  // chat_sessions
  const { error: e1 } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id  text        NOT NULL,
        name        text,
        status      text        NOT NULL DEFAULT 'ai'
                    CHECK (status IN ('ai','escalated','resolved')),
        unread_count integer    NOT NULL DEFAULT 0,
        last_message text,
        last_at     timestamptz NOT NULL DEFAULT now(),
        created_at  timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS chat_sessions_visitor_id_idx ON chat_sessions(visitor_id);
      CREATE INDEX IF NOT EXISTS chat_sessions_status_idx      ON chat_sessions(status);
    `,
  });
  if (e1) {
    // exec_sql might not exist — fallback to raw SQL via PostgREST
    console.warn("exec_sql not available, trying direct insert approach…");
    console.log("Please run the following SQL in your Supabase SQL editor:");
    console.log(`
CREATE TABLE IF NOT EXISTS chat_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id   text        NOT NULL,
  name         text,
  status       text        NOT NULL DEFAULT 'ai'
               CHECK (status IN ('ai','escalated','resolved')),
  unread_count integer     NOT NULL DEFAULT 0,
  last_message text,
  last_at      timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_sessions_visitor_id_idx ON chat_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS chat_sessions_status_idx ON chat_sessions(status);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  direction  text        NOT NULL CHECK (direction IN ('in','out')),
  body       text        NOT NULL,
  sent_by    text        NOT NULL CHECK (sent_by IN ('visitor','ai','agent')),
  timestamp  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
    `);
    return;
  }

  const { error: e2 } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        direction  text        NOT NULL CHECK (direction IN ('in','out')),
        body       text        NOT NULL,
        sent_by    text        NOT NULL CHECK (sent_by IN ('visitor','ai','agent')),
        timestamp  timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
    `,
  });

  if (e2) { console.error("chat_messages error:", e2.message); return; }

  console.log("✅ Tables created: chat_sessions, chat_messages");
}

run();
