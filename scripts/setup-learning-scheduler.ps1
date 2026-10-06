param([switch]$Activate)
$ErrorActionPreference = 'Stop'

# Reuse the linked-project and credential checks without exporting any secrets.
. (Join-Path $PSScriptRoot 'setup-micro-learning.ps1')
if ($Activate) {
  $schedulerSecret = [regex]::Match($envText, '(?m)^LEARNING_CRON_SECRET=([a-f0-9]{64})\s*$').Groups[1].Value
  if (-not $schedulerSecret) { throw 'LEARNING_CRON_SECRET must be configured locally and in Vercel before activation.' }
  $schema = [IO.File]::ReadAllText((Join-Path $projectRoot 'supabase/migrations/20261006130000_learning_scheduler.sql'))
  $query = @"
begin;
$schema
do `$job`$
declare secret_id uuid;
begin
  select id into secret_id from vault.secrets where name='lecomax_learning_cron_secret';
  if secret_id is null then
    perform vault.create_secret('$schedulerSecret', 'lecomax_learning_cron_secret', 'Dedicated learning scheduler authorization');
  else
    perform vault.update_secret(secret_id, '$schedulerSecret');
  end if;
end;
`$job`$;
select cron.schedule('lecomax-micro-learning', '* * * * *', 'select public.tick_micro_learning();');
commit;
"@
  $payload = @{ query = $query } | ConvertTo-Json
  try {
    $null = Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
  } catch { throw 'Learning scheduler installation failed. No secret values are included in this error.' }
}
$query = "select jobname, schedule, active from cron.job where jobname='lecomax-micro-learning';"
$payload = @{ query = $query; read_only = $true } | ConvertTo-Json
Invoke-RestMethod -Uri $queryEndpoint -Headers $headers -Method Post -ContentType 'application/json' -Body $payload | ConvertTo-Json -Depth 4
