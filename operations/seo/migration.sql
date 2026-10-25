-- STANDALONE replacement: never run the original 202610180001 migration first.
-- Fresh SEO schema only; repeat application fails atomically without changing data.
-- Additive SEO storage. Existing products, categories and customers are never deleted.
begin;
-- Fail safely instead of waiting indefinitely behind catalogue writes.
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create table public.seo_documents (
  kind text not null check (kind in ('product','category')),
  entity_id text not null,
  slug text not null,
  active boolean not null default false,
  source jsonb not null,
  fallback jsonb not null,
  draft jsonb,
  published jsonb,
  draft_source jsonb,
  published_source jsonb,
  provider text,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  primary key(kind,entity_id)
);
create index seo_documents_slug on public.seo_documents(kind,slug) where active;
create table public.seo_events (
  id bigint generated always as identity primary key,
  kind text not null,
  entity_id text not null,
  action text not null,
  actor text not null,
  content jsonb,
  detail text,
  created_at timestamptz not null default now()
);
create index seo_events_document on public.seo_events(kind,entity_id,id desc);
alter table public.seo_documents enable row level security;
alter table public.seo_events enable row level security;
-- Supabase may grant service_role ALL through default privileges. Remove those
-- defaults explicitly before allowing read-only access and the mutation RPC.
revoke all on public.seo_documents, public.seo_events from public, anon, authenticated, service_role;
-- Sequence defaults are independent of table grants. Prevent direct setval/
-- nextval calls from disrupting the append-only audit identity sequence.
revoke all on sequence public.seo_events_id_seq from public, anon, authenticated, service_role;
grant select on public.seo_documents, public.seo_events to service_role;
-- Writes are only possible through the transactional functions below.

