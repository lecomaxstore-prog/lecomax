# Production security follow-up — 15 September 2026

## Historical Supabase credential

The earlier revocation uncertainty is resolved for the identified historical service-role JWT:

- The Supabase Management API reports legacy API keys disabled.
- The credential found in the recorded Git blob was confirmed to have the `service_role` claim and the configured project reference.
- A HEAD request selecting zero product rows with that credential returned HTTP 401. No customer records were requested or returned.
- The project has publishable and secret API keys. No key values were printed, committed or rotated during this verification.

This confirms rejection of the specific historical API key. It does not establish whether the key was used before revocation or replace a historical access-log review.

## Shared rate limiting

Provisioned `lecomax-security-rate-limit` through the existing Vercel team and connected it to the `lecomax` production environment:

- Upstash Redis free plan, primary region `iad1`.
- Automatic paid upgrades disabled; production pack disabled; eviction disabled.
- Vercel supplies `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
- The sensitive-route limiter accepts that pair as well as the original `UPSTASH_REDIS_REST_*` pair. Incomplete explicit credentials fail closed instead of being mixed across databases.
- Counters use hashed identities, atomic increment and a 15-minute expiry. Configured backend failures return HTTP 503; exhausted limits return HTTP 429.

The shared limiter covers its existing sensitive-route call sites. General middleware/admin request counters remain additional per-instance protection. Free-plan capacity limits can make the shared backend unavailable; monitor Redis usage because sensitive routes fail closed in that case.

## Search discovery

The preceding release passed live metadata, sitemap, crawler and API-protection checks, and IndexNow accepted 52 public URLs. Direct Google Search Console access remains unavailable in this session; a connection is still needed for Google-specific inspection or submission. Neither IndexNow acceptance nor crawler access guarantees indexing.

## Resumed production verification — 15 September 2026

- Confirmed the production shared Redis limiter: HTTP 429 on invalid tracking request 31, with Retry-After 893 seconds. Requests omitted order/email parameters; no customer data was queried.
- Re-ran the release verification successfully: homepage SEO metadata, canonical URL, parseable structured data, crawler access, 52 canonical sitemap URLs, public discovery content, and anonymous API protection.
- The public Google Merchant feed returned HTTP 200 and parsed as XML with 25 product items.
- The release checkout already contains commit `3a9584c` for Redis configuration and the historical key verification record. No additional application deployment was needed for these passing checks.
- Browser inventory returned no connected browsers, and no Search Console connector is available. Google-specific sitemap submission, URL inspection, and Merchant Center account configuration remain unverified and require an accessible owner session.
