$ErrorActionPreference = 'Stop'

# Read-only diagnostics. Reuse the existing linked-project identity checks.
# Never return owner addresses, device endpoints, push keys, or Vault secrets.
. (Join-Path $PSScriptRoot 'setup-micro-learning.ps1')
$query = @'
select jsonb_build_object(
  'checked_at', now(),
  'settings', (select jsonb_agg(jsonb_build_object(
    'enabled', enabled, 'paused', paused, 'interval_minutes', interval_minutes,
    'quiet_enabled', quiet_enabled, 'time_zone', time_zone, 'next_due_at', next_due_at
  )) from learning_notification_settings),
  'registered_admin_devices', (select count(*) from push_subscriptions where user_agent like '[LECOMAX_ADMIN] %'),
  'scheduler', (select jsonb_agg(jsonb_build_object('active', active, 'schedule', schedule))
    from cron.job where jobname='lecomax-micro-learning'),
  'recent_runs', (select jsonb_agg(r) from (
    select status, start_time, end_time from cron.job_run_details
    where jobid in (select jobid from cron.job where jobname='lecomax-micro-learning')
    order by start_time desc limit 3
  ) r),
  'recent_lessons', (select jsonb_agg(h) from (
    select tip_id, created_at, sent_at, delivery_state,
      (select count(*) from learning_notification_deliveries d where d.history_id=h.id and d.state='accepted') as accepted_devices,
      (select count(*) from learning_notification_deliveries d where d.history_id=h.id and d.state='failed') as failed_devices,
      (select count(*) from learning_notification_deliveries d where d.history_id=h.id and d.state='unknown') as unknown_devices
    from learning_notification_history h order by created_at desc limit 5
  ) h)
) as learning_delivery;
'@
$payload = @{ query = $query; read_only = $true } | ConvertTo-Json
try {
  Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json' -Body $payload | ConvertTo-Json -Depth 10
} catch {
  throw 'Learning delivery diagnostics failed. Check Supabase access and scheduler migrations.'
}
