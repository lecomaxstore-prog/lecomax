-- Apply before deploying the webhook handler. No production data is deleted.
alter table public.orders add column if not exists payment_event_at timestamptz;

create or replace function public.reconcile_paypal_webhook(
  p_event_id text, p_event_type text, p_capture_id text,
  p_status text, p_created_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare target public.orders; inserted integer;
begin
  if p_event_id is null or p_event_id !~ '^[A-Za-z0-9_.:-]{1,100}$'
    or p_event_type is null or p_event_type !~ '^[A-Za-z0-9_.:-]{1,100}$' then
    raise exception 'INVALID_PAYMENT_EVENT';
  end if;
  -- Serialize retries, including concurrent deliveries of the same event.
  perform pg_advisory_xact_lock(hashtextextended(p_event_id, 0));
  if exists (select 1 from public.paypal_webhook_events where event_id = p_event_id) then
    return jsonb_build_object('received', true, 'duplicate', true);
  end if;
  if p_status is not null then
    if p_status not in ('pending','captured','failed','refunded','reversed') or p_created_at is null or p_capture_id is null then
      raise exception 'INVALID_PAYMENT_EVENT';
    end if;
    select * into target from public.orders where payment_reference = p_capture_id for update;
    -- PayPal can deliver before checkout writes the order. Roll back and retry.
    if not found then raise exception 'PAYMENT_ORDER_NOT_READY'; end if;
    if (target.payment_event_at is null or p_created_at > target.payment_event_at)
      and not (target.payment_status in ('refunded','reversed') and p_status not in ('refunded','reversed'))
      and not (target.payment_status = 'captured' and p_status in ('pending','failed')) then
      update public.orders set payment_status = p_status, payment_event_at = p_created_at, updated_at = now()
        where id = target.id;
    end if;
  end if;
  insert into public.paypal_webhook_events(event_id,event_type,capture_id) values(p_event_id,p_event_type,p_capture_id);
  return jsonb_build_object('received', true, 'duplicate', false);
end $$;
revoke all on function public.reconcile_paypal_webhook(text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.reconcile_paypal_webhook(text,text,text,text,timestamptz) to service_role;
notify pgrst, 'reload schema';
