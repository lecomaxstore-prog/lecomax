begin;

-- Additive: historical orders are left untouched, with an unknown breakdown.
alter table public.orders add column if not exists pricing_snapshot jsonb;

create or replace function public.create_commerce_order(
  p_order jsonb, p_settings jsonb, p_setting_keys text[], p_zones jsonb, p_coupon jsonb default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb; previous public.orders%rowtype; current_settings jsonb; current_zones jsonb;
  coupon public.coupons%rowtype; snapshot jsonb; expected numeric;
begin
  if nullif(p_order->>'idempotency_key','') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_order->>'idempotency_key',0));
  select * into previous from public.orders where idempotency_key=p_order->>'idempotency_key';
  if found then return jsonb_build_object('id',previous.id,'order_number',previous.order_number,'items',previous.items,'pricing_snapshot',previous.pricing_snapshot,'duplicate',true); end if;

  -- These small configuration tables are held stable only for this transaction.
  -- This also protects against inserts/deletes between the API read and commit.
  lock table public.settings, public.shipping_zones in share mode;
  select coalesce(jsonb_object_agg(key,value),'{}') into current_settings from public.settings where key=any(p_setting_keys);
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'cities',cities,'standard_rate',standard_rate,
    'free_threshold',free_threshold,'estimated_days',estimated_days,'sort_order',sort_order,'active',active) order by id),'[]')
    into current_zones from public.shipping_zones where active=true;
  if current_settings is distinct from p_settings or current_zones is distinct from p_zones then raise exception 'CHECKOUT_CONFIGURATION_CHANGED'; end if;
  if current_settings->>'maintenance_mode'='true' then raise exception 'CHECKOUT_CONFIGURATION_CHANGED'; end if;
  snapshot:=p_order->'pricing_snapshot';
  if snapshot is null or snapshot->>'currency'<>'MAD' then raise exception 'INVALID_PRICING_SNAPSHOT'; end if;
  expected:=round((snapshot->>'subtotal')::numeric+(snapshot->>'shipping')::numeric+(snapshot->>'paymentFee')::numeric
    -(snapshot->>'discount')::numeric+case when (snapshot->>'taxesIncluded')::boolean then 0 else (snapshot->>'taxes')::numeric end,2);
  if expected is null or expected<0 or expected is distinct from (p_order->>'total')::numeric
    or expected is distinct from (snapshot->>'total')::numeric then raise exception 'INVALID_PRICING_SNAPSHOT'; end if;

  if p_coupon is not null and p_coupon<>'null'::jsonb then
    select * into coupon from public.coupons where id=(p_coupon->>'id')::uuid for update;
    if not found or not coupon.active or (coupon.expires_at is not null and coupon.expires_at<now())
      or (coupon.max_uses is not null and coalesce(coupon.used_count,0)>=coupon.max_uses)
      or coupon.type is distinct from p_coupon->>'type' or coupon.value is distinct from (p_coupon->>'value')::numeric
      or coupon.min_order is distinct from (p_coupon->>'min_order')::numeric then raise exception 'COUPON_CHANGED'; end if;
    update public.coupons set used_count=coalesce(used_count,0)+1,
      active=case when max_uses is not null and coalesce(used_count,0)+1>=max_uses then false else active end
      where id=coupon.id;
  end if;
  result:=public.create_order_with_inventory(p_order);
  update public.orders set pricing_snapshot=snapshot where id=(result->>'id')::uuid;
  return result||jsonb_build_object('pricing_snapshot',snapshot);
end; $$;
revoke all on function public.create_commerce_order(jsonb,jsonb,text[],jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.create_commerce_order(jsonb,jsonb,text[],jsonb,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
