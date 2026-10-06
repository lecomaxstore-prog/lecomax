-- Keep the original interval phase when a scheduler tick or request arrives late.
-- Skip missed slots and always choose a future deadline: never catch up in bursts.
create or replace function public.claim_micro_learning(p_owner text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  preference learning_notification_settings%rowtype;
  tip learning_tips%rowtype;
  local_time time;
  history_id uuid;
begin
  select * into preference from learning_notification_settings where owner_email = p_owner for update;
  if not found or not preference.enabled or preference.paused or preference.next_due_at > now() then return null; end if;
  local_time := (now() at time zone preference.time_zone)::time;
  if preference.quiet_enabled and (
    (preference.quiet_start < preference.quiet_end and local_time >= preference.quiet_start and local_time < preference.quiet_end)
    or (preference.quiet_start > preference.quiet_end and (local_time >= preference.quiet_start or local_time < preference.quiet_end))
  ) then return null; end if;
  if not exists(select 1 from push_subscriptions where admin_email = p_owner and user_agent like '[LECOMAX_ADMIN] %') then return null; end if;
  select * into tip from learning_tips t where not exists (
    select 1 from learning_notification_history h where h.owner_email = p_owner and h.tip_id = t.id
  ) order by t.id limit 1;
  if not found then return null; end if;
  insert into learning_notification_history(owner_email,tip_id,title,content,topic,level,difficulty)
    values(p_owner,tip.id,tip.title,tip.content,tip.topic,tip.level,tip.difficulty) returning id into history_id;
  insert into learning_notification_deliveries(history_id,endpoint)
    select history_id, endpoint from push_subscriptions where admin_email = p_owner and user_agent like '[LECOMAX_ADMIN] %'
    on conflict do nothing;
  update learning_notification_settings set next_due_at = date_bin(make_interval(mins => preference.interval_minutes), now(), preference.next_due_at)
    + make_interval(mins => preference.interval_minutes) where owner_email = p_owner;
  return history_id;
end;
$$;
revoke all on function public.claim_micro_learning(text) from public, anon, authenticated;
grant execute on function public.claim_micro_learning(text) to service_role;


-- The external scheduler ticks on minute boundaries. Align existing future
-- deadlines once, so request latency does not add an extra minute.
update public.learning_notification_settings
set next_due_at = date_trunc('minute', next_due_at)
where enabled and not paused and next_due_at > now();
