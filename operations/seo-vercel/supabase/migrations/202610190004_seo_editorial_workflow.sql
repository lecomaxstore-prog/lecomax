-- LOCAL PREPARATION ONLY. Apply after the five reviewed decoupled migrations.
-- No activation, commerce writes, hosted execution or provider requests.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
alter table public.seo_documents add column editorial_published jsonb;
alter table public.seo_documents add column editorial_source jsonb;
create table public.seo_editorial_revisions (
  kind text not null check(kind='product'), entity_id text not null, revision integer not null check(revision>0),
  content jsonb not null, source jsonb not null, actor text not null, job_id uuid references public.seo_ai_jobs(id),
  created_at timestamptz not null default clock_timestamp(),
  primary key(kind,entity_id,revision), foreign key(kind,entity_id) references public.seo_documents(kind,entity_id)
);
create table public.seo_editorial_events (
  id bigint generated always as identity primary key, kind text not null, entity_id text not null,
  revision integer not null, action text not null check(action in ('save','approved','changes_requested','publish','rollback')),
  actor text not null, notes text not null, checklist jsonb not null default '{}',
  before_snapshot jsonb, after_snapshot jsonb, related_event bigint references public.seo_editorial_events(id),
  created_at timestamptz not null default clock_timestamp(),
  foreign key(kind,entity_id,revision) references public.seo_editorial_revisions(kind,entity_id,revision)
);
create index seo_editorial_events_document on public.seo_editorial_events(kind,entity_id,id desc);
alter table public.seo_editorial_revisions enable row level security;
alter table public.seo_editorial_events enable row level security;
revoke all on public.seo_editorial_revisions,public.seo_editorial_events from public,anon,authenticated,service_role;
revoke all on sequence public.seo_editorial_events_id_seq from public,anon,authenticated,service_role;

