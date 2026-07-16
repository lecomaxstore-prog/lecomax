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
  "abandoned_carts",
  "paypal_webhook_events",
  "whatsapp_conversations",
  "whatsapp_messages",
];

const requiredColumns = {
  orders: [
    "payment_reference",
    "payment_status",
    "payment_currency",
    "payment_amount",
  ],
  abandoned_carts: [
    "id",
    "cart_token",
    "phone",
    "name",
    "email",
    "items",
    "total",
    "reminded",
    "reminded_at",
    "created_at",
    "updated_at",
  ],
};

const requiredSettings = {
  shipping_cost: "35",
  free_shipping_threshold: "500",
  shipping_estimated_days: "2-5 jours ouvrables",
};

const headers = {
  apikey: key,
  ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
};
const schemaResponse = await fetch(`${url}/rest/v1/`, { headers });
if (!schemaResponse.ok) {
  console.error(`Could not read Supabase schema (${schemaResponse.status}).`);
  process.exit(1);
}

const schema = await schemaResponse.json();
const definitions = schema.definitions ?? schema.components?.schemas ?? {};
const missingTables = requiredTables.filter((table) => !definitions[table]);
const missingColumns = Object.entries(requiredColumns).flatMap(([table, columns]) => {
  const properties = definitions[table]?.properties ?? {};
  return columns
    .filter((column) => !Object.prototype.hasOwnProperty.call(properties, column))
    .map((column) => `${table}.${column}`);
});

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
  ok: missingTables.length === 0 && missingColumns.length === 0 && invalidSettings.length === 0,
  missingTables,
  missingColumns,
  invalidSettings,
}, null, 2));

if (missingTables.length || missingColumns.length || invalidSettings.length) {
  if (missingTables.length || invalidSettings.length) {
    console.error("Run supabase/migrations/20260716011000_lecomax_api_foundation.sql in the Supabase SQL editor.");
  }
  if (missingTables.includes("abandoned_carts") || missingColumns.some((column) => column.startsWith("abandoned_carts."))) {
    console.error("Run supabase/migrations/20260716170000_abandoned_carts_reliable.sql in the Supabase SQL editor.");
  }
  if (missingTables.includes("paypal_webhook_events") || missingColumns.some((column) => column.startsWith("orders.payment_"))) {
    console.error("Run supabase/migrations/20260716190000_paypal_payment_security.sql in the Supabase SQL editor.");
  }
  process.exit(1);
}
