-- LOCAL PREPARATION ONLY. Apply after standalone 002 and fenced run-control.
-- No commerce triggers, foreign keys, writes, or external network calls.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
create table public.seo_ai_settings (
  singleton boolean primary key default true check(singleton),
  enabled boolean not null default false,
  monthly_limit numeric(12,6) not null default 0 check(monthly_limit between 0 and 100),
  mirai_enabled boolean not null default false
);
insert into public.seo_ai_settings(singleton) values(true);
create table public.seo_ai_jobs (
  id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('product','category')),
  entity_id text not null, source_key text not null, payload jsonb not null,
  tier text not null check(tier in ('routine','advanced')), reason text not null, actor text not null,
  state text not null default 'pending' check(state in ('pending','processing','completed','superseded')),
  created_at timestamptz not null default now(), started_at timestamptz, finished_at timestamptz,
  run_token uuid, billing_month date, primary_reserve numeric(12,6) not null default 0,
  fallback_reserve numeric(12,6) not null default 0, estimated_usd numeric(12,6) not null default 0,
  result jsonb, provider text, usage jsonb not null default '[]'::jsonb,
  unique(kind,entity_id,source_key,tier)
);
create table public.seo_ai_approvals (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.seo_ai_jobs(id),
  actor text not null, result jsonb not null, created_at timestamptz not null default now()
);
create table public.seo_ai_budget_events (
  id uuid primary key default gen_random_uuid(), actor text not null, enabled boolean not null,
  monthly_limit numeric not null, mirai_enabled boolean not null, created_at timestamptz not null default now()
);
create index seo_ai_pending on public.seo_ai_jobs(created_at) where state='pending';
alter table public.seo_ai_settings enable row level security;
alter table public.seo_ai_jobs enable row level security;
alter table public.seo_ai_approvals enable row level security;
alter table public.seo_ai_budget_events enable row level security;
revoke all on public.seo_ai_settings,public.seo_ai_jobs,public.seo_ai_approvals,public.seo_ai_budget_events from public,anon,authenticated,service_role;

