begin;

alter table public.mobile_notification_campaigns add column if not exists source_product_id text unique;
create unique index if not exists mobile_notifications_campaign_unique on public.mobile_notifications(campaign_id);

create table if not exists public.mobile_web_push_subscriptions (
  endpoint text primary key,
  installation_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  p256dh text not null,
  auth text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.mobile_push_receipts (
  ticket_id text primary key,
  campaign_id uuid not null references public.mobile_notification_campaigns(id) on delete cascade,
  token text not null,
  status text not null default 'pending' check (status in ('pending', 'ok', 'error', 'missing')),
  error_code text,
  created_at timestamptz not null default now(),
  checked_at timestamptz
);
create index if not exists mobile_push_receipts_pending_idx on public.mobile_push_receipts(created_at) where status = 'pending';
create table if not exists public.mobile_campaign_dispatches (
  campaign_id uuid not null references public.mobile_notification_campaigns(id) on delete cascade,
  recipient_hash text not null,
  status text not null default 'sending' check (status in ('sending', 'accepted', 'failed')),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, recipient_hash)
);
alter table public.mobile_campaign_dispatches enable row level security;
revoke all on public.mobile_campaign_dispatches from anon, authenticated;
grant all on public.mobile_campaign_dispatches to service_role;
alter table public.mobile_web_push_subscriptions enable row level security;
alter table public.mobile_push_receipts enable row level security;
revoke all on public.mobile_web_push_subscriptions, public.mobile_push_receipts from anon, authenticated;
grant all on public.mobile_web_push_subscriptions, public.mobile_push_receipts to service_role;

-- Enqueue in the product transaction, including direct database imports.
-- No historical backfill and no notifications for drafts or ordinary edits.
create or replace function public.queue_new_product_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.active is not true then return new; end if;
  if tg_op = 'UPDATE' then
    if old.active is true then return new; end if;
  end if;
  insert into public.mobile_notification_campaigns
    (source_product_id, title, body, deep_link, audience, category, status, scheduled_at, created_by)
  values
    (new.id::text, 'Nouveau chez L’ecomax', left(new.name || ' vient d’arriver. Découvrez-le en boutique.', 240),
     '/product/' || new.slug, 'all', 'new_products', 'scheduled', now(), 'system:new-product')
  on conflict (source_product_id) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_new_product_notification() from public, anon, authenticated;
drop trigger if exists queue_new_product_notification on public.products;
create trigger queue_new_product_notification after insert or update of active on public.products
for each row execute function public.queue_new_product_notification();
notify pgrst, 'reload schema';
commit;
