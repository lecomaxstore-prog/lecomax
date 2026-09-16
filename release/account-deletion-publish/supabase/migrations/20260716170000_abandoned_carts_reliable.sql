-- Reliable abandoned-cart storage for L'ecomax.
-- Idempotent: safe for both new and existing projects.

create extension if not exists pgcrypto;

create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  cart_token uuid not null default gen_random_uuid(),
  phone text,
  name text,
  email text,
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null default 0 check (total >= 0),
  reminded boolean not null default false,
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.abandoned_carts add column if not exists cart_token uuid;
alter table public.abandoned_carts add column if not exists phone text;
alter table public.abandoned_carts add column if not exists name text;
alter table public.abandoned_carts add column if not exists email text;
alter table public.abandoned_carts add column if not exists items jsonb default '[]'::jsonb;
alter table public.abandoned_carts add column if not exists total numeric(12,2) default 0;
alter table public.abandoned_carts add column if not exists reminded boolean default false;
alter table public.abandoned_carts add column if not exists reminded_at timestamptz;
alter table public.abandoned_carts add column if not exists created_at timestamptz default now();
alter table public.abandoned_carts add column if not exists updated_at timestamptz default now();

update public.abandoned_carts set cart_token = gen_random_uuid() where cart_token is null;
update public.abandoned_carts set items = '[]'::jsonb where items is null;
update public.abandoned_carts set total = 0 where total is null or total < 0;
update public.abandoned_carts set reminded = false where reminded is null;
update public.abandoned_carts set created_at = now() where created_at is null;
update public.abandoned_carts set updated_at = coalesce(created_at, now()) where updated_at is null;

alter table public.abandoned_carts alter column cart_token set default gen_random_uuid();
alter table public.abandoned_carts alter column cart_token set not null;
alter table public.abandoned_carts alter column items set default '[]'::jsonb;
alter table public.abandoned_carts alter column items set not null;
alter table public.abandoned_carts alter column total set default 0;
alter table public.abandoned_carts alter column total set not null;
alter table public.abandoned_carts alter column reminded set default false;
alter table public.abandoned_carts alter column reminded set not null;
alter table public.abandoned_carts alter column created_at set default now();
alter table public.abandoned_carts alter column created_at set not null;
alter table public.abandoned_carts alter column updated_at set default now();
alter table public.abandoned_carts alter column updated_at set not null;

create unique index if not exists abandoned_carts_cart_token_uidx
  on public.abandoned_carts (cart_token);
create index if not exists abandoned_carts_updated_at_idx
  on public.abandoned_carts (updated_at desc);
create index if not exists abandoned_carts_reminded_updated_at_idx
  on public.abandoned_carts (reminded, updated_at desc);
create index if not exists abandoned_carts_phone_idx
  on public.abandoned_carts (phone) where phone is not null;
create index if not exists abandoned_carts_email_idx
  on public.abandoned_carts (lower(email)) where email is not null;

alter table public.abandoned_carts enable row level security;
revoke all on table public.abandoned_carts from anon, authenticated;
grant all on table public.abandoned_carts to service_role;

comment on table public.abandoned_carts is
  'Server-managed checkout recovery records. Public clients write only through the validated API.';

notify pgrst, 'reload schema';
