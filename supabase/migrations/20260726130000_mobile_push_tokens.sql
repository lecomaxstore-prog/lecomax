create table if not exists public.mobile_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_push_tokens_user_active_idx
  on public.mobile_push_tokens (user_id, active);

alter table public.mobile_push_tokens enable row level security;
revoke all on table public.mobile_push_tokens from anon, authenticated;
grant all on table public.mobile_push_tokens to service_role;

notify pgrst, 'reload schema';
