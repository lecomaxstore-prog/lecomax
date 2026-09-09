begin;

alter table public.mobile_notification_campaigns
  add column if not exists source_promotion_id text unique,
  add column if not exists source_offer_product_id text,
  add column if not exists source_event_key text unique,
  add column if not exists attempt_count integer not null default 0;

-- Queue offers in the same transaction as the admin/API write. No backfill.
create or replace function public.queue_promotion_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.active or (new.expires_at is not null and new.expires_at <= now()) then return new; end if;
  if TG_OP = 'UPDATE' and old.active and (old.expires_at is null or old.expires_at > now()) then return new; end if;
  insert into public.mobile_notification_campaigns
    (source_promotion_id, title, body, deep_link, audience, category, status, scheduled_at, created_by)
  values (new.id::text, 'Nouvelle offre chez L’ecomax',
    left(new.label || ' — Découvrez cette offre dans la boutique.', 240),
    '/', 'all', 'promotions', 'scheduled', now(), 'system:new-offer')
  on conflict (source_promotion_id) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_promotion_notification() from public, anon, authenticated;
drop trigger if exists queue_promotion_notification on public.promotions;
create trigger queue_promotion_notification after insert or update on public.promotions
for each row execute function public.queue_promotion_notification();

create or replace function public.queue_product_offer_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- New publications already have a new-products alert. Notify subsequent discounts.
  if not new.active or not old.active or new.original_price is null or new.original_price <= new.price then return new; end if;
  if not (new.price < old.price or coalesce(old.original_price, 0) <= old.price) then return new; end if;
  insert into public.mobile_notification_campaigns
    (source_offer_product_id, source_event_key, title, body, deep_link, audience, category, status, scheduled_at, created_by)
  values (new.id::text, 'product-offer:' || new.id::text || ':' || new.price::text || ':' || new.original_price::text,
    'Nouvelle offre chez L’ecomax', left(new.name || ' est en promotion. Découvrez son nouveau prix.', 240),
    '/product/' || new.slug, 'all', 'promotions', 'scheduled', now(), 'system:product-offer')
  on conflict (source_event_key) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_product_offer_notification() from public, anon, authenticated;
drop trigger if exists queue_product_offer_notification on public.products;
create trigger queue_product_offer_notification after update of price, original_price on public.products
for each row execute function public.queue_product_offer_notification();
notify pgrst, 'reload schema';
commit;
