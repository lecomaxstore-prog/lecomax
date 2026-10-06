-- Reuse the verified admin email identity and existing device subscriptions.
create table if not exists public.learning_tips (
  id integer primary key,
  topic text not null,
  level integer not null check (level between 1 and 34),
  difficulty text not null,
  title text not null,
  content text not null,
  code text not null default '',
  remember text not null,
  source_path text not null default ''
);
create table if not exists public.learning_notification_settings (
  owner_email text primary key,
  enabled boolean not null default false,
  paused boolean not null default false,
  interval_minutes integer not null default 10 check (interval_minutes in (10,20,30,60)),
  quiet_enabled boolean not null default true,
  quiet_start time not null default '22:00',
  quiet_end time not null default '08:00',
  time_zone text not null default 'Europe/Paris',
  next_due_at timestamptz not null default (now() + interval '10 minutes'),
  updated_at timestamptz not null default now(),
  check (not quiet_enabled or quiet_start <> quiet_end)
);
create table if not exists public.learning_notification_history (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null references public.learning_notification_settings(owner_email),
  tip_id integer not null references public.learning_tips(id),
  title text not null,
  content text not null,
  topic text not null,
  level integer not null,
  difficulty text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz,
  learned_at timestamptz,
  favorite boolean not null default false,
  delivery_state text not null default 'pending' check (delivery_state in ('pending','accepted','partial','failed','unknown')),
  unique(owner_email, tip_id)
);
create table if not exists public.learning_notification_deliveries (
  history_id uuid not null references public.learning_notification_history(id),
  endpoint text not null,
  state text not null default 'pending' check (state in ('pending','sending','accepted','failed','unknown')),
  attempted_at timestamptz,
  primary key(history_id, endpoint)
);
create index if not exists learning_due_idx on public.learning_notification_settings(next_due_at) where enabled and not paused;
create index if not exists learning_history_owner_idx on public.learning_notification_history(owner_email, created_at desc);

alter table public.learning_tips enable row level security;
alter table public.learning_notification_settings enable row level security;
alter table public.learning_notification_history enable row level security;
alter table public.learning_notification_deliveries enable row level security;
revoke all on public.learning_tips, public.learning_notification_settings, public.learning_notification_history, public.learning_notification_deliveries from anon, authenticated;
grant all on public.learning_tips, public.learning_notification_settings, public.learning_notification_history, public.learning_notification_deliveries to service_role;

-- The row lock serializes concurrent schedulers. One due lesson, never a catch-up burst.
create or replace function public.claim_micro_learning(p_owner text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  preference learning_notification_settings%rowtype;
  tip learning_tips%rowtype;
  local_time time;
  history_id uuid;
begin
  select * into preference from learning_notification_settings where owner_email = p_owner for update;
  if not found or not preference.enabled or preference.paused or preference.next_due_at > now() then return null; end if;
  local_time := (now() at time zone preference.time_zone)::time;
  if preference.quiet_enabled and (
    (preference.quiet_start < preference.quiet_end and local_time >= preference.quiet_start and local_time < preference.quiet_end)
    or (preference.quiet_start > preference.quiet_end and (local_time >= preference.quiet_start or local_time < preference.quiet_end))
  ) then return null; end if;
  if not exists(select 1 from push_subscriptions where admin_email = p_owner and user_agent like '[LECOMAX_ADMIN] %') then return null; end if;
  select * into tip from learning_tips t where not exists (
    select 1 from learning_notification_history h where h.owner_email = p_owner and h.tip_id = t.id
  ) order by t.id limit 1;
  if not found then return null; end if;
  insert into learning_notification_history(owner_email,tip_id,title,content,topic,level,difficulty)
    values(p_owner,tip.id,tip.title,tip.content,tip.topic,tip.level,tip.difficulty) returning id into history_id;
  insert into learning_notification_deliveries(history_id,endpoint)
    select history_id, endpoint from push_subscriptions where admin_email = p_owner and user_agent like '[LECOMAX_ADMIN] %'
    on conflict do nothing;
  update learning_notification_settings set next_due_at = now() + make_interval(mins => interval_minutes) where owner_email = p_owner;
  return history_id;
end;
$$;
revoke all on function public.claim_micro_learning(text) from public, anon, authenticated;
grant execute on function public.claim_micro_learning(text) to service_role;

-- Settings edits serialize with the scheduler and do not reset a running timer.
create or replace function public.save_micro_learning_settings(p_owner text, p_settings jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from pg_timezone_names where name = p_settings->>'time_zone') then raise exception 'Invalid time zone'; end if;
  insert into learning_notification_settings(owner_email) values(p_owner) on conflict do nothing;
  update learning_notification_settings set
    next_due_at = case when (not enabled and (p_settings->>'enabled')::boolean)
      or (paused and not (p_settings->>'paused')::boolean)
      or interval_minutes <> (p_settings->>'interval_minutes')::integer
      then now() + make_interval(mins => (p_settings->>'interval_minutes')::integer) else next_due_at end,
    enabled = (p_settings->>'enabled')::boolean, paused = (p_settings->>'paused')::boolean,
    interval_minutes = (p_settings->>'interval_minutes')::integer,
    quiet_enabled = (p_settings->>'quiet_enabled')::boolean,
    quiet_start = (p_settings->>'quiet_start')::time, quiet_end = (p_settings->>'quiet_end')::time,
    time_zone = p_settings->>'time_zone', updated_at = now()
  where owner_email = p_owner;
end;
$$;
revoke all on function public.save_micro_learning_settings(text,jsonb) from public, anon, authenticated;
grant execute on function public.save_micro_learning_settings(text,jsonb) to service_role;
