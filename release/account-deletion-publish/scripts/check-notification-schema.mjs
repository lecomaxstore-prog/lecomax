import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const table of ['mobile_web_push_subscriptions', 'mobile_push_receipts', 'mobile_campaign_dispatches']) {
  const { status, error } = await db.from(table).select('*').limit(0);
  console.log(JSON.stringify({ table, status, error: error?.code ?? null }));
}
const { error, status, data } = await db.rpc('exec_sql', { query: "select to_regclass('public.mobile_push_tokens') is not null as notification_schema_available" });
console.log(JSON.stringify({ sqlAccess: status, error: error?.code ?? null, available: Boolean(data) }));
console.log(JSON.stringify({ directDatabaseConfigured: ['DATABASE_URL', 'POSTGRES_URL', 'SUPABASE_DB_URL'].some(key => Boolean(process.env[key])) }));
