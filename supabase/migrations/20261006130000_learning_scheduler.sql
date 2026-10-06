-- Supabase schedules the tick because Vercel Hobby only supports daily cron jobs.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.tick_micro_learning()
returns bigint language plpgsql security definer set search_path = public as $$
declare
  scheduler_secret text;
  request_id bigint;
begin
  if not exists (
    select 1 from learning_notification_settings s
    where s.enabled and not s.paused and s.next_due_at <= now()
    and (not s.quiet_enabled or not (
      (s.quiet_start < s.quiet_end and (now() at time zone s.time_zone)::time >= s.quiet_start and (now() at time zone s.time_zone)::time < s.quiet_end)
      or (s.quiet_start > s.quiet_end and ((now() at time zone s.time_zone)::time >= s.quiet_start or (now() at time zone s.time_zone)::time < s.quiet_end))
    ))
    and exists(select 1 from learning_tips t where not exists(select 1 from learning_notification_history h where h.owner_email=s.owner_email and h.tip_id=t.id))
  ) and not exists(select 1 from learning_notification_history where delivery_state='pending') then return null; end if;
  select decrypted_secret into scheduler_secret from vault.decrypted_secrets where name='lecomax_learning_cron_secret';
  if scheduler_secret is null then raise exception 'Learning scheduler secret missing'; end if;
  select net.http_get(
    url := 'https://lecomax.com/api/cron/micro-learning',
    headers := jsonb_build_object('Authorization', 'Bearer ' || scheduler_secret),
    timeout_milliseconds := 60000
  ) into request_id;
  return request_id;
end;
$$;
revoke all on function public.tick_micro_learning() from public, anon, authenticated;
grant execute on function public.tick_micro_learning() to service_role;
-- The setup script registers the job only after the deployment is ready.
