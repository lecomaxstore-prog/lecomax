-- PREPARED ONLY: execute after both migrations and their postflight checks pass.
-- Use a separately approved protected read-only monitoring connection.
-- Do not give an external monitor the worker CRON_SECRET or an execution URL.
begin read only;
set local statement_timeout='5s';
set local lock_timeout='1s';
select clock_timestamp() observed_at, public.seo_run_status() latest_run;
select reconciled_at,
  reconciled_at is null or reconciled_at < clock_timestamp()-interval '27 hours' heartbeat_stale
from public.seo_sync_health where singleton;
select count(*) filter(where state='failed') terminal_failures,
  count(*) filter(where state in ('pending','processing','retry')) outstanding,
  min(updated_at) filter(where state in ('pending','retry')) oldest_pending_at
from public.seo_sync_queue;
rollback;
