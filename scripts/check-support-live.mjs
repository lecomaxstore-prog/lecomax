const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing Supabase server configuration');
console.log('Project:', new URL(url).hostname);
const response = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
  signal: AbortSignal.timeout(15000),
});
const schema = await response.json();
console.log(JSON.stringify({ status: response.status,
  tables: Object.keys(schema.definitions ?? {}).filter(name => name.startsWith('support_')),
  functions: Object.keys(schema.paths ?? {}).filter(name => /support_|exec_sql|execute_sql/.test(name)),
}));
for (const table of ['support_conversations', 'support_messages']) {
  const result = await fetch(`${url}/rest/v1/${table}?select=id&limit=0`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  const body = await result.json();
  console.log(JSON.stringify({ table, status: result.status, code: body.code }));
}
const recent = await fetch(`${url}/rest/v1/support_messages?select=sender_type,body,created_at&order=created_at.desc&limit=3`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
  signal: AbortSignal.timeout(15000),
});
if (recent.ok) console.log('Recent support messages:', JSON.stringify(await recent.json()));
