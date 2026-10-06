-- Owner identity follows existing signed admin sessions (email, not auth.users).
create table if not exists public.ai_learning_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  title text not null check (char_length(title) between 1 and 120),
  mode text not null,
  topic text not null,
  active_request uuid,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_email)
);
create index if not exists ai_learning_conversations_owner on public.ai_learning_conversations(owner_email, updated_at desc);
create table if not exists public.ai_learning_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  owner_email text not null,
  request_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null default '' check (char_length(content) <= 30000),
  status text not null default 'complete' check (status in ('pending','complete','failed')),
  bookmarked boolean not null default false,
  sources jsonb not null default '[]',
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now(),
  foreign key (conversation_id, owner_email) references public.ai_learning_conversations(id, owner_email) on delete cascade,
  unique (owner_email, request_id, role)
);
create index if not exists ai_learning_messages_history on public.ai_learning_messages(owner_email, conversation_id, created_at);
create table if not exists public.ai_learning_progress (
  owner_email text not null,
  topic text not null,
  confidence integer not null default 0 check (confidence in (0,25,50,75,100)),
  difficulty text not null default 'beginner' check (difficulty in ('beginner','comfortable','advanced')),
  needs_practice boolean not null default true,
  attempts integer not null default 0,
  completed_exercises integer not null default 0,
  mistake_note text not null default '' check (char_length(mistake_note) <= 1000),
  studied_turns integer not null default 0,
  last_studied_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (owner_email, topic)
);
alter table public.ai_learning_conversations enable row level security;
alter table public.ai_learning_messages enable row level security;
alter table public.ai_learning_progress enable row level security;
revoke all on public.ai_learning_conversations, public.ai_learning_messages, public.ai_learning_progress from public, anon, authenticated;
grant all on public.ai_learning_conversations, public.ai_learning_messages, public.ai_learning_progress to service_role;

-- Serialize across conversations for a per-owner durable budget and one active turn.
create or replace function public.begin_ai_learning_turn(p_owner text, p_conversation uuid, p_request uuid, p_content text, p_mode text, p_topic text, p_attempt boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare current_conversation ai_learning_conversations; message_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('ai-tutor:' || p_owner, 0));
  select * into current_conversation from ai_learning_conversations where id=p_conversation and owner_email=p_owner for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if exists(select 1 from ai_learning_messages where owner_email=p_owner and request_id=p_request) then raise exception 'DUPLICATE_REQUEST'; end if;
  if exists(select 1 from ai_learning_conversations where owner_email=p_owner and lease_until>now()) then raise exception 'TURN_BUSY'; end if;
  if (select count(*) from ai_learning_messages where owner_email=p_owner and role='user' and created_at>now()-interval '15 minutes') >= 12
    or (select count(*) from ai_learning_messages where owner_email=p_owner and role='user' and created_at>now()-interval '24 hours') >= 80 then raise exception 'RATE_LIMIT'; end if;
  if (select count(*) from ai_learning_messages where conversation_id=p_conversation and role='user') >= 100 then raise exception 'SESSION_FULL'; end if;
  update ai_learning_messages set status='failed' where owner_email=p_owner and status='pending';
  update ai_learning_conversations set active_request=null, lease_until=null where owner_email=p_owner and lease_until<=now();
  update ai_learning_conversations set active_request=p_request, lease_until=now()+interval '100 seconds', updated_at=now(), mode=p_mode, topic=p_topic where id=p_conversation;
  insert into ai_learning_messages(conversation_id,owner_email,request_id,role,content) values(p_conversation,p_owner,p_request,'user',p_content);
  insert into ai_learning_messages(conversation_id,owner_email,request_id,role,status,created_at) values(p_conversation,p_owner,p_request,'assistant','pending',now()+interval '1 microsecond') returning id into message_id;
  insert into ai_learning_progress(owner_email,topic,attempts) values(p_owner,p_topic,case when p_attempt then 1 else 0 end)
    on conflict(owner_email,topic) do update set attempts=ai_learning_progress.attempts+case when p_attempt then 1 else 0 end,last_studied_at=now();
  return message_id;
end;
$$;
create or replace function public.finish_ai_learning_turn(p_owner text,p_conversation uuid,p_request uuid,p_content text,p_sources jsonb,p_success boolean,p_input integer,p_output integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare current_topic text;
begin
  select topic into current_topic from ai_learning_conversations where id=p_conversation and owner_email=p_owner and active_request=p_request for update;
  if not found then return false; end if;
  update ai_learning_messages set content=p_content,sources=p_sources,status=case when p_success then 'complete' else 'failed' end,
    input_tokens=greatest(0,p_input),output_tokens=greatest(0,p_output) where owner_email=p_owner and conversation_id=p_conversation and request_id=p_request and role='assistant' and status='pending';
  if not found then return false; end if;
  update ai_learning_conversations set active_request=null,lease_until=null,updated_at=now() where id=p_conversation and owner_email=p_owner;
  if p_success then update ai_learning_progress set studied_turns=studied_turns+1,last_studied_at=now() where owner_email=p_owner and topic=current_topic; end if;
  return true;
end;
$$;
revoke all on function public.begin_ai_learning_turn(text,uuid,uuid,text,text,text,boolean),public.finish_ai_learning_turn(text,uuid,uuid,text,jsonb,boolean,integer,integer) from public,anon,authenticated;
grant execute on function public.begin_ai_learning_turn(text,uuid,uuid,text,text,text,boolean),public.finish_ai_learning_turn(text,uuid,uuid,text,jsonb,boolean,integer,integer) to service_role;
