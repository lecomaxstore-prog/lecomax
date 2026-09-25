# Saved OpenAI product descriptions

The mobile app requests English or French for the selected product. The server translates only published catalogue descriptions, using OpenAI Responses with strict JSON output. The source description is preserved. Shoppers see the description without translation labels, loading notices or translation controls; the source text is displayed until a saved result is available.

## Translate once and reuse

The database stores each successful result permanently by product ID, language and source fingerprint. Page reloads, other visitors, process restarts and deployments reuse it without another AI request. New products use the same flow on their first description request. Changes to name, brand or description create a new fingerprint; price, stock and images do not. Existing successful translations are retained when changing provider.

An atomic database lease prevents concurrent visitors from generating the same result. AI calls have a 40-second timeout; leases last 90 seconds. Failed generations can retry after five minutes. Saving retries the same output up to three times. Missing storage or locking functions cause an explicit service error, never an ephemeral paid translation. As with any external API plus database, a process crash or persistent write outage after generation can require a later retry; this is not an absolute exactly-once billing guarantee.

## Configuration

Server only: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Optional OPENAI_TRANSLATION_MODEL overrides OPENAI_MODEL (default gpt-6-sol). Provider credentials never enter the mobile bundle. Groq is no longer used for product translations.

Storage migrations, in order:
1. supabase/migrations/20260906180000_product_translations.sql
2. supabase/migrations/20260906200000_bilingual_product_translations.sql

On Windows, scripts/setup-product-translations.ps1 -Apply uses the existing Supabase CLI login, verifies the linked project matches the app, then installs these two migrations in a transaction. Without -Apply it only checks availability.

## Existing catalogue

Run a read-only coverage check:

    node --env-file=.env.local scripts/backfill-product-translations.mjs

Fill missing English and French descriptions:

    node --env-file=.env.local scripts/backfill-product-translations.mjs --apply

The script is resumable, skips saved results and stops at the first provider/storage failure. It does not change original product data.

## Local preview and deployment

The local Expo web preview uses EXPO_PUBLIC_TRANSLATION_API_URL=http://127.0.0.1:3002. Run the Next.js API on port 3002 with outbound network access. Native and release builds use the main API, so the updated route and its server modules must be deployed there for future products to use OpenAI. The middleware CORS allowlist includes product-translations.

## Verification

    node --test tests/product-translation.test.ts tests/product-translation-store.test.ts tests/product-translation-api.test.ts tests/product-translation-browser.test.ts
    node scripts/test-product-translation-sql.mjs

Tests cover numeric and brand preservation, strict provider output, simultaneous requests, durable reuse, missing storage, persistence retries, source edits, endpoint access and CORS.

OpenAI reference: https://developers.openai.com/api/docs/guides/structured-outputs
