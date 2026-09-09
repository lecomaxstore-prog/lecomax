begin;

create table if not exists public.assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- no direct foreign key to auth.users if we use custom auth or just simple string IDs, but uuid is fine
  platform text not null check (platform in ('web', 'mobile_app', 'admin')),
  context_data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assistant_sessions_user_id_idx on public.assistant_sessions (user_id);
create index if not exists assistant_sessions_updated_at_idx on public.assistant_sessions (updated_at desc);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assistant_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  structured_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assistant_messages_session_id_idx on public.assistant_messages (session_id, created_at asc);

create table if not exists public.assistant_analytics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.assistant_sessions(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assistant_analytics_event_type_idx on public.assistant_analytics (event_type);
create index if not exists assistant_analytics_created_at_idx on public.assistant_analytics (created_at desc);

create table if not exists public.assistant_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.assistant_messages(id) on delete cascade,
  is_helpful boolean not null,
  feedback_text text,
  created_at timestamptz not null default now()
);

alter table public.assistant_sessions enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.assistant_analytics enable row level security;
alter table public.assistant_feedback enable row level security;

notify pgrst, 'reload schema';

commit;