create function public.seo_ai_source(p_kind text,p_id text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
  select public.seo_queue_payload(to_jsonb(p)) from public.products p where p_kind='product' and p.id::text=p_id
  union all select public.seo_queue_payload(to_jsonb(c)) from public.categories c where p_kind='category' and c.id::text=p_id;
$$;
create function public.seo_ai_enqueue(p_kind text,p_id text,p_tier text,p_reason text,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare src jsonb; job public.seo_ai_jobs%rowtype; fingerprint text;
begin
  if p_kind not in ('product','category') or p_tier not in ('routine','advanced') or length(p_actor)>320 or
    length(p_reason)>500 or (p_tier='advanced' and length(trim(p_reason))<20) then raise exception 'SEO_AI_INPUT'; end if;
  src:=public.seo_ai_source(p_kind,p_id);
  if src is null or coalesce((src->>'active')::boolean,false)=false or coalesce(length(trim(src->>'name')),0)=0 then raise exception 'SEO_AI_SOURCE'; end if;
  fingerprint:=md5('bilingual-v1:'||src::text);
  insert into public.seo_ai_jobs(kind,entity_id,source_key,payload,tier,reason,actor)
    values(p_kind,p_id,fingerprint,src,p_tier,p_reason,p_actor) on conflict do nothing;
  select * into job from public.seo_ai_jobs where kind=p_kind and entity_id=p_id and source_key=fingerprint and tier=p_tier;
  return jsonb_build_object('id',job.id,'state',job.state,'result',job.result,'reused',job.state='completed');
end $$;
create function public.seo_ai_set_budget(p_enabled boolean,p_limit numeric,p_mirai boolean,p_actor text) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
begin
  if p_limit is null or p_limit<0 or p_limit>100 or p_enabled is null or p_mirai is null then raise exception 'SEO_AI_BUDGET'; end if;
  update public.seo_ai_settings set enabled=p_enabled,monthly_limit=p_limit,mirai_enabled=p_mirai where singleton;
  insert into public.seo_ai_budget_events(actor,enabled,monthly_limit,mirai_enabled) values(p_actor,p_enabled,p_limit,p_mirai);
  return true;
end $$;
create function public.seo_ai_claim(p_run uuid,p_fallback numeric default 0) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare control public.seo_worker_control%rowtype; settings public.seo_ai_settings%rowtype;
  job public.seo_ai_jobs%rowtype; month_start date; committed numeric; cap numeric; fallback_cap numeric;
begin
  select * into control from public.seo_worker_control where singleton for update;
  if control.token is distinct from p_run or control.state<>'running' or control.lease_until<=clock_timestamp() then raise exception 'SEO_RUN_EXPIRED'; end if;
  select * into settings from public.seo_ai_settings where singleton for update;
  if not settings.enabled then return null; end if;
  if p_fallback is null or p_fallback<0 or p_fallback>1 then raise exception 'SEO_AI_BUDGET'; end if;
  select * into job from public.seo_ai_jobs where state='pending' order by created_at for update skip locked limit 1;
  if not found then return null; end if;
  if public.seo_ai_source(job.kind,job.entity_id) is distinct from job.payload then
    update public.seo_ai_jobs set state='superseded',finished_at=now() where id=job.id; return null;
  end if;
  month_start:=date_trunc('month',clock_timestamp() at time zone 'UTC')::date;
  cap:=case when job.tier='routine' then 0.01 else 0.10 end;
  fallback_cap:=case when settings.mirai_enabled then p_fallback else 0 end;
  -- This settings-row lock serializes reservations across all worker instances.
  -- Crashed/uncertain jobs retain their reservation indefinitely in that UTC month.
  select coalesce(sum(case when state='processing' then primary_reserve+fallback_reserve else estimated_usd end),0)
    into committed from public.seo_ai_jobs where billing_month=month_start;
  if committed+cap+fallback_cap>settings.monthly_limit then return null; end if;
  update public.seo_ai_jobs set state='processing',run_token=p_run,started_at=clock_timestamp(),billing_month=month_start,
    primary_reserve=cap,fallback_reserve=fallback_cap where id=job.id returning * into job;
  return jsonb_build_object('id',job.id,'payload',job.payload,'tier',job.tier,'primary_reserve',job.primary_reserve,
    'fallback_reserve',job.fallback_reserve,'allow_fallback',job.fallback_reserve>0);
end $$;
create function public.seo_ai_bundle_valid(p_result jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog,public as $$
declare lang text; item jsonb; word jsonb;
begin
  if jsonb_typeof(p_result) is distinct from 'object' or not(p_result ?& array['fr','ar']) or (select count(*) from jsonb_object_keys(p_result))<>2 then return false; end if;
  foreach lang in array array['fr','ar'] loop
    item:=p_result->lang;
    if jsonb_typeof(item) is distinct from 'object' or not(item ?& array['title','description','keywords']) or (select count(*) from jsonb_object_keys(item))<>3 then return false; end if;
    if jsonb_typeof(item->'title') is distinct from 'string' or length(item->>'title') not between 1 and 140 or
      jsonb_typeof(item->'description') is distinct from 'string' or length(item->>'description') not between 1 and 320 or
      (item->>'title') ~ '[<>[:cntrl:]]' or (item->>'description') ~ '[<>[:cntrl:]]' then return false; end if;
    if jsonb_typeof(item->'keywords') is distinct from 'array' then return false; end if;
    if jsonb_array_length(item->'keywords') not between 1 and 3 then return false; end if;
    for word in select value from jsonb_array_elements(item->'keywords') loop
      if jsonb_typeof(word)<>'string' or length(word #>> '{}') not between 1 and 75 or (word #>> '{}') ~ '[<>[:cntrl:]]' then return false; end if;
    end loop;
  end loop;
  return true;
end $$;
create function public.seo_ai_finish(p_run uuid,p_job uuid,p_result jsonb,p_provider text,p_usage jsonb) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare control public.seo_worker_control%rowtype; job public.seo_ai_jobs%rowtype; total numeric:=0; entry jsonb;
begin
  select * into control from public.seo_worker_control where singleton for update;
  if control.token is distinct from p_run or control.state<>'running' or control.lease_until<=clock_timestamp() then raise exception 'SEO_RUN_EXPIRED'; end if;
  select * into job from public.seo_ai_jobs where id=p_job for update;
  if job.id is null or job.state<>'processing' or job.run_token is distinct from p_run then return false; end if;
  if not public.seo_ai_bundle_valid(p_result) or p_provider not in ('openai','mirai','deterministic') or jsonb_typeof(p_usage) is distinct from 'array' then raise exception 'SEO_AI_RESULT'; end if;
  if jsonb_array_length(p_usage)>2 then raise exception 'SEO_AI_USAGE'; end if;
  for entry in select value from jsonb_array_elements(p_usage) loop
    if (entry->>'usd')::numeric<0 or (entry->>'usd') is null or (entry->>'usd')::numeric>10 or
      (entry->>'input')::bigint<0 or (entry->>'output')::bigint<0 then raise exception 'SEO_AI_USAGE'; end if;
    total:=total+(entry->>'usd')::numeric;
  end loop;
  if total>job.primary_reserve+job.fallback_reserve then
    update public.seo_ai_settings set enabled=false where singleton;
  end if;
  update public.seo_ai_jobs set state='completed',finished_at=clock_timestamp(),result=p_result,provider=p_provider,
    usage=p_usage,estimated_usd=total where id=p_job;
  return true;
end $$;
create function public.seo_ai_approve(p_job uuid,p_version integer,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare job public.seo_ai_jobs%rowtype; doc jsonb; content jsonb;
begin
  select * into job from public.seo_ai_jobs where id=p_job;
  if job.state is distinct from 'completed' or job.result is null then raise exception 'SEO_AI_RESULT'; end if;
  if public.seo_ai_source(job.kind,job.entity_id) is distinct from job.payload then raise exception 'SEO_SOURCE_CHANGED'; end if;
  content:=jsonb_build_object('title',job.result->'fr'->>'title','description',job.result->'fr'->>'description','imageAlt',left(trim(regexp_replace(regexp_replace(job.payload->>'name','<[^>]*>',' ','g'),'[[:cntrl:]]',' ','g')),180));
  doc:=public.save_seo_document(job.kind,job.entity_id,p_version,'draft',content,p_actor,job.provider,'Bilingual AI approval');
  doc:=public.save_seo_document(job.kind,job.entity_id,(doc->>'version')::integer,'approve',null,p_actor,job.provider,'Bilingual AI approval');
  insert into public.seo_ai_approvals(job_id,actor,result) values(p_job,p_actor,job.result);
  return doc;
end $$;
create function public.seo_ai_dashboard(p_kind text default null,p_id text default null) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
  select jsonb_build_object('enabled',s.enabled,'monthlyLimit',s.monthly_limit,'miraiEnabled',s.mirai_enabled,
    'month',date_trunc('month',now() at time zone 'UTC')::date,
    'estimatedUsd',(select coalesce(sum(estimated_usd),0) from public.seo_ai_jobs where billing_month=date_trunc('month',now() at time zone 'UTC')::date),
    'reservedUsd',(select coalesce(sum(primary_reserve+fallback_reserve),0) from public.seo_ai_jobs where state='processing' and billing_month=date_trunc('month',now() at time zone 'UTC')::date),
    'inputTokens',(select coalesce(sum((u->>'input')::bigint),0) from public.seo_ai_jobs j cross join lateral jsonb_array_elements(j.usage) u where billing_month=date_trunc('month',now() at time zone 'UTC')::date),
    'outputTokens',(select coalesce(sum((u->>'output')::bigint),0) from public.seo_ai_jobs j cross join lateral jsonb_array_elements(j.usage) u where billing_month=date_trunc('month',now() at time zone 'UTC')::date),
    'uncertain',(select count(*) from public.seo_ai_jobs where state='processing' or usage @> '[{"uncertain":true}]'),
    'pending',(select count(*) from public.seo_ai_jobs where state='pending'),
    'jobs',coalesce((select jsonb_agg(x) from (select id,kind,entity_id,tier,state,provider,result,created_at,estimated_usd,
      exists(select 1 from public.seo_ai_approvals a where a.job_id=j.id) approved
      from public.seo_ai_jobs j where p_kind is not null and kind=p_kind and entity_id=p_id order by created_at desc limit 20) x),'[]'::jsonb))
  from public.seo_ai_settings s where singleton;
$$;
revoke all on function public.seo_ai_source(text,text),public.seo_ai_enqueue(text,text,text,text,text),
  public.seo_ai_set_budget(boolean,numeric,boolean,text),public.seo_ai_claim(uuid,numeric),public.seo_ai_bundle_valid(jsonb),
  public.seo_ai_finish(uuid,uuid,jsonb,text,jsonb),public.seo_ai_approve(uuid,integer,text),public.seo_ai_dashboard(text,text)
  from public,anon,authenticated,service_role;
grant execute on function public.seo_ai_enqueue(text,text,text,text,text),public.seo_ai_set_budget(boolean,numeric,boolean,text),
  public.seo_ai_claim(uuid,numeric),public.seo_ai_finish(uuid,uuid,jsonb,text,jsonb),public.seo_ai_approve(uuid,integer,text),public.seo_ai_dashboard(text,text) to service_role;
commit;
