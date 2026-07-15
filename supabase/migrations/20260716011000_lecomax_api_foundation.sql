-- L'ecomax production API foundation.
-- Safe to run more than once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value, updated_at)
values
  ('shipping_cost', '35', now()),
  ('free_shipping_threshold', '500', now()),
  ('shipping_estimated_days', '2-5 jours ouvrables', now()),
  ('announcement_1', 'LIVRAISON GRATUITE DÈS 500 MAD AU MAROC', now())
on conflict (key) do update
set value = excluded.value,
    updated_at = excluded.updated_at;

alter table public.orders
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_points (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists user_points_points_idx
  on public.user_points (points desc);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  customer_name text not null,
  customer_email text,
  product_name text not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists returns_status_created_at_idx
  on public.returns (status, created_at desc);
create index if not exists returns_order_number_idx
  on public.returns (order_number);

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  status text not null default 'active'
    check (status in ('active', 'escalated', 'resolved')),
  last_message text,
  last_at timestamptz not null default now(),
  unread_count integer not null default 0 check (unread_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_conversations_last_at_idx
  on public.whatsapp_conversations (last_at desc);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.whatsapp_conversations(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  body text not null,
  sent_by text not null default 'client'
    check (sent_by in ('client', 'ai', 'agent')),
  wa_message_id text unique,
  timestamp timestamptz not null default now()
);

create index if not exists whatsapp_messages_conversation_timestamp_idx
  on public.whatsapp_messages (conversation_id, timestamp asc);

alter table public.user_points enable row level security;
alter table public.returns enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;

-- These tables are accessed only by authenticated server routes using the
-- service-role key. No browser/anon policies are intentionally created.

notify pgrst, 'reload schema';
