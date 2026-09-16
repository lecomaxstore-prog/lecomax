create table if not exists public.mobile_notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 240),
  deep_link text not null default '/' check (char_length(deep_link) between 1 and 500),
  image_url text check (image_url is null or char_length(image_url) <= 1000),
  audience text not null default 'all' check (audience in ('all', 'android', 'ios', 'users')),
  audience_user_ids uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_count integer not null default 0 check (delivered_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  target_count integer not null default 0 check (target_count >= 0),
  error_message text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (audience <> 'users' or cardinality(audience_user_ids) > 0),
  check (status <> 'scheduled' or scheduled_at is not null)
);

create index if not exists mobile_notification_campaigns_status_schedule_idx
  on public.mobile_notification_campaigns (status, scheduled_at);
create index if not exists mobile_notification_campaigns_created_idx
  on public.mobile_notification_campaigns (created_at desc);

create table if not exists public.mobile_notifications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.mobile_notification_campaigns(id) on delete set null,
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 240),
  deep_link text not null default '/' check (char_length(deep_link) between 1 and 500),
  image_url text,
  audience text not null default 'all' check (audience in ('all', 'android', 'ios', 'users')),
  audience_user_ids uuid[] not null default '{}',
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mobile_notifications_published_idx
  on public.mobile_notifications (published_at desc);

create table if not exists public.mobile_notification_reads (
  notification_id uuid not null references public.mobile_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists mobile_notification_reads_user_idx
  on public.mobile_notification_reads (user_id, read_at desc);

create table if not exists public.mobile_control_audit (
  id bigint generated always as identity primary key,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mobile_control_audit_created_idx
  on public.mobile_control_audit (created_at desc);

alter table public.mobile_notification_campaigns enable row level security;
alter table public.mobile_notifications enable row level security;
alter table public.mobile_notification_reads enable row level security;
alter table public.mobile_control_audit enable row level security;

revoke all on table public.mobile_notification_campaigns from anon, authenticated;
revoke all on table public.mobile_notifications from anon, authenticated;
revoke all on table public.mobile_notification_reads from anon, authenticated;
revoke all on table public.mobile_control_audit from anon, authenticated;
grant all on table public.mobile_notification_campaigns to service_role;
grant all on table public.mobile_notifications to service_role;
grant all on table public.mobile_notification_reads to service_role;
grant all on table public.mobile_control_audit to service_role;
grant usage, select on sequence public.mobile_control_audit_id_seq to service_role;

notify pgrst, 'reload schema';
