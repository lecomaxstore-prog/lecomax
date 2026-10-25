-- PREPARED ONLY: not executed, including locally. Requires editorial 002.
-- Review approval is separate from publication. No commerce writes or activation.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
alter table public.seo_ai_jobs add column editorial_revision integer not null default 2 check(editorial_revision in (2,3));
create table public.seo_ai_editorial_reviews (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.seo_ai_jobs(id),
  actor text not null, decision text not null check(decision in ('approved_for_publication','changes_requested')),
  source jsonb not null, result jsonb not null, document_version integer not null,
  checklist jsonb not null, notes text not null, created_at timestamptz not null default now()
);
alter table public.seo_ai_editorial_reviews enable row level security;
revoke all on public.seo_ai_editorial_reviews from public,anon,authenticated,service_role;

create function public.seo_ai_enqueue_v3(p_kind text,p_id text,p_tier text,p_reason text,p_actor text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare src jsonb; job public.seo_ai_jobs%rowtype; fingerprint text;
begin
  if p_tier in ('routine','advanced') then return public.seo_ai_enqueue(p_kind,p_id,p_tier,p_reason,p_actor); end if;
  if p_kind is distinct from 'product' or p_tier is null or p_tier not in ('editorial-luna','editorial-sol','premium') or p_actor is null or length(p_actor)>320 or p_reason is null or length(trim(p_reason))<20 or length(p_reason)>500 then raise exception 'SEO_AI_INPUT'; end if;
  src:=public.seo_ai_source(p_kind,p_id);
  if src is null or coalesce((src->>'active')::boolean,false)=false or coalesce(length(trim(src->>'name')),0)=0 then raise exception 'SEO_AI_SOURCE'; end if;
  fingerprint:=md5('editorial-v3-sol61:'||src::text);
  insert into public.seo_ai_jobs(kind,entity_id,source_key,payload,tier,reason,actor,editorial_revision)
    values(p_kind,p_id,fingerprint,src,p_tier,p_reason,p_actor,3) on conflict do nothing;
  select * into job from public.seo_ai_jobs where kind=p_kind and entity_id=p_id and source_key=fingerprint and tier=p_tier;
  return jsonb_build_object('id',job.id,'state',job.state,'result',job.result,'reused',job.state='completed');
end $$;

create function public.seo_ai_claim_editorial_v3(p_run uuid,p_fallback numeric default 0) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare claimed jsonb; revision integer;
begin
  claimed:=public.seo_ai_claim_v2(p_run,p_fallback,true);
  if claimed is null then return null; end if;
  select editorial_revision into revision from public.seo_ai_jobs where id=(claimed->>'id')::uuid;
  return claimed||jsonb_build_object('editorial_revision',revision);
end $$;
-- Old editorial workers cannot claim new revision jobs without the v3 dispatcher.
revoke all on function public.seo_ai_claim_editorial(uuid,numeric) from public,anon,authenticated,service_role;

alter function public.seo_ai_bundle_valid(jsonb) rename to seo_ai_bundle_valid_v2;
revoke all on function public.seo_ai_bundle_valid_v2(jsonb) from public,anon,authenticated,service_role;
create function public.seo_ai_bundle_valid(p_result jsonb) returns boolean
language sql immutable set search_path=pg_catalog,public as $$
  select public.seo_ai_bundle_valid_v2(case when p_result->>'editorialVersion'='3' then jsonb_set(p_result,'{editorialVersion}','2'::jsonb) else p_result end);
$$;

create function public.seo_ai_review(p_job uuid,p_kind text,p_id text,p_version integer,p_result jsonb,p_decision text,p_checklist jsonb,p_notes text,p_actor text) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare job public.seo_ai_jobs%rowtype; doc public.seo_documents%rowtype;
begin
  select * into job from public.seo_ai_jobs where id=p_job for update;
  if job.id is null or job.kind is distinct from p_kind or job.entity_id is distinct from p_id or job.state<>'completed' or not(job.result ? 'editorialVersion') or job.result is distinct from p_result then raise exception 'SEO_REVIEW_RESULT_CHANGED'; end if;
  select * into doc from public.seo_documents where kind=p_kind and entity_id=p_id for update;
  if doc.version is distinct from p_version or public.seo_ai_source(p_kind,p_id) is distinct from job.payload then raise exception 'SEO_REVIEW_SOURCE_CHANGED'; end if;
  if p_actor is null or length(p_actor)>320 or p_decision is null or p_decision not in ('approved_for_publication','changes_requested') or p_notes is null or length(trim(p_notes))<10 or length(p_notes)>2000 then raise exception 'SEO_REVIEW_INPUT'; end if;
  if p_decision='approved_for_publication' and (p_checklist is null or p_checklist is distinct from '{"facts":true,"french":true,"arabic":true,"duplicates":true}'::jsonb) then raise exception 'SEO_REVIEW_CHECKLIST'; end if;
  insert into public.seo_ai_editorial_reviews(job_id,actor,decision,source,result,document_version,checklist,notes)
    values(p_job,p_actor,p_decision,job.payload,job.result,p_version,coalesce(p_checklist,'{}'::jsonb),p_notes);
  return true;
end $$;

create function public.seo_ai_dashboard_v3(p_kind text default null,p_id text default null) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
  select public.seo_ai_dashboard(p_kind,p_id)||jsonb_build_object('jobs',coalesce((select jsonb_agg(x) from (
    select j.id,j.tier,j.state,j.provider,j.result,j.paid_authorized,j.authorized_usd,j.editorial_revision,j.payload,
      public.seo_ai_source(j.kind,j.entity_id) is not distinct from j.payload as source_current,
      exists(select 1 from public.seo_ai_approvals a where a.job_id=j.id) approved,
      coalesce((select jsonb_agg(r order by r.created_at desc,r.id) from public.seo_ai_editorial_reviews r where r.job_id=j.id),'[]'::jsonb) reviews
    from public.seo_ai_jobs j where p_kind is not null and j.kind=p_kind and j.entity_id=p_id order by j.created_at desc limit 20
  ) x),'[]'::jsonb));
$$;
-- seo_ai_approve continues rejecting every editorialVersion, including reviewed
-- drafts. Enabling publication requires a separately reviewed future change.
revoke all on function public.seo_ai_enqueue_v3(text,text,text,text,text),public.seo_ai_claim_editorial_v3(uuid,numeric),public.seo_ai_bundle_valid(jsonb),public.seo_ai_review(uuid,text,text,integer,jsonb,text,jsonb,text,text),public.seo_ai_dashboard_v3(text,text) from public,anon,authenticated,service_role;
grant execute on function public.seo_ai_enqueue_v3(text,text,text,text,text),public.seo_ai_claim_editorial_v3(uuid,numeric),public.seo_ai_review(uuid,text,text,integer,jsonb,text,jsonb,text,text),public.seo_ai_dashboard_v3(text,text) to service_role;
commit;
