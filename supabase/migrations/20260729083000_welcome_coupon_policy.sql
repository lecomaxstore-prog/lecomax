-- Welcome offers require 200 MAD of eligible merchandise and expire as soon
-- as their single redemption is consumed.
update public.coupons
set min_order = 200
where code like 'BIENVENUE-%'
  and (min_order is null or min_order < 200);

create or replace function public.consume_coupon_use(p_coupon_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with consumed as (
    update public.coupons as coupon
    set
      used_count = coalesce(coupon.used_count, 0) + 1,
      active = case
        when coupon.max_uses is not null
          and coalesce(coupon.used_count, 0) + 1 >= coupon.max_uses
          then false
        else coupon.active
      end,
      expires_at = case
        when coupon.max_uses is not null
          and coalesce(coupon.used_count, 0) + 1 >= coupon.max_uses
          then now()
        else coupon.expires_at
      end
    where coupon.id = p_coupon_id
      and coupon.active = true
      and (coupon.expires_at is null or coupon.expires_at >= now())
      and (
        coupon.max_uses is null
        or coalesce(coupon.used_count, 0) < coupon.max_uses
      )
    returning
      coupon.id,
      coupon.code,
      coupon.used_count,
      coupon.max_uses,
      coupon.active,
      coupon.expires_at
  )
  select to_jsonb(consumed) from consumed;
$$;

revoke all on function public.consume_coupon_use(uuid) from public;
revoke all on function public.consume_coupon_use(uuid) from anon;
revoke all on function public.consume_coupon_use(uuid) from authenticated;
grant execute on function public.consume_coupon_use(uuid) to service_role;