create function public.seo_fallback(p_source jsonb, p_kind text) returns jsonb
language sql immutable set search_path = public as $$
  with clean as (select
    trim(regexp_replace(regexp_replace(coalesce(p_source->>'name',''), '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')) as name,
    trim(regexp_replace(regexp_replace(coalesce(p_source->>'description',''), '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')) as description)
  select jsonb_build_object(
    'title', left(name,110) || ' | L''ecomax Maroc',
    'description', left(name || ' sur L''ecomax au Maroc. ' || coalesce(nullif(description,''),
      case when p_kind='product' then 'Consultez les photos et les informations de ce produit dans notre boutique.'
      else 'Explorez les produits de cette catégorie et consultez leurs fiches détaillées.' end),180),
    'imageAlt',left(name,180)) from clean;
$$;

create function public.sync_seo_document(p_kind text, p_row jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare facts jsonb;
begin
  facts := jsonb_build_object('name',p_row->>'name','slug',p_row->>'slug',
    'description',p_row->>'description','category',p_row->>'category','brand',p_row->>'brand',
    'images',case when p_kind='product' then coalesce(p_row->'images','[]'::jsonb)
      when coalesce(p_row->>'image','') <> '' then jsonb_build_array(p_row->>'image') else '[]'::jsonb end);
  insert into public.seo_documents(kind,entity_id,slug,active,source,fallback)
    values(p_kind,p_row->>'id',p_row->>'slug',coalesce((p_row->>'active')::boolean,false),facts,public.seo_fallback(facts,p_kind))
  on conflict(kind,entity_id) do update set slug=excluded.slug,active=excluded.active,
    source=excluded.source,fallback=excluded.fallback,version=seo_documents.version+1,updated_at=now()
  where seo_documents.source is distinct from excluded.source or seo_documents.active is distinct from excluded.active;
end $$;

create function public.save_seo_document(p_kind text,p_entity_id text,p_version integer,p_action text,
  p_content jsonb,p_actor text,p_provider text default 'manual',p_detail text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare doc public.seo_documents%rowtype; payload jsonb;
begin
  select * into doc from public.seo_documents where kind=p_kind and entity_id=p_entity_id for update;
  if not found then raise exception 'SEO_NOT_FOUND'; end if;
  if doc.version <> p_version then raise exception 'SEO_CONFLICT'; end if;
  if p_action not in ('draft','approve','reset','error') then raise exception 'SEO_ACTION_INVALID'; end if;
  if p_action='draft' then
    if p_content is null or jsonb_typeof(p_content) <> 'object' or
      coalesce(length(trim(p_content->>'title')),0) not between 1 and 140 or
      coalesce(length(trim(p_content->>'description')),0) not between 1 and 320 or
      coalesce(length(trim(p_content->>'imageAlt')),0) not between 1 and 240 or
      p_content::text ~ '[<>]' then raise exception 'SEO_CONTENT_INVALID'; end if;
    update public.seo_documents set draft=p_content,draft_source=source,provider=p_provider where kind=p_kind and entity_id=p_entity_id;
    payload:=p_content;
  elsif p_action='approve' then
    if doc.draft is null then raise exception 'SEO_DRAFT_REQUIRED'; end if;
    if doc.draft_source is distinct from doc.source then raise exception 'SEO_SOURCE_CHANGED'; end if;
    update public.seo_documents set published=draft,published_source=source,published_at=now(),draft=null,draft_source=null
      where kind=p_kind and entity_id=p_entity_id;
    payload:=doc.draft;
  elsif p_action='reset' then
    payload:=doc.published;
    update public.seo_documents set published=null,published_source=null,published_at=now()
      where kind=p_kind and entity_id=p_entity_id;
  end if;
  insert into public.seo_events(kind,entity_id,action,actor,content,detail)
    values(p_kind,p_entity_id,p_action,p_actor,payload,left(p_detail,500));
  update public.seo_documents set version=version+1,updated_at=now()
    where kind=p_kind and entity_id=p_entity_id returning * into doc;
  return to_jsonb(doc);
end $$;

revoke all on function public.seo_fallback(jsonb,text), public.sync_seo_document(text,jsonb), 
  public.save_seo_document(text,text,integer,text,jsonb,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.save_seo_document(text,text,integer,text,jsonb,text,text,text) to service_role;

-- No triggers, foreign keys or writes on commerce tables. Polling reads committed
-- catalogue state; even an unavailable queue cannot reject a commerce transaction.
create table public.seo_sync_queue (
  kind text not null check(kind in ('product','category')),
  entity_id text not null,
  payload jsonb not null,
  state text not null default 'pending' check(state in ('pending','processing','retry','failed','completed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  last_error text,
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key(kind,entity_id)
);
create index seo_sync_due on public.seo_sync_queue(state,available_at);
create table public.seo_sync_health (
  singleton boolean primary key default true check(singleton),
  reconciled_at timestamptz,
  completed_at timestamptz
);
insert into public.seo_sync_health(singleton) values(true);
alter table public.seo_sync_queue enable row level security;
alter table public.seo_sync_health enable row level security;
revoke all on public.seo_sync_queue,public.seo_sync_health from public,anon,authenticated,service_role;
grant select on public.seo_sync_queue,public.seo_sync_health to service_role;

create function public.seo_queue_payload(p_row jsonb) returns jsonb
language sql immutable set search_path=pg_catalog,public as $$
  select jsonb_build_object('id',p_row->>'id','name',p_row->>'name','slug',p_row->>'slug',
    'description',p_row->>'description','category',p_row->>'category','brand',p_row->>'brand',
    'images',p_row->'images','image',p_row->>'image','active',coalesce((p_row->>'active')::boolean,false));
$$;

create function public.reconcile_seo_queue() returns integer
language plpgsql security definer set search_path=pg_catalog,public set statement_timeout='15s' set lock_timeout='1s' as $$
declare changed integer;
begin
  -- Serialize reconcilers only; never lock catalogue rows. One snapshot covers
  -- both live entries and tombstones, avoiding a rename/delete scan race.
  perform 1 from public.seo_sync_health where singleton for update;
  with live as materialized (
    select 'product'::text kind,p.id::text entity_id,public.seo_queue_payload(to_jsonb(p)) payload from public.products p
    union all
    select 'category',c.id::text,public.seo_queue_payload(to_jsonb(c)) from public.categories c
  ), desired as (
    select * from live
    union all
    select q.kind,q.entity_id,q.payload || '{"active":false}'::jsonb from public.seo_sync_queue q
      where not exists(select 1 from live l where l.kind=q.kind and l.entity_id=q.entity_id)
  )
  insert into public.seo_sync_queue as q(kind,entity_id,payload)
    select kind,entity_id,payload from desired
  on conflict(kind,entity_id) do update set payload=excluded.payload,state='pending',attempts=0,
    available_at=now(),lease_token=null,lease_until=null,last_error=null,updated_at=now(),completed_at=null
    where q.payload is distinct from excluded.payload;
  get diagnostics changed = row_count;
  update public.seo_sync_health set reconciled_at=now() where singleton;
  return changed;
end $$;

create function public.claim_seo_job() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare job public.seo_sync_queue%rowtype;
begin
  -- A crash consumes an attempt too. Expired final leases become visible failures.
  update public.seo_sync_queue set state='failed',last_error='WORKER_LEASE_EXPIRED',lease_token=null,lease_until=null,updated_at=now()
    where state='processing' and lease_until<now() and attempts>=8;
  select * into job from public.seo_sync_queue
    where attempts<8 and ((state in ('pending','retry') and available_at<=now()) or (state='processing' and lease_until<now()))
    order by available_at,kind,entity_id for update skip locked limit 1;
  if not found then return null; end if;
  update public.seo_sync_queue set state='processing',attempts=attempts+1,lease_token=gen_random_uuid(),
    lease_until=now()+interval '60 seconds',updated_at=now()
    where kind=job.kind and entity_id=job.entity_id returning * into job;
  return jsonb_build_object('kind',job.kind,'entity_id',job.entity_id,'lease_token',job.lease_token);
end $$;

create function public.complete_seo_job(p_kind text,p_entity_id text,p_token uuid) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare job public.seo_sync_queue%rowtype;
begin
  select * into job from public.seo_sync_queue where kind=p_kind and entity_id=p_entity_id for update;
  if not found or job.state<>'processing' or job.lease_token is distinct from p_token or job.lease_until<now() then return false; end if;
  -- Storage and acknowledgement commit together. Failed generation rolls both back.
  perform public.sync_seo_document(job.kind,job.payload);
  update public.seo_sync_queue set state='completed',lease_token=null,lease_until=null,last_error=null,
    completed_at=now(),updated_at=now() where kind=p_kind and entity_id=p_entity_id;
  return true;
end $$;

create function public.fail_seo_job(p_kind text,p_entity_id text,p_token uuid) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
begin
  update public.seo_sync_queue set state=case when attempts>=8 then 'failed' else 'retry' end,
    available_at=now()+make_interval(secs=>least(3600,15*power(2,attempts-1)::integer)),
    last_error='SEO_PROCESSING_FAILED',lease_token=null,lease_until=null,updated_at=now()
    where kind=p_kind and entity_id=p_entity_id and state='processing' and lease_token=p_token;
  return found;
end $$;

create function public.retry_failed_seo_jobs() returns integer
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare changed integer;
begin
  update public.seo_sync_queue set state='pending',attempts=0,available_at=now(),updated_at=now()
    where state='failed';
  get diagnostics changed=row_count;
  return changed;
end $$;

create function public.seo_sync_status(p_kind text default null) returns jsonb
language sql security definer set search_path=pg_catalog,public as $$
  select jsonb_build_object('reconciledAt',h.reconciled_at,'completedAt',(select max(completed_at) from public.seo_sync_queue where p_kind is null or kind=p_kind),
    'pending',(select count(*) from public.seo_sync_queue where (p_kind is null or kind=p_kind) and state in ('pending','processing','retry')),
    'failed',(select count(*) from public.seo_sync_queue where (p_kind is null or kind=p_kind) and state='failed'),
    'oldestPendingAt',(select min(updated_at) from public.seo_sync_queue where (p_kind is null or kind=p_kind) and state in ('pending','retry')),
    'errors',coalesce((select jsonb_agg(e) from (select kind,entity_id,state,attempts,last_error,available_at from public.seo_sync_queue
      where (p_kind is null or kind=p_kind) and last_error is not null order by updated_at desc limit 20) e),'[]'::jsonb))
  from public.seo_sync_health h where singleton;
$$;
revoke all on function public.seo_queue_payload(jsonb),public.reconcile_seo_queue(),public.claim_seo_job(),
  public.complete_seo_job(text,text,uuid),public.fail_seo_job(text,text,uuid),public.retry_failed_seo_jobs(),public.seo_sync_status(text)
  from public,anon,authenticated,service_role;
grant execute on function public.reconcile_seo_queue(),public.claim_seo_job(),public.complete_seo_job(text,text,uuid),
  public.fail_seo_job(text,text,uuid),public.retry_failed_seo_jobs(),public.seo_sync_status(text) to service_role;
commit;

