# Customer product and offer notifications

## September 21 activation repair

Follow-up after the photo OTA: the saved 1.0.7 Android AAB
(`release/android/notification-audit-v1.0.7.aab`) was inspected directly.
Its `base/resources.pb` contains none of `google_app_id`,
`gcm_defaultSenderId`, `google_api_key`, or `project_id`. This build lacks
the Firebase client resources needed for Android push registration.
Supabase remains the backend but does not replace FCM for Android delivery.
A JavaScript OTA cannot add these native resources; configure Firebase and
produce a new Android binary. Physical-device delivery is not fixed yet.

The photo-upload release still used the old generic notification error message.
The notification error classifier, localized messages, and Expo Go guard have
now been staged in `release/google-signup-publish` on top of that release.
All 11 notification/upload regression checks and mobile TypeScript pass.
Published to Android production runtime `1.0.7`: group
`a648de0b-955e-4329-b8fa-ce258d492716`, Android update
`01a0c57b-214c-7c85-8532-fe9422db33a4`. This corrects the misleading error;
it does not enable Firebase in the existing binary.

Follow-up for the home-screen activation error: `.easignore` now includes the
Firebase **client** `google-services.json` in build uploads, matching the local
fallback in `app.config.ts`. The file is still excluded from Git. No such file
was present locally during the repair; the build still needs it or the EAS file
variable. Expo Go now reports remote push as unsupported. The opt-in control
distinguishes Firebase/project configuration errors, connection failures, and
localized API errors instead of blaming every failure on the network.

A fresh read-only check confirmed `mobile_push_tokens` (including
`installation_id`) and `mobile_notification_preferences` are available, and
`app_notifications_enabled` is `true`. The web subscription table is still
missing. The screenshot alone does not identify which registration stage failed;
Android delivery still needs verification in the rebuilt app.

The home screen now shows a one-time notification invitation after 2.5 seconds,
once settings and device permission have loaded. Customers can activate or choose
Later; the existing home/account controls remain available. Unsupported devices,
previously answered system permission requests, and the admin disable switch do
not trigger the invitation. Native registration accepts iOS provisional permission,
and Android can request permission again when the OS allows it. Background
registration retries temporary failures twice without opening permission prompts.

The read-only September 21 database check still reports PGRST205 for
`mobile_web_push_subscriptions`, `mobile_push_receipts`, and
`mobile_campaign_dispatches`. The SQL RPC is unavailable and no direct database
connection is configured locally. Apply the deployment migrations listed below
using the Supabase SQL editor or an authorized database connection. These changes
have not been applied to production by this repair.

Android configuration now reads `GOOGLE_SERVICES_JSON` (an EAS file environment
variable) or `mobile/google-services.json`. Obtain that file for the Firebase Android
app with package `com.lecomax.app`. Production Android builds on EAS fail clearly
if neither is supplied. Also configure the corresponding FCM V1 service account
in the EAS project's Android push credentials, following
[Expo's FCM setup](https://docs.expo.dev/push-notifications/fcm-credentials/).
The service account private key belongs in EAS credentials, not in the app bundle.
Firebase native configuration requires a new Android binary, not just an OTA update.

Before rollout, install the new binary on a test phone, accept the invitation,
verify successful subscription, and send a notification only to that test device.
Check delivery with the app open and closed, notification navigation, opt-out,
and recovery after changing permission in phone settings. Physical delivery and
production rollout remain unverified until credentials and database access exist.

Validated locally: mobile TypeScript checks, six registration/Expo response tests,
and the isolated SQL campaign/migration test (including repeat execution).

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
