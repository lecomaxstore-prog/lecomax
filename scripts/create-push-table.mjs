/**
 * Creates the push_subscriptions table in Supabase.
 * Run: node scripts/create-push-table.mjs
 * Then copy the SQL and run it in Supabase Dashboard → SQL Editor.
 */

console.log("\n📋  Run this SQL in Supabase Dashboard → SQL Editor:\n");
console.log(`-- ──────────────────────────────────────────────
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_created_at_idx
  on push_subscriptions (created_at desc);
-- ──────────────────────────────────────────────`);
console.log("\n✅  After running the SQL, push subscriptions will appear in Admin → Notifications Push.\n");