-- Drafts may be incomplete, but must be bounded, plain text and structurally valid.
create function public.seo_editorial_draft_valid(p jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog,public as $$
declare lang text; field text; item jsonb; entry jsonb;
begin
  if jsonb_typeof(p) is distinct from 'object' then return false; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(p) k) is distinct from array['ar','evidence','fr'] then return false; end if;
  foreach lang in array array['fr','ar'] loop
    item:=p->lang;
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if (select array_agg(k order by k) from jsonb_object_keys(item) k) is distinct from array['description','keywords','productDescription','title'] then return false; end if;
    foreach field in array array['title','description','productDescription'] loop
      if jsonb_typeof(item->field) is distinct from 'string' or length(item->>field)>2000 or (item->>field) ~ '[<>[:cntrl:]]' then return false; end if;
    end loop;
    if jsonb_typeof(item->'keywords') is distinct from 'array' then return false; end if;
    if jsonb_array_length(item->'keywords')>6 then return false; end if;
    for entry in select value from jsonb_array_elements(item->'keywords') loop
      if jsonb_typeof(entry) is distinct from 'string' or length(entry #>> '{}')>100 or (entry #>> '{}') ~ '[<>[:cntrl:]]' then return false; end if;
    end loop;
  end loop;
  if jsonb_typeof(p->'evidence') is distinct from 'array' then return false; end if;
  if jsonb_array_length(p->'evidence')>8 then return false; end if;
  for entry in select value from jsonb_array_elements(p->'evidence') loop
    if jsonb_typeof(entry) is distinct from 'object' then return false; end if;
    if (select array_agg(k order by k) from jsonb_object_keys(entry) k) is distinct from array['claim','locale','sourceQuote'] then return false; end if;
    if entry->>'locale' is null or entry->>'locale' not in ('fr','ar') then return false; end if;
    foreach field in array array['claim','sourceQuote'] loop
      if jsonb_typeof(entry->field) is distinct from 'string' or length(entry->>field)>500 or (entry->>field) ~ '[<>[:cntrl:]]' then return false; end if;
    end loop;
  end loop;
  return true;
end $$;

create function public.seo_editorial_snapshot(d public.seo_documents) returns jsonb
language sql immutable set search_path=pg_catalog,public as $$
  select jsonb_build_object('published',d.published,'published_source',d.published_source,
    'editorial_published',d.editorial_published,'editorial_source',d.editorial_source,'provider',d.provider);
$$;

create function public.seo_editorial_read(p_id text,p_before integer default null,p_event_before bigint default null) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
  select jsonb_build_object('version',d.version,'source',public.seo_ai_source('product',p_id),
    'revision',coalesce((select max(revision) from public.seo_editorial_revisions where kind='product' and entity_id=p_id),0),
    'head',(select to_jsonb(r) from public.seo_editorial_revisions r where kind='product' and entity_id=p_id order by revision desc limit 1),
    'published',d.editorial_published,
    'revisions',coalesce((select jsonb_agg(r order by revision desc) from (select * from public.seo_editorial_revisions where kind='product' and entity_id=p_id and (p_before is null or revision<p_before) order by revision desc limit 20) r),'[]'),
    'events',coalesce((select jsonb_agg(to_jsonb(e)||jsonb_build_object('id',e.id::text,'related_event',e.related_event::text) order by id desc) from (select * from public.seo_editorial_events where kind='product' and entity_id=p_id and (p_event_before is null or id<p_event_before) order by id desc limit 30) e),'[]'))
  from public.seo_documents d where kind='product' and entity_id=p_id;
$$;

-- One document lock serializes edits/reviews/publication/rollback with legacy
-- metadata mutations and worker synchronization. Expected versions fence retries.
create function public.seo_editorial_mutate(p_id text,p_version integer,p_revision integer,p_source jsonb,p_action text,
  p_content jsonb,p_job uuid,p_event bigint,p_checklist jsonb,p_notes text,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' set statement_timeout='5s' as $$
declare d public.seo_documents%rowtype; r public.seo_editorial_revisions%rowtype; e public.seo_editorial_events%rowtype;
  src jsonb; head integer; before_value jsonb; after_value jsonb; target jsonb; review_action text;
begin
  if p_actor is null or length(trim(p_actor)) not between 1 and 320 or p_notes is null or length(trim(p_notes)) not between 10 and 2000
    or p_action is null or p_action not in ('save','approved','changes_requested','publish','rollback') then raise exception 'SEO_EDITORIAL_INPUT'; end if;
  -- Prevent the catalogue source changing between validation and commit.
  perform 1 from public.products where id::text=p_id for share;
  src:=public.seo_ai_source('product',p_id);
  if src is null or src->>'active' is distinct from 'true' or src is distinct from p_source then raise exception 'SEO_EDITORIAL_SOURCE_CHANGED'; end if;
  select * into d from public.seo_documents where kind='product' and entity_id=p_id for update;
  if not found then raise exception 'SEO_EDITORIAL_NOT_FOUND'; end if;
  if d.version is distinct from p_version then raise exception 'SEO_EDITORIAL_CONFLICT'; end if;
  if not d.active or d.source is distinct from jsonb_build_object('name',src->>'name','slug',src->>'slug','description',src->>'description',
    'category',src->>'category','brand',src->>'brand','images',coalesce(src->'images','[]'::jsonb)) then raise exception 'SEO_EDITORIAL_SYNC_REQUIRED'; end if;
  select coalesce(max(revision),0) into head from public.seo_editorial_revisions where kind='product' and entity_id=p_id;
  if head is distinct from p_revision then raise exception 'SEO_EDITORIAL_CONFLICT'; end if;
  select * into r from public.seo_editorial_revisions where kind='product' and entity_id=p_id and revision=head;
  before_value:=public.seo_editorial_snapshot(d);
  if p_action='save' then
    if public.seo_editorial_draft_valid(p_content) is distinct from true then raise exception 'SEO_EDITORIAL_CONTENT'; end if;
    if p_job is not null and not exists(select 1 from public.seo_ai_jobs where id=p_job and kind='product' and entity_id=p_id and state='completed' and payload=src
      and result ? 'editorialVersion' and result-'editorialVersion'-'reviewRequired'=p_content) then raise exception 'SEO_EDITORIAL_JOB_CHANGED'; end if;
    head:=head+1;
    insert into public.seo_editorial_revisions(kind,entity_id,revision,content,source,actor,job_id) values('product',p_id,head,p_content,src,p_actor,p_job);
  else
    if r.revision is null then raise exception 'SEO_EDITORIAL_DRAFT_REQUIRED'; end if;
    if p_action<>'rollback' and r.source is distinct from src then raise exception 'SEO_EDITORIAL_SOURCE_CHANGED'; end if;
    if p_action in ('approved','publish') and public.seo_ai_bundle_valid(r.content||'{"editorialVersion":3,"reviewRequired":true}'::jsonb) is distinct from true then raise exception 'SEO_EDITORIAL_CONTENT'; end if;
    if p_action='approved' and p_checklist is distinct from '{"facts":true,"french":true,"arabic":true,"duplicates":true}'::jsonb then raise exception 'SEO_EDITORIAL_CHECKLIST'; end if;
    if p_action='publish' then
      select action into review_action from public.seo_editorial_events where kind='product' and entity_id=p_id and revision=head and action in ('approved','changes_requested') order by id desc limit 1;
      if review_action is distinct from 'approved' then raise exception 'SEO_EDITORIAL_REVIEW_REQUIRED'; end if;
      update public.seo_documents set published=jsonb_build_object('title',r.content->'fr'->>'title','description',r.content->'fr'->>'description','imageAlt',left(source->>'name',180)),
        published_source=source,editorial_published=r.content,editorial_source=src,provider='editorial',published_at=clock_timestamp()
        where kind='product' and entity_id=p_id;
    elsif p_action='rollback' then
      select * into e from public.seo_editorial_events where kind='product' and entity_id=p_id and action in ('publish','rollback') order by id desc limit 1;
      if e.id is null or e.id is distinct from p_event or e.after_snapshot is distinct from before_value then raise exception 'SEO_EDITORIAL_ROLLBACK_CONFLICT'; end if;
      target:=e.before_snapshot;
      if nullif(target->'published','null'::jsonb) is not null and target->'published_source' is distinct from d.source then raise exception 'SEO_EDITORIAL_SOURCE_CHANGED'; end if;
      if nullif(target->'editorial_published','null'::jsonb) is not null and target->'editorial_source' is distinct from src then raise exception 'SEO_EDITORIAL_SOURCE_CHANGED'; end if;
      update public.seo_documents set published=nullif(target->'published','null'::jsonb),published_source=nullif(target->'published_source','null'::jsonb),
        editorial_published=nullif(target->'editorial_published','null'::jsonb),editorial_source=nullif(target->'editorial_source','null'::jsonb),
        provider=target->>'provider',published_at=clock_timestamp() where kind='product' and entity_id=p_id;
    end if;
  end if;
  update public.seo_documents set version=version+1,updated_at=clock_timestamp() where kind='product' and entity_id=p_id returning * into d;
  after_value:=public.seo_editorial_snapshot(d);
  insert into public.seo_editorial_events(kind,entity_id,revision,action,actor,notes,checklist,before_snapshot,after_snapshot,related_event)
    values('product',p_id,head,p_action,p_actor,p_notes,coalesce(p_checklist,'{}'),before_value,after_value,case when p_action='rollback' then p_event else null end);
  insert into public.seo_events(kind,entity_id,action,actor,content,detail) values('product',p_id,'editorial_'||p_action,p_actor,
    case when p_action in ('publish','rollback') then after_value else jsonb_build_object('revision',head) end,left(p_notes,500));
  return public.seo_editorial_read(p_id);
end $$;

-- Once editorial revisions exist, legacy approval/reset must not bypass the
-- reviewed owner publication workflow (including old AI suggestions). Legacy
-- metadata workflows continue unchanged for entities without editorial revisions.
alter function public.save_seo_document(text,text,integer,text,jsonb,text,text,text) rename to save_seo_document_pre_editorial;
revoke all on function public.save_seo_document_pre_editorial(text,text,integer,text,jsonb,text,text,text) from public,anon,authenticated,service_role;
create function public.save_seo_document(p_kind text,p_entity_id text,p_version integer,p_action text,p_content jsonb,p_actor text,p_provider text default 'manual',p_detail text default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare result jsonb;
begin
  perform 1 from public.seo_documents where kind=p_kind and entity_id=p_entity_id for update;
  if p_action in ('approve','reset') and exists(select 1 from public.seo_editorial_revisions where kind=p_kind and entity_id=p_entity_id) then
    raise exception 'SEO_EDITORIAL_WORKFLOW_REQUIRED';
  end if;
  result:=public.save_seo_document_pre_editorial(p_kind,p_entity_id,p_version,p_action,p_content,p_actor,p_provider,p_detail);
  if p_action in ('approve','reset') then
    update public.seo_documents set editorial_published=null,editorial_source=null where kind=p_kind and entity_id=p_entity_id;
    result:=result||'{"editorial_published":null,"editorial_source":null}'::jsonb;
  end if;
  return result;
end $$;
revoke all on function public.seo_editorial_draft_valid(jsonb),public.seo_editorial_snapshot(public.seo_documents),public.seo_editorial_read(text,integer,bigint),
  public.seo_editorial_mutate(text,integer,integer,jsonb,text,jsonb,uuid,bigint,jsonb,text,text),public.save_seo_document(text,text,integer,text,jsonb,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.seo_editorial_read(text,integer,bigint),public.seo_editorial_mutate(text,integer,integer,jsonb,text,jsonb,uuid,bigint,jsonb,text,text),
  public.save_seo_document(text,text,integer,text,jsonb,text,text,text) to service_role;
commit;
