import { createClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabaseUrl } from "./supabase-admin-env.mjs";

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey
);

// Create tables by inserting a dummy row and letting it fail â€” or use direct SQL via the pg REST
// We'll use the Supabase SQL editor endpoint
const url = supabaseUrl;
const key = serviceRoleKey;

const queries = [
  `CREATE TABLE IF NOT EXISTS data_collection_consents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL,
    consented_at timestamptz DEFAULT now(),
    revoked_at timestamptz,
    browser text,
    os text,
    screen_width int,
    screen_height int,
    language text,
    timezone text,
    referrer text
  )`,
  `CREATE TABLE IF NOT EXISTS client_behavioral_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL,
    event_type text NOT NULL,
    path text,
    title text,
    product_id text,
    product_name text,
    category text,
    query text,
    extra jsonb,
    created_at timestamptz DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cbe_session ON client_behavioral_events (session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cbe_event_type ON client_behavioral_events (event_type)`,
  `CREATE INDEX IF NOT EXISTS idx_cbe_created_at ON client_behavioral_events (created_at DESC)`,
];

for (const sql of queries) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  const text = await res.text();
  console.log("SQL:", sql.split("\n")[0].trim());
  console.log("Result:", res.status, text.slice(0, 120));
  console.log("---");
}
