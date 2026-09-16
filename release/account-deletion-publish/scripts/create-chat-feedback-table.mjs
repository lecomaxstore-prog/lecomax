import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS chat_feedback (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
        rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment text,
        created_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS chat_feedback_session_id_idx ON chat_feedback(session_id);
      CREATE INDEX IF NOT EXISTS chat_feedback_created_at_idx ON chat_feedback(created_at DESC);
    `
  });

  if (error) {
    // Try direct insert approach to test if table exists
    const { error: e2 } = await supabase.from("chat_feedback").select("id").limit(1);
    if (!e2) {
      console.log("✅ chat_feedback table already exists.");
      return;
    }
    console.error("❌ Error:", error.message);
    console.log("\nPlease run this SQL manually in Supabase dashboard > SQL Editor:\n");
    console.log(`
CREATE TABLE IF NOT EXISTS chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_feedback_session_id_idx ON chat_feedback(session_id);
CREATE INDEX IF NOT EXISTS chat_feedback_created_at_idx ON chat_feedback(created_at DESC);
    `);
    return;
  }
  console.log("✅ chat_feedback table created successfully.");
}

main();
