-- PREPARED ONLY. Requires decoupled 002, run control, then AI budget 001.
-- Retains all legacy jobs, results and approvals. No commerce writes or triggers.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
alter table public.seo_ai_jobs drop constraint seo_ai_jobs_tier_check;
alter table public.seo_ai_jobs add constraint seo_ai_jobs_tier_check check(tier in ('routine','advanced','editorial-luna','editorial-sol','premium'));
alter table public.seo_ai_jobs add column paid_authorized boolean not null default false;
alter table public.seo_ai_jobs add column authorized_usd numeric(12,6) not null default 0;
alter table public.seo_ai_jobs alter column estimated_usd type numeric(16,12);
create table public.seo_ai_request_authorizations (
  id uuid primary key default gen_random_uuid(),job_id uuid not null references public.seo_ai_jobs(id),
  actor text not null,ceiling numeric not null,created_at timestamptz not null default now()
);
alter table public.seo_ai_request_authorizations enable row level security;
revoke all on public.seo_ai_request_authorizations from public,anon,authenticated,service_role;
-- Lowering caps never removes old reservations. Existing activation is disabled.
update public.seo_ai_settings set enabled=false,monthly_limit=least(monthly_limit,5),mirai_enabled=false;
alter table public.seo_ai_settings drop constraint seo_ai_settings_monthly_limit_check;
alter table public.seo_ai_settings add constraint seo_ai_settings_monthly_limit_check check(monthly_limit between 0 and 5);
alter table public.seo_ai_settings add column lifetime_limit numeric(12,6) not null default 50 check(lifetime_limit between 0 and 50);
-- Known isolated canary charged conservatively. Shared-project spending must be
-- reconciled separately before activation; this is not a provider account cap.
alter table public.seo_ai_settings add column external_spend numeric(12,6) not null default 0.000246 check(external_spend>=0);
alter table public.seo_ai_settings add column external_spend_month date not null default '2026-10-01';

create or replace function public.seo_ai_set_budget(p_enabled boolean,p_limit numeric,p_mirai boolean,p_actor text) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
begin
  if p_limit is null or p_limit<0 or p_limit>5 or p_enabled is null or p_mirai is distinct from false then raise exception 'SEO_AI_BUDGET'; end if;
  update public.seo_ai_settings set enabled=p_enabled,monthly_limit=p_limit,mirai_enabled=false where singleton;
  insert into public.seo_ai_budget_events(actor,enabled,monthly_limit,mirai_enabled) values(p_actor,p_enabled,p_limit,false);
  return true;
end $$;

