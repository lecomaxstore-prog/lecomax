-- Consent-backed behavioral intelligence used for catalogue optimization.
create table if not exists public.data_collection_consents (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  browser text,
  os text,
  screen_width integer,
  screen_height integer,
  language text,
  timezone text,
  referrer text,
  ip_address text,
  country text,
  city text,
  latitude numeric,
  longitude numeric
);

create table if not exists public.client_behavioral_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_type text not null,
  path text,
  title text,
  product_id text,
  product_name text,
  category text,
  query text,
  extra jsonb,
  created_at timestamptz not null default now()
);

create index if not exists data_collection_consents_active_idx
  on public.data_collection_consents (session_id)
  where revoked_at is null;
create index if not exists client_events_session_created_idx
  on public.client_behavioral_events (session_id, created_at desc);
create index if not exists client_events_type_created_idx
  on public.client_behavioral_events (event_type, created_at desc);
create index if not exists client_events_product_created_idx
  on public.client_behavioral_events (product_id, created_at desc)
  where product_id is not null;
create index if not exists client_events_category_created_idx
  on public.client_behavioral_events (category, created_at desc)
  where category is not null;

alter table public.data_collection_consents enable row level security;
alter table public.client_behavioral_events enable row level security;

comment on table public.data_collection_consents is
  'Explicit visitor consent records. Browser writes are routed through the server.';
comment on table public.client_behavioral_events is
  'Bounded first-party shopping events recorded only for active consent sessions.';

create table if not exists public.product_intelligence_daily (
  day date not null default current_date,
  product_id text not null,
  category text,
  product_views integer not null default 0,
  cart_adds integer not null default 0,
  checkout_starts integer not null default 0,
  purchases integer not null default 0,
  primary key (day, product_id)
);

create index if not exists product_intelligence_product_day_idx
  on public.product_intelligence_daily (product_id, day desc);
create index if not exists product_intelligence_day_idx
  on public.product_intelligence_daily (day desc);

alter table public.product_intelligence_daily enable row level security;

create or replace function public.increment_product_intelligence(
  p_product_id text,
  p_category text,
  p_event_type text
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.product_intelligence_daily (
    day,
    product_id,
    category,
    product_views,
    cart_adds,
    checkout_starts,
    purchases
  ) values (
    current_date,
    left(p_product_id, 100),
    nullif(left(coalesce(p_category, ''), 100), ''),
    case when p_event_type = 'product_view' then 1 else 0 end,
    case when p_event_type = 'cart_add' then 1 else 0 end,
    case when p_event_type = 'checkout_start' then 1 else 0 end,
    case when p_event_type = 'checkout_complete' then 1 else 0 end
  )
  on conflict (day, product_id) do update set
    category = coalesce(excluded.category, product_intelligence_daily.category),
    product_views = product_intelligence_daily.product_views + excluded.product_views,
    cart_adds = product_intelligence_daily.cart_adds + excluded.cart_adds,
    checkout_starts = product_intelligence_daily.checkout_starts + excluded.checkout_starts,
    purchases = product_intelligence_daily.purchases + excluded.purchases;
$$;

revoke all on function public.increment_product_intelligence(text, text, text) from public, anon, authenticated;
grant execute on function public.increment_product_intelligence(text, text, text) to service_role;

comment on table public.product_intelligence_daily is
  'Compact daily conversion aggregates used by the recommendation API.';
