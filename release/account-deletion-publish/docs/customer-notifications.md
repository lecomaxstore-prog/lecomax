# Customer product and offer notifications

Publishing an active product queues one new-product campaign. Publishing an active,
unexpired promotion queues one offer campaign. Adding a discount to an existing
active product, or lowering its discounted price, queues an offer campaign. Repeated
edits and the same product/price/original-price combination do not duplicate alerts.
Drafts and rolled-back writes never notify. There is no historical backfill.

Admin product and promotion APIs deliver after their response. Database imports use
the durable queue, processed by `/api/cron/mobile-campaigns` daily on the current Vercel Hobby plan. Explicit
failures retry up to three attempts; already accepted recipients are skipped. Uncertain
provider outcomes remain available for manual review rather than automatic resend.
Inactive/deleted products and inactive/expired/deleted offers are cancelled at delivery.
Campaign acceptance is not proof that a device displayed the notification; Expo receipts
are checked separately by the cron endpoint.

Only registered devices receive pushes. Account marketing/category preferences and
the admin `app_notifications_enabled` switch are respected. The home-page opt-in
enables both new-product and promotion categories. Clients can disable them again.

## Deployment prerequisites

Apply these migrations in order if they are not already installed:

1. `20260726130000_mobile_push_tokens.sql`
2. `20260727190000_mobile_control_center.sql`
3. `20260727200000_mobile_campaign_segmentation.sql`
4. `20260728121000_mobile_guest_push_tokens.sql`
5. `20260906120000_product_notifications.sql`
6. `20260909120000_offer_notifications.sql`

Then deploy the Next.js API/admin and rebuild/deploy the mobile web/native clients.
Configure `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and
`CRON_SECRET` on the server. Native push also needs the existing EAS project and
platform push credentials (`EXPO_ACCESS_TOKEN` if Expo push security is enabled).
For faster queue processing, use an external scheduler or a hosting plan that supports one-minute cron jobs.
An external scheduler can call the cron URL with `Authorization: Bearer <CRON_SECRET>`.

The September 9 read-only check of the configured Supabase project found the web
subscription, receipt, and dispatch tables missing (PGRST205). The SQL execution RPC
is unavailable and no direct database connection is configured. No production
migration, deployment, or customer test broadcast was performed for this change.

Browser permission marked **blocked** must be changed by the customer in the site's
browser permissions, then the page refreshed. The app cannot override that choice.

## Validation

`node scripts/test-notification-migration.mjs node_modules/@electric-sql/pglite/dist/index.js`
tests publication, offer/discount changes, deduplication, drafts, expired offers,
transaction rollback, migration reruns, and notification table access in isolated
PostgreSQL. Notification preference/provider-response tests and both TypeScript
projects pass. Real-device delivery remains to be verified after deployment with an
opted-in test device.
