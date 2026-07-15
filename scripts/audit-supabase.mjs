const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const requiredTables = [
  "products",
  "orders",
  "settings",
  "shipping_zones",
  "coupons",
  "reviews",
  "returns",
  "user_points",
  "whatsapp_conversations",
  "whatsapp_messages",
];

const requiredSettings = {
  shipping_cost: "35",
  free_shipping_threshold: "500",
  shipping_estimated_days: "2-5 jours ouvrables",
};

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const schemaResponse = await fetch(`${url}/rest/v1/`, { headers });
if (!schemaResponse.ok) {
  console.error(`Could not read Supabase schema (${schemaResponse.status}).`);
  process.exit(1);
}

const schema = await schemaResponse.json();
const definitions = schema.definitions ?? schema.components?.schemas ?? {};
const missingTables = requiredTables.filter((table) => !definitions[table]);

const settingsUrl = new URL(`${url}/rest/v1/settings`);
settingsUrl.searchParams.set("select", "key,value");
settingsUrl.searchParams.set("key", `in.(${Object.keys(requiredSettings).join(",")})`);
const settingsResponse = await fetch(settingsUrl, { headers });
const rows = settingsResponse.ok ? await settingsResponse.json() : [];
const settings = Object.fromEntries(rows.map((row) => [row.key, String(row.value ?? "")]));
const invalidSettings = Object.entries(requiredSettings)
  .filter(([keyName, value]) => settings[keyName] !== value)
  .map(([keyName, expected]) => ({ key: keyName, expected, actual: settings[keyName] ?? null }));

console.log(JSON.stringify({
  ok: missingTables.length === 0 && invalidSettings.length === 0,
  missingTables,
  invalidSettings,
}, null, 2));

if (missingTables.length || invalidSettings.length) {
  console.error("Run supabase/migrations/20260716011000_lecomax_api_foundation.sql in the Supabase SQL editor.");
  process.exit(1);
}
