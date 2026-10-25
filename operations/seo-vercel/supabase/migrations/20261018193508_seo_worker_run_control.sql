-- Prepared only. Requires standalone decoupled 002 first, never synchronous 001.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
create table public.seo_worker_control (
  singleton boolean primary key default true check(singleton),
  token uuid, started_at timestamptz, lease_until timestamptz, finished_at timestamptz,
  state text not null default 'idle' check(state in ('idle','running','completed','partial','failed')),
  completed integer not null default 0, failed integer not null default 0,
  superseded integer not null default 0, reconciled integer not null default 0,
  last_error text, budget_exhausted boolean not null default false,
  batch_limit_reached boolean not null default false
);
insert into public.seo_worker_control(singleton) values(true);
alter table public.seo_worker_control enable row level security;
revoke all on public.seo_worker_control from public,anon,authenticated,service_role;

create function public.begin_seo_run() returns uuid
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare result uuid;
begin
  update public.seo_worker_control set token=gen_random_uuid(),started_at=clock_timestamp(),
    lease_until=clock_timestamp()+interval '90 seconds',finished_at=null,state='running',
    completed=0,failed=0,superseded=0,reconciled=0,last_error=null,budget_exhausted=false,batch_limit_reached=false
    where singleton and (state<>'running' or lease_until<=clock_timestamp()) returning token into result;
  return result;
end $$;

-- Each step locks the control row until its SQL transaction finishes. A takeover
-- cannot interleave with an old step, even if that request outlives its lease.
create function public.seo_run_step(p_token uuid,p_operation text,p_args jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
declare control public.seo_worker_control%rowtype; result jsonb; ok boolean;
begin
  select * into control from public.seo_worker_control where singleton for update;
  if control.token is distinct from p_token or control.state<>'running' or control.lease_until<=clock_timestamp()
    then raise exception 'SEO_RUN_EXPIRED'; end if;
  if p_operation='reconcile_seo_queue' then
    result:=to_jsonb(public.reconcile_seo_queue());
    update public.seo_worker_control set reconciled=(result #>> '{}')::integer where singleton;
  elsif p_operation='claim_seo_job' then result:=public.claim_seo_job();
  elsif p_operation='complete_seo_job' then
    ok:=public.complete_seo_job(p_args->>'p_kind',p_args->>'p_entity_id',(p_args->>'p_token')::uuid);
    update public.seo_worker_control set completed=completed+case when ok then 1 else 0 end,
      superseded=superseded+case when ok then 0 else 1 end where singleton;
    result:=to_jsonb(ok);
  elsif p_operation='fail_seo_job' then
    ok:=public.fail_seo_job(p_args->>'p_kind',p_args->>'p_entity_id',(p_args->>'p_token')::uuid);
    update public.seo_worker_control set failed=failed+case when ok then 1 else 0 end,
      last_error=case when ok then 'SEO_PROCESSING_FAILED' else last_error end where singleton;
    result:=to_jsonb(ok);
  else raise exception 'SEO_OPERATION_INVALID'; end if;
  return result;
end $$;

create function public.finish_seo_run(p_token uuid,p_failed boolean,p_budget boolean,p_limit boolean) returns boolean
language plpgsql security definer set search_path=pg_catalog,public set lock_timeout='1s' as $$
begin
  update public.seo_worker_control set finished_at=clock_timestamp(),
    state=case when p_failed or failed>0 then 'failed' when p_budget or p_limit then 'partial' else 'completed' end,
    last_error=case when p_failed then 'SEO_SYNC_RUN_FAILED' else last_error end,
    budget_exhausted=p_budget,batch_limit_reached=p_limit
    where singleton and token=p_token and state='running' and lease_until>clock_timestamp();
  return found;
end $$;

create function public.seo_run_status() returns jsonb
language sql security definer set search_path=pg_catalog,public as $$
  select jsonb_build_object('state',case when state='running' and lease_until<=clock_timestamp() then 'interrupted' else state end,
    'startedAt',started_at,'finishedAt',finished_at,'leaseUntil',lease_until,
    'completed',completed,'failed',failed,'superseded',superseded,'reconciled',reconciled,
    'error',case when state='running' and lease_until<=clock_timestamp() then 'WORKER_LEASE_EXPIRED' else last_error end,
    'budgetExhausted',budget_exhausted,'batchLimitReached',batch_limit_reached)
  from public.seo_worker_control where singleton;
$$;
revoke all on function public.begin_seo_run(),public.seo_run_step(uuid,text,jsonb),
  public.finish_seo_run(uuid,boolean,boolean,boolean),public.seo_run_status() from public,anon,authenticated,service_role;
grant execute on function public.begin_seo_run(),public.seo_run_step(uuid,text,jsonb),
  public.finish_seo_run(uuid,boolean,boolean,boolean),public.seo_run_status() to service_role;
-- Retired workers must fail closed rather than bypass the shared run lease.
revoke execute on function public.reconcile_seo_queue(),public.claim_seo_job(),
  public.complete_seo_job(text,text,uuid),public.fail_seo_job(text,text,uuid) from service_role;
commit;
