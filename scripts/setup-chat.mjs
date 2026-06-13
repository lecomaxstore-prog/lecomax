import { readFileSync } from "fs";
import { resolve } from "path";

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
  } catch { /* ignore */ }
}
loadEnv();

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];

const SQL = `
CREATE TABLE IF NOT EXISTS chat_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id   text        NOT NULL,
  name         text,
  status       text        NOT NULL DEFAULT 'ai' CHECK (status IN ('ai','escalated','resolved')),
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
`;

async function run() {
  console.log("Project ref:", PROJECT_REF);

  // Try Management API
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: SQL }),
  });

  const text = await r.text();
  if (r.ok) {
    console.log("✅ Tables created successfully via Management API!");
    return;
  }

  console.log("Management API status:", r.status, text);
  console.log("\n⚠️  Please run this SQL manually in your Supabase Dashboard → SQL Editor:\n");
  console.log(SQL);
}

run();
