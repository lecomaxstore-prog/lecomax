# Product description translations

The mobile product description requests the shopper's selected language (`en` or `fr`). Existing and future published products use the same on-demand flow, including descriptions containing both languages. Already translated text is returned unchanged. Originals remain available through the description toggle.

The server reads the published product itself; clients cannot submit arbitrary text. Cache keys include language, name, brand, description and translation version, so catalogue edits cannot reuse an old translation. Output validation rejects incomplete responses, HTML, removed brands and changed numeric values. Translation is contextual, not a finite word dictionary; automated validation does not guarantee every linguistic choice is correct.

## Configuration and rollout

Keep `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured on the server. Optional `PRODUCT_TRANSLATION_MODEL` and `PRODUCT_TRANSLATION_FALLBACK_MODEL` override `openai/gpt-oss-120b` and `llama-3.3-70b-versatile`. Never expose provider or service-role credentials in the app.

Apply these SQL migrations in order in Supabase:

1. `supabase/migrations/20260906180000_product_translations.sql`
2. `supabase/migrations/20260906200000_bilingual_product_translations.sql`

Deploy the API and release the updated mobile/web client. Older clients continue requesting English by default. New descriptions translate on first view; there is no manual per-product translation step.

The API middleware must include `product-translations` in its mobile CORS allowlist. Without this, browser requests from the app origin fail even when server-side tests succeed.

For a local browser preview before API deployment, set `EXPO_PUBLIC_TRANSLATION_API_URL=http://127.0.0.1:3002` in `mobile/.env.local` and run the local API on that port. Restart Expo after changing the environment. This override applies only to development web previews on localhost; native and production builds continue using the main API URL. The public endpoint must be deployed for installed apps and hosted previews; a 404 there means the API route is not deployed.

If the table or bilingual RPC is absent, the API uses a bounded temporary cache (100 results for one hour, at most 8 concurrent generations per process). This fallback keeps descriptions working during migration rollout, but does not persist across server restarts or coordinate across server instances. The database supplies durable caching and atomic generation leases once migrated. Pending leases expire after 90 seconds; failed generations can retry after 30 seconds.

## Verification

Run `node --test tests/product-translation.test.ts tests/product-translation-api.test.ts` and `node scripts/test-product-translation-sql.mjs`. The SQL test runs in an isolated PostgreSQL runtime.

`node --env-file=.env.local scripts/check-product-translations.mjs --provider` checks storage access and makes two small live translation requests, without changing catalogue data. The September 6 check found the translation table and SQL execution RPC missing; both live French and English provider samples succeeded. Database migrations have not been applied by this change.

Provider JSON mode reference: https://console.groq.com/docs/structured-outputs