alter function public.seo_ai_enqueue(text,text,text,text,text) rename to seo_ai_enqueue_legacy;
revoke all on function public.seo_ai_enqueue_legacy(text,text,text,text,text) from public,anon,authenticated,service_role;
create function public.seo_ai_enqueue(p_kind text,p_id text,p_tier text,p_reason text,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare src jsonb; job public.seo_ai_jobs%rowtype; fingerprint text;
begin
  if p_tier in ('routine','advanced') then return public.seo_ai_enqueue_legacy(p_kind,p_id,p_tier,p_reason,p_actor); end if;
  if p_kind is distinct from 'product' or p_tier not in ('editorial-luna','editorial-sol','premium') or p_tier is null or p_actor is null or length(p_actor)>320 or p_reason is null or length(trim(p_reason))<20 or length(p_reason)>500 then raise exception 'SEO_AI_INPUT'; end if;
  src:=public.seo_ai_source(p_kind,p_id);
  if src is null or coalesce((src->>'active')::boolean,false)=false or coalesce(length(trim(src->>'name')),0)=0 then raise exception 'SEO_AI_SOURCE'; end if;
  fingerprint:=md5('editorial-v2:'||src::text);
  insert into public.seo_ai_jobs(kind,entity_id,source_key,payload,tier,reason,actor) values(p_kind,p_id,fingerprint,src,p_tier,p_reason,p_actor) on conflict do nothing;
  select * into job from public.seo_ai_jobs where kind=p_kind and entity_id=p_id and source_key=fingerprint and tier=p_tier;
  return jsonb_build_object('id',job.id,'state',job.state,'result',job.result,'reused',job.state='completed');
end $$;

create function public.seo_ai_authorize(p_job uuid,p_ceiling numeric,p_actor text) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare job public.seo_ai_jobs%rowtype; required_cap numeric;
begin
  select * into job from public.seo_ai_jobs where id=p_job for update;
  if job.id is null or job.state<>'pending' or job.paid_authorized or p_actor is null then return false; end if;
  required_cap:=case job.tier when 'premium' then 0.20 when 'editorial-sol' then 0.05 when 'advanced' then 0.10 else 0.01 end;
  if p_ceiling is distinct from required_cap then raise exception 'SEO_AI_APPROVAL_CEILING'; end if;
  update public.seo_ai_jobs set paid_authorized=true,authorized_usd=p_ceiling where id=p_job;
  insert into public.seo_ai_request_authorizations(job_id,actor,ceiling) values(p_job,p_actor,p_ceiling);
  return true;
end $$;

create function public.seo_ai_claim_v2(p_run uuid,p_fallback numeric,p_editorial boolean) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare control public.seo_worker_control%rowtype; settings public.seo_ai_settings%rowtype; job public.seo_ai_jobs%rowtype;
  month_start date; committed numeric; lifetime numeric; cap numeric; corpus jsonb;
begin
  select * into control from public.seo_worker_control where singleton for update;
  if control.token is distinct from p_run or control.state<>'running' or control.lease_until<=clock_timestamp() then raise exception 'SEO_RUN_EXPIRED'; end if;
  select * into settings from public.seo_ai_settings where singleton for update;
  if not settings.enabled then return null; end if;
  if p_fallback is distinct from 0::numeric then raise exception 'SEO_AI_FALLBACK_DISABLED'; end if;
  select * into job from public.seo_ai_jobs where state='pending' and paid_authorized and (tier in ('routine','advanced') or p_editorial is true) order by created_at for update skip locked limit 1;
  if not found then return null; end if;
  if public.seo_ai_source(job.kind,job.entity_id) is distinct from job.payload then
    update public.seo_ai_jobs set state='superseded',finished_at=now() where id=job.id; return null;
  end if;
  month_start:=date_trunc('month',clock_timestamp() at time zone 'UTC')::date;
  cap:=case job.tier when 'premium' then 0.20 when 'editorial-sol' then 0.05 when 'advanced' then 0.10 else 0.01 end;
  if cap>job.authorized_usd then return null; end if;
  select coalesce(sum(case when state='processing' then primary_reserve+fallback_reserve else estimated_usd end),0) into committed from public.seo_ai_jobs where billing_month=month_start;
  select coalesce(sum(case when state='processing' then primary_reserve+fallback_reserve else estimated_usd end),0) into lifetime from public.seo_ai_jobs;
  if committed+cap+(case when settings.external_spend_month=month_start then settings.external_spend else 0 end)>least(settings.monthly_limit,5)
    or lifetime+cap+settings.external_spend>least(settings.lifetime_limit,50) then return null; end if;
  update public.seo_ai_jobs set state='processing',run_token=p_run,started_at=clock_timestamp(),billing_month=month_start,primary_reserve=cap,fallback_reserve=0 where id=job.id returning * into job;
  select coalesce(jsonb_agg(result),'[]'::jsonb) into corpus from public.seo_ai_jobs where state='completed' and result is not null and (kind,entity_id) is distinct from (job.kind,job.entity_id);
  return jsonb_build_object('id',job.id,'payload',job.payload,'tier',job.tier,'primary_reserve',cap,'fallback_reserve',0,'allow_fallback',false,
    'paid_authorized',true,'authorized_usd',job.authorized_usd,'duplicate_corpus',corpus);
end $$;

create or replace function public.seo_ai_claim(p_run uuid,p_fallback numeric default 0) returns jsonb
language sql security definer set search_path=pg_catalog,public as $$ select public.seo_ai_claim_v2(p_run,p_fallback,false); $$;
create function public.seo_ai_claim_editorial(p_run uuid,p_fallback numeric default 0) returns jsonb
language sql security definer set search_path=pg_catalog,public as $$ select public.seo_ai_claim_v2(p_run,p_fallback,true); $$;
revoke all on function public.seo_ai_claim_v2(uuid,numeric,boolean),public.seo_ai_claim_editorial(uuid,numeric) from public,anon,authenticated,service_role;
grant execute on function public.seo_ai_claim_editorial(uuid,numeric) to service_role;

alter function public.seo_ai_bundle_valid(jsonb) rename to seo_ai_bundle_valid_legacy;
revoke all on function public.seo_ai_bundle_valid_legacy(jsonb) from public,anon,authenticated,service_role;
create function public.seo_ai_bundle_valid(p_result jsonb) returns boolean
language plpgsql immutable set search_path=pg_catalog,public as $$
declare lang text; item jsonb; word jsonb;
begin
  if not(p_result ? 'editorialVersion') then return public.seo_ai_bundle_valid_legacy(p_result); end if;
  if p_result->>'editorialVersion' is distinct from '2' or p_result->>'reviewRequired' is distinct from 'true' or jsonb_typeof(p_result->'evidence') is distinct from 'array' then return false; end if;
  if (select count(*) from jsonb_object_keys(p_result))<>5 or jsonb_array_length(p_result->'evidence') not between 1 and 8 then return false; end if;
  foreach lang in array array['fr','ar'] loop
    item:=p_result->lang;
    if jsonb_typeof(item) is distinct from 'object' or (select count(*) from jsonb_object_keys(item))<>4 then return false; end if;
    if jsonb_typeof(item->'title') is distinct from 'string' or length(item->>'title') not between 20 and 65 or
      jsonb_typeof(item->'description') is distinct from 'string' or length(item->>'description') not between 110 and 160 or
      jsonb_typeof(item->'productDescription') is distinct from 'string' or length(item->>'productDescription') not between 180 and 900 then return false; end if;
    if ((item->>'title')||(item->>'description')||(item->>'productDescription')) ~ '[<>[:cntrl:]]' or jsonb_typeof(item->'keywords') is distinct from 'array' then return false; end if;
    if jsonb_array_length(item->'keywords') not between 3 and 6 then return false; end if;
    for word in select value from jsonb_array_elements(item->'keywords') loop
      if jsonb_typeof(word)<>'string' or length(word #>> '{}') not between 2 and 60 or (word #>> '{}') ~ '[<>[:cntrl:]]' then return false; end if;
    end loop;
  end loop;
  return true;
end $$;

alter function public.seo_ai_finish(uuid,uuid,jsonb,text,jsonb) rename to seo_ai_finish_legacy;
revoke all on function public.seo_ai_finish_legacy(uuid,uuid,jsonb,text,jsonb) from public,anon,authenticated,service_role;
create function public.seo_ai_finish(p_run uuid,p_job uuid,p_result jsonb,p_provider text,p_usage jsonb) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare job public.seo_ai_jobs%rowtype; lang text; field text;
begin
  -- Serialize duplicate checks with all completions, not just each job.
  perform 1 from public.seo_worker_control where singleton for update;
  select * into job from public.seo_ai_jobs where id=p_job;
  if p_result ? 'editorialVersion' then
    if job.tier not in ('editorial-luna','editorial-sol','premium') then raise exception 'SEO_AI_RESULT'; end if;
    foreach lang in array array['fr','ar'] loop
      foreach field in array array['title','description','productDescription'] loop
        if exists(select 1 from public.seo_ai_jobs j where j.state='completed' and (j.kind,j.entity_id) is distinct from (job.kind,job.entity_id)
          and lower(regexp_replace(j.result->lang->>field,'[^[:alnum:]]','','g'))=lower(regexp_replace(p_result->lang->>field,'[^[:alnum:]]','','g'))) then raise exception 'SEO_DUPLICATE_CONTENT'; end if;
      end loop;
    end loop;
  end if;
  return public.seo_ai_finish_legacy(p_run,p_job,p_result,p_provider,p_usage);
end $$;

alter function public.seo_ai_approve(uuid,integer,text) rename to seo_ai_approve_legacy;
revoke all on function public.seo_ai_approve_legacy(uuid,integer,text) from public,anon,authenticated,service_role;
create function public.seo_ai_approve(p_job uuid,p_version integer,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
begin
  if exists(select 1 from public.seo_ai_jobs where id=p_job and result ? 'editorialVersion') then raise exception 'SEO_EDITORIAL_HUMAN_REVIEW_REQUIRED'; end if;
  return public.seo_ai_approve_legacy(p_job,p_version,p_actor);
end $$;
-- Editorial publication deliberately unavailable until comparison and factual
-- review policy are approved. Existing legacy metadata approval remains intact.

alter function public.seo_ai_dashboard(text,text) rename to seo_ai_dashboard_legacy;
revoke all on function public.seo_ai_dashboard_legacy(text,text) from public,anon,authenticated,service_role;
create function public.seo_ai_dashboard(p_kind text default null,p_id text default null) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
  select public.seo_ai_dashboard_legacy(p_kind,p_id)||jsonb_build_object('lifetimeLimit',s.lifetime_limit,'externalSpend',s.external_spend,
    'lifetimeCommitted',s.external_spend+(select coalesce(sum(case when state='processing' then primary_reserve+fallback_reserve else estimated_usd end),0) from public.seo_ai_jobs),
    'jobs',coalesce((select jsonb_agg(x) from (select id,tier,state,provider,result,paid_authorized,authorized_usd,
      exists(select 1 from public.seo_ai_approvals a where a.job_id=j.id) approved from public.seo_ai_jobs j where p_kind is not null and kind=p_kind and entity_id=p_id order by created_at desc limit 20) x),'[]'::jsonb)) from public.seo_ai_settings s where singleton;
$$;
revoke all on function public.seo_ai_enqueue(text,text,text,text,text),public.seo_ai_authorize(uuid,numeric,text),public.seo_ai_bundle_valid(jsonb),public.seo_ai_finish(uuid,uuid,jsonb,text,jsonb),public.seo_ai_approve(uuid,integer,text),public.seo_ai_dashboard(text,text) from public,anon,authenticated,service_role;
grant execute on function public.seo_ai_enqueue(text,text,text,text,text),public.seo_ai_authorize(uuid,numeric,text),public.seo_ai_finish(uuid,uuid,jsonb,text,jsonb),public.seo_ai_approve(uuid,integer,text),public.seo_ai_dashboard(text,text) to service_role;
commit;
