# Arabic micro-learning

The existing owner-only Learning Center now includes `/admin/how-it-was-built/learn/` and stable lesson URLs under `/admin/how-it-was-built/learn/tip/{id}/`. Existing admin authentication and the learning PIN protect the API and pages. Login and PIN unlock preserve lesson destinations.

## Reused infrastructure

- Existing Supabase admin email identity, `push_subscriptions`, VAPID credentials, and `/sw.js`.
- Existing `/api/admin/push-subscribe` registration endpoint; every browser has its own endpoint.
- Supabase pg_cron calls the authenticated `/api/cron/micro-learning` handler once a minute, allowing the existing Vercel Hobby hosting plan.
- No Firebase deployment, duplicate service worker, browser interval, or native customer-app notifications.

## Database setup

Apply these additive migrations in order to the linked project:

1. `supabase/migrations/20261006120000_micro_learning.sql`
2. `supabase/migrations/20261006121000_micro_learning_content.sql`
3. `supabase/migrations/20261006190000_learning_cadence.sql`

`scripts/setup-micro-learning.ps1 -Apply` uses the existing Supabase CLI credential, verifies that the linked project matches `.env.local`, and applies all three inside a transaction. Without `-Apply` it only checks readiness. The tables use RLS with no browser-role grants. Only authenticated owner API handlers and the service-role scheduler access them. No existing store rows are modified. The schema depends on the existing `push_subscriptions.admin_email` migration.

There are 102 Arabic tips, three per topic across 34 levels. IDs are immutable. To extend the course, append lessons and a new content migration; never renumber published tips. The sequence is finite and stops instead of recycling lessons. Content targets this project's Next.js 15; examples are deliberately small and labeled as simplified. A tip normally takes less than a minute to read.

## Scheduler and activation

Required server configuration: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `VAPID_SUBJECT`, `VAPID_PRIVATE_KEY`, and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Keep all private values on the server. The public VAPID key is intentionally available to the browser.

The one-minute cron checks a database deadline; the default interval is **10 minutes**, with 20, 30 and 60 minute choices. The clock starts when the owner opts in. It is never started or reset by page rendering. Quiet hours default to 22:00–08:00 Europe/Paris and can be changed or disabled. PostgreSQL timezone conversion handles DST. Resume and interval changes start a fresh interval. Quiet hours and missed cron runs never generate catch-up bursts.

Production uses `scripts/setup-learning-scheduler.ps1 -Activate` to register `lecomax-micro-learning` in Supabase pg_cron. Its dedicated `LEARNING_CRON_SECRET` must match the Vercel production variable and Supabase Vault value. The job calls the endpoint only when work is due. Vercel Cron runs on production deployments only. Frequent cron requires a supporting plan (Hobby permits daily execution only); see https://vercel.com/docs/cron-jobs/usage-and-pricing. An external trusted scheduler may call the same HTTPS endpoint every minute with the `Authorization: Bearer <CRON_SECRET>` header. Do not place the secret in the URL. Never configure both schedulers unnecessarily, although concurrent calls are deduplicated.

For local use after migrations and `.env.local` configuration, run `node scripts/run-micro-learning.mjs` alongside `npm run dev`. This is a server process; the browser may be closed. It must stay running, and localhost on a desktop is not the phone's localhost.

Open the learning notification page on the target device and choose the Arabic enable button. This user gesture requests browser permission, reuses/registers the device subscription, and enables learning. No notification is sent before opt-in. On iOS, use a supported installed home-screen web app over HTTPS. OS settings, battery management, network conditions and push-service delays can affect arrival time. Ten minutes is a scheduling interval, not a guaranteed OS display deadline.

## Delivery semantics

The claim function locks the owner's settings row, chooses the next unseen tip, snapshots its content, creates unique per-device delivery rows, and advances the deadline in one transaction. A conditional update grants one worker each pending delivery. An accepted Web Push request means acceptance by the push service, not proof that the phone displayed or read it.

Ambiguous sends are **not retried**, because a timeout can occur after acceptance. Stale `sending` attempts become `unknown` after two minutes. Pending attempts can resume within a ten-minute freshness window. Expired subscriptions are removed. Failed/unknown lessons remain readable in history and are not sent repeatedly. This favors avoiding duplicates over guaranteed delivery; exactly-once display cannot be guaranteed by Web Push. The service worker uses stable tags and no re-alert for duplicate learning tags.

Read time is recorded on opening a received lesson. Learned state is explicit; sent or read does not falsely imply understanding. Completing all tips in a topic completes that topic. Favorites, history and progress are shared across devices. Turning learning off does not unsubscribe a device from operational store alerts.

## Verification

Run `node --test tests/micro-learning*.test.ts tests/learning-reminder.test.ts tests/admin-push.test.ts tests/how-built-pin.test.ts` and `npm run build`.

Before enabling production: apply migrations, check required environment variables, deploy, verify the scheduler is registered, then opt in on a real phone. Check the first notification, Arabic text, exact lesson navigation through login/PIN, pause, quiet hours, and another registered device. Automated tests exercise the SQL claims, API authorization, content, settings, progress and service worker; OS delivery still requires the real-device check.

The cadence migration keeps the original interval phase when a tick arrives late, skips missed slots, and chooses a future deadline without catch-up bursts.
