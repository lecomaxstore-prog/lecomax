const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
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
  "mobile_push_tokens",
  "account_deletion_requests",
];

const requiredColumns = {
  products: [
    "id",
    "slug",
    "name",
    "category",
    "price",
    "original_price",
    "images",
    "stock",
    "color_stock",
    "active",
  ],
  orders: [
    "payment_reference",
    "payment_status",
    "payment_currency",
    "payment_amount",
    "order_source",
    "idempotency_key",
  ],
  mobile_push_tokens: ["user_id", "token", "platform", "active"],
  account_deletion_requests: [
    "user_id",
    "email",
    "status",
    "requested_at",
    "resolved_at",
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

const requiredFunctions = [
  "reserve_order_inventory",
  "release_order_inventory",
  "reserve_order_loyalty_points",
  "award_order_loyalty_points",
  "reverse_order_loyalty_points",
];

const requiredSettings = {
  shipping_cost: "40",
  free_shipping_threshold: "500",
  shipping_estimated_days: "2-5 jours ouvrables",
  app_minimum_version: "1.0.0",
  app_latest_version: "1.0.0",
  app_force_update: "false",
  app_cache_version: "1",
  app_home_promotions: "true",
  app_home_new_arrivals: "true",
  app_home_products: "true",
  app_home_welcome_offer: "true",
  app_onboarding_enabled: "true",
  app_onboarding_version: "1",
  app_notifications_enabled: "true",
  app_club_title: "ECOCLUB",
  app_club_description: "Des avantages pensés pour vous.",
  app_club_cta_label: "Découvrir",
  app_club_cta_destination: "/ecoclub",
  app_wishlist_section_title: "MES FAVORIS",
  app_wishlist_recommendations_enabled: "true",
  app_wishlist_recommendations_title: "VOUS AIMEREZ AUSSI",
  app_wishlist_recommendation_slugs: "",
  app_wishlist_promotional_label: "NOUVEAU",
  app_wishlist_default_sort: "recommended",
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
const paths = schema.paths ?? {};
const missingTables = requiredTables.filter((table) => !definitions[table]);
const missingColumns = Object.entries(requiredColumns).flatMap(
  ([table, columns]) => {
    const properties = definitions[table]?.properties ?? {};
    return columns
      .filter(
        (column) => !Object.prototype.hasOwnProperty.call(properties, column),
      )
      .map((column) => `${table}.${column}`);
  },
);
const missingFunctions = requiredFunctions.filter(
  (functionName) =>
    !Object.prototype.hasOwnProperty.call(paths, `/rpc/${functionName}`),
);

const settingsUrl = new URL(`${url}/rest/v1/settings`);
settingsUrl.searchParams.set("select", "key,value");
settingsUrl.searchParams.set(
  "key",
  `in.(${Object.keys(requiredSettings).join(",")})`,
);
const settingsResponse = await fetch(settingsUrl, { headers });
const rows = settingsResponse.ok ? await settingsResponse.json() : [];
const settings = Object.fromEntries(
  rows.map((row) => [row.key, String(row.value ?? "")]),
);
const normalizeSetting = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
// Branding copy the merchant edits from /admin/settings. The values above are only
// seed defaults, so require these keys to be present and non-empty, not equal.
// Routes, enums, flags and prices stay exact-matched: those are behaviour, not copy.
const editableSettings = new Set([
  "app_club_title",
  "app_club_description",
  "app_club_cta_label",
  "app_wishlist_section_title",
  "app_wishlist_recommendations_title",
  "app_wishlist_promotional_label",
]);
const invalidSettings = Object.entries(requiredSettings)
  .filter(([keyName, value]) =>
    editableSettings.has(keyName)
      ? normalizeSetting(settings[keyName]) === ""
      : normalizeSetting(settings[keyName]) !== normalizeSetting(value),
  )
  .map(([keyName, expected]) => ({
    key: keyName,
    expected: editableSettings.has(keyName) ? "(any non-empty value)" : expected,
    actual: settings[keyName] ?? null,
  }));

console.log(
  JSON.stringify(
    {
      ok:
        missingTables.length === 0 &&
        missingColumns.length === 0 &&
        missingFunctions.length === 0 &&
        invalidSettings.length === 0,
      missingTables,
      missingColumns,
      missingFunctions,
      invalidSettings,
    },
    null,
    2,
  ),
);

if (
  missingTables.length ||
  missingColumns.length ||
  missingFunctions.length ||
  invalidSettings.length
) {
  if (
    missingTables.some((table) =>
      ["settings", "shipping_zones", "returns", "user_points"].includes(table),
    )
  ) {
    console.error(
      "Run supabase/migrations/20260716011000_lecomax_api_foundation.sql in the Supabase SQL editor.",
    );
  }
  if (
    missingTables.includes("abandoned_carts") ||
    missingColumns.some((column) => column.startsWith("abandoned_carts."))
  ) {
    console.error(
      "Run supabase/migrations/20260716170000_abandoned_carts_reliable.sql in the Supabase SQL editor.",
    );
  }
  if (
    missingTables.includes("paypal_webhook_events") ||
    missingColumns.some((column) => column.startsWith("orders.payment_"))
  ) {
    console.error(
      "Run supabase/migrations/20260716190000_paypal_payment_security.sql in the Supabase SQL editor.",
    );
  }
  if (
    missingColumns.includes("orders.order_source") ||
    missingColumns.includes("orders.idempotency_key")
  ) {
    console.error(
      "Run supabase/migrations/20260726120000_order_source_idempotency.sql in the Supabase SQL editor.",
    );
  }
  if (invalidSettings.some(({ key }) => key.startsWith("app_"))) {
    console.error(
      "Run supabase/migrations/20260726123000_mobile_app_settings.sql in the Supabase SQL editor.",
    );
  }
  if (missingTables.includes("mobile_push_tokens")) {
    console.error(
      "Run supabase/migrations/20260726130000_mobile_push_tokens.sql in the Supabase SQL editor.",
    );
  }
  if (missingTables.includes("account_deletion_requests")) {
    console.error(
      "Run supabase/migrations/20260726140000_account_deletion_requests.sql in the Supabase SQL editor.",
    );
  }
  if (
    missingFunctions.some((functionName) =>
      ["reserve_order_inventory", "release_order_inventory"].includes(
        functionName,
      ),
    )
  ) {
    console.error(
      "Run supabase/migrations/20260726133000_atomic_order_inventory.sql in the Supabase SQL editor.",
    );
  }
  if (
    missingFunctions.some((functionName) =>
      functionName.includes("loyalty_points"),
    )
  ) {
    console.error(
      "Run supabase/migrations/20260719110000_loyalty_ledger.sql in the Supabase SQL editor.",
    );
  }
  process.exit(1);
}
