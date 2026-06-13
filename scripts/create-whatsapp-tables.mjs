/**
 * Run once to create WhatsApp AI-chat tables in Supabase.
 * Usage: node scripts/create-whatsapp-tables.mjs
 */
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
  } catch { /* ignore */ }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Creating whatsapp_conversations table…");
  const { error: e1 } = await supabase.rpc("exec_sql", {
    sql: `
      create table if not exists whatsapp_conversations (
        id           uuid primary key default gen_random_uuid(),
        phone        text unique not null,
        name         text,
        status       text not null default 'ai',
        unread_count integer not null default 0,
        last_message text,
        last_at      timestamptz not null default now(),
        created_at   timestamptz not null default now()
      );
      comment on column whatsapp_conversations.status is 'ai | escalated | resolved';
    `,
  });
  if (e1) console.error("whatsapp_conversations:", e1.message);
  else console.log("✓ whatsapp_conversations");

  console.log("Creating whatsapp_messages table…");
  const { error: e2 } = await supabase.rpc("exec_sql", {
    sql: `
      create table if not exists whatsapp_messages (
        id              uuid primary key default gen_random_uuid(),
        conversation_id uuid not null references whatsapp_conversations(id) on delete cascade,
        direction       text not null,
        body            text not null,
        sent_by         text not null default 'client',
        wa_message_id   text unique,
        timestamp       timestamptz not null default now()
      );
      comment on column whatsapp_messages.direction is 'in | out';
      comment on column whatsapp_messages.sent_by    is 'client | ai | agent';
      create index if not exists whatsapp_messages_conv_idx on whatsapp_messages(conversation_id, timestamp);
    `,
  });
  if (e2) console.error("whatsapp_messages:", e2.message);
  else console.log("✓ whatsapp_messages");

  console.log("\nDone. If you see RPC errors, run the SQL directly in Supabase Dashboard → SQL Editor.");
  console.log("\nSQL to paste in Supabase SQL Editor:\n");
  console.log(`
create table if not exists whatsapp_conversations (
  id           uuid primary key default gen_random_uuid(),
  phone        text unique not null,
  name         text,
  status       text not null default 'ai',
  unread_count integer not null default 0,
  last_message text,
  last_at      timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create table if not exists whatsapp_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references whatsapp_conversations(id) on delete cascade,
  direction       text not null,
  body            text not null,
  sent_by         text not null default 'client',
  wa_message_id   text unique,
  timestamp       timestamptz not null default now()
);

create index if not exists whatsapp_messages_conv_idx
  on whatsapp_messages(conversation_id, timestamp);
  `);
}

run().catch(console.error);
