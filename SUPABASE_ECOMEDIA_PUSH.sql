-- L'ecomax / Ecomedia browser push notifications
-- Run once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions add column if not exists p256dh text;
alter table public.push_subscriptions add column if not exists auth text;
alter table public.push_subscriptions add column if not exists user_agent text;
alter table public.push_subscriptions add column if not exists created_at timestamptz default now();
alter table public.push_subscriptions add column if not exists updated_at timestamptz default now();
create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

create table if not exists public.push_notifications_log (
  id uuid primary key default gen_random_uuid(),
  event_key text,
  title text not null,
  body text,
  icon text,
  image text,
  click_url text,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.push_notifications_log add column if not exists event_key text;
alter table public.push_notifications_log add column if not exists title text;
alter table public.push_notifications_log add column if not exists body text;
alter table public.push_notifications_log add column if not exists icon text;
alter table public.push_notifications_log add column if not exists image text;
alter table public.push_notifications_log add column if not exists click_url text;
alter table public.push_notifications_log add column if not exists sent_count integer default 0;
alter table public.push_notifications_log add column if not exists failed_count integer default 0;
alter table public.push_notifications_log add column if not exists created_at timestamptz default now();
create index if not exists push_notifications_log_created_at_idx
  on public.push_notifications_log (created_at desc);

alter table public.push_subscriptions enable row level security;
alter table public.push_notifications_log enable row level security;

-- Push credentials are private. Only the server-side service role may access them.
revoke all on table public.push_subscriptions from anon, authenticated;
revoke all on table public.push_notifications_log from anon, authenticated;

comment on table public.push_subscriptions is
  'Private Web Push subscriptions. Server access only.';
comment on table public.push_notifications_log is
  'Server-side history of sent browser notifications.';
