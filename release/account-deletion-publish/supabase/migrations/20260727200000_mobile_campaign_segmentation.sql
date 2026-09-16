alter table public.mobile_notification_campaigns drop constraint if exists mobile_notification_campaigns_audience_check;
alter table public.mobile_notification_campaigns
  add constraint mobile_notification_campaigns_audience_check
  check (audience in ('all', 'android', 'ios', 'users', 'new_customers', 'active_buyers', 'vip', 'lapsed', 'no_orders'));

alter table public.mobile_notifications drop constraint if exists mobile_notifications_audience_check;
alter table public.mobile_notifications
  add constraint mobile_notifications_audience_check
  check (audience in ('all', 'android', 'ios', 'users', 'new_customers', 'active_buyers', 'vip', 'lapsed', 'no_orders'));

alter table public.mobile_notification_campaigns
  add column if not exists category text not null default 'general';
alter table public.mobile_notification_campaigns drop constraint if exists mobile_notification_campaigns_category_check;
alter table public.mobile_notification_campaigns
  add constraint mobile_notification_campaigns_category_check
  check (category in ('general', 'promotions', 'new_products', 'loyalty', 'price_drops', 'back_in_stock', 'service'));

alter table public.mobile_notifications
  add column if not exists category text not null default 'general';
alter table public.mobile_notifications drop constraint if exists mobile_notifications_category_check;
alter table public.mobile_notifications
  add constraint mobile_notifications_category_check
  check (category in ('general', 'promotions', 'new_products', 'loyalty', 'price_drops', 'back_in_stock', 'service'));

create table if not exists public.mobile_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  marketing_enabled boolean not null default true,
  promotions boolean not null default true,
  new_products boolean not null default true,
  loyalty boolean not null default true,
  price_drops boolean not null default true,
  back_in_stock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mobile_notification_preferences enable row level security;
revoke all on table public.mobile_notification_preferences from anon, authenticated;
grant all on table public.mobile_notification_preferences to service_role;

create index if not exists mobile_notification_preferences_marketing_idx
  on public.mobile_notification_preferences (marketing_enabled) where marketing_enabled = false;

notify pgrst, 'reload schema';
