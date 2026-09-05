-- Safe to run on installations where the original support migration is missing.
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
create index if not exists support_conversations_user_last_idx on public.support_conversations(user_id,last_message_at desc);
create index if not exists support_conversations_admin_inbox_idx on public.support_conversations(status,admin_unread desc,last_message_at desc);
create index if not exists support_messages_conversation_created_idx on public.support_messages(conversation_id,created_at,id);
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.support_conversations, public.support_messages from anon, authenticated;
grant all on public.support_conversations, public.support_messages to service_role;

-- Each send locks its conversation. Message, preview, status and unread count
-- commit together; a retried client UUID returns the original saved message.
create or replace function public.support_send_message(
  p_conversation_id uuid, p_sender text, p_user_id uuid, p_body text, p_client_id uuid
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare c public.support_conversations; m public.support_messages;
begin
  if p_sender not in ('customer','support') or p_sender is null or p_client_id is null then
    raise exception 'Invalid sender or message id' using errcode = '22023';
  end if;
  select * into c from public.support_conversations where id=p_conversation_id for update;
  if not found or (p_sender='customer' and (p_user_id is null or c.user_id<>p_user_id)) then
    raise exception 'Conversation not found' using errcode = 'P0002';
  end if;
  select * into m from public.support_messages where conversation_id=c.id and client_message_id=p_client_id;
  if found then
    if m.sender_type<>p_sender or m.body<>p_body then
      raise exception 'Message id already used' using errcode = '22023';
    end if;
    return jsonb_build_object('message',to_jsonb(m));
  end if;
  insert into public.support_messages(conversation_id,sender_type,sender_user_id,body,client_message_id)
    values(c.id,p_sender,p_user_id,p_body,p_client_id) returning * into m;
  update public.support_conversations set
    status=case when p_sender='customer' then 'open' else 'waiting' end,
    last_message=m.body,last_message_at=m.created_at,updated_at=m.created_at,
    admin_unread=admin_unread+case when p_sender='customer' then 1 else 0 end,
    customer_unread=customer_unread+case when p_sender='support' then 1 else 0 end
    where id=c.id;
  return jsonb_build_object('message',to_jsonb(m));
end $$;

create or replace function public.support_start_conversation(
  p_user_id uuid, p_name text, p_email text, p_subject text,
  p_order_number text, p_body text, p_client_id uuid
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare c public.support_conversations; m public.support_messages; result jsonb;
begin
  if p_user_id is null or p_client_id is null then raise exception 'Invalid identity' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || p_client_id::text,0));
  select msg.* into m from public.support_messages msg
    join public.support_conversations conv on conv.id=msg.conversation_id
    where conv.user_id=p_user_id and msg.client_message_id=p_client_id and msg.sender_type='customer';
  if found then
    select * into c from public.support_conversations where id=m.conversation_id;
    return jsonb_build_object('conversation',to_jsonb(c),'message',to_jsonb(m));
  end if;
  insert into public.support_conversations(user_id,customer_name,customer_email,subject,order_number)
    values(p_user_id,p_name,p_email,p_subject,p_order_number) returning * into c;
  result:=public.support_send_message(c.id,'customer',p_user_id,p_body,p_client_id);
  select * into c from public.support_conversations where id=c.id;
  return result || jsonb_build_object('conversation',to_jsonb(c));
end $$;

-- Reading and sending share the same lock, so new messages cannot be marked
-- read between fetching the history and updating unread counts.
create or replace function public.support_read_conversation(
  p_conversation_id uuid, p_reader text, p_user_id uuid
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare c public.support_conversations; history jsonb;
begin
  if p_reader not in ('customer','support') or p_reader is null then raise exception 'Invalid reader' using errcode='22023'; end if;
  select * into c from public.support_conversations where id=p_conversation_id for update;
  if not found or (p_reader='customer' and (p_user_id is null or c.user_id<>p_user_id)) then
    raise exception 'Conversation not found' using errcode='P0002';
  end if;
  update public.support_messages set read_at=now()
    where conversation_id=c.id and sender_type<>p_reader and read_at is null;
  update public.support_conversations set
    customer_unread=case when p_reader='customer' then 0 else customer_unread end,
    admin_unread=case when p_reader='support' then 0 else admin_unread end
    where id=c.id returning * into c;
  select coalesce(jsonb_agg(to_jsonb(msg) order by msg.created_at,msg.id),'[]'::jsonb) into history
    from public.support_messages msg where conversation_id=c.id;
  return jsonb_build_object('conversation',to_jsonb(c),'messages',history);
end $$;

revoke all on function public.support_send_message(uuid,text,uuid,text,uuid) from public, anon, authenticated;
revoke all on function public.support_start_conversation(uuid,text,text,text,text,text,uuid) from public, anon, authenticated;
revoke all on function public.support_read_conversation(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.support_send_message(uuid,text,uuid,text,uuid) to service_role;
grant execute on function public.support_start_conversation(uuid,text,text,text,text,text,uuid) to service_role;
grant execute on function public.support_read_conversation(uuid,text,uuid) to service_role;
notify pgrst, 'reload schema';
