create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  customer_email text not null check (char_length(customer_email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 120),
  order_number text check (order_number is null or char_length(order_number) <= 50),
  status text not null default 'open' check (status in ('open', 'waiting', 'resolved')),
  last_message text,
  last_message_at timestamptz not null default now(),
  customer_unread integer not null default 0 check (customer_unread >= 0),
  admin_unread integer not null default 0 check (admin_unread >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'support')),
  sender_user_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  client_message_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (conversation_id, client_message_id)
);

create index if not exists support_conversations_user_last_idx
  on public.support_conversations (user_id, last_message_at desc);
create index if not exists support_conversations_admin_inbox_idx
  on public.support_conversations (status, admin_unread desc, last_message_at desc);
create index if not exists support_messages_conversation_created_idx
  on public.support_messages (conversation_id, created_at asc);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.support_conversations from anon, authenticated;
revoke all on public.support_messages from anon, authenticated;

comment on table public.support_conversations is
  'Account-owned support inbox. Access is mediated by authenticated server APIs.';
comment on table public.support_messages is
  'Support messages with idempotent client IDs and server-verified ownership.';
