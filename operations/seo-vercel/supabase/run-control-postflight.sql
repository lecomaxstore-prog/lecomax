begin read only;
set local statement_timeout='10s';
select 'run-control RLS' check_name, relrowsecurity passed from pg_class where oid='public.seo_worker_control'::regclass;
select 'singleton exists' check_name,count(*)=1 passed from public.seo_worker_control;
select 'no application direct access' check_name,not bool_or(has_table_privilege(r,'public.seo_worker_control','SELECT,INSERT,UPDATE,DELETE')) passed
from unnest(array['anon','authenticated','service_role']) r;
select 'browser RPC denial' check_name,not bool_or(has_function_privilege(r,f,'EXECUTE')) passed
from unnest(array['anon','authenticated']) r cross join unnest(array['public.begin_seo_run()','public.seo_run_step(uuid,text,jsonb)','public.finish_seo_run(uuid,boolean,boolean,boolean)','public.seo_run_status()']) f;
select 'service run-control access' check_name,bool_and(has_function_privilege('service_role',f,'EXECUTE')) passed
from unnest(array['public.begin_seo_run()','public.seo_run_step(uuid,text,jsonb)','public.finish_seo_run(uuid,boolean,boolean,boolean)','public.seo_run_status()']) f;
select 'unfenced service execution denied' check_name,not bool_or(has_function_privilege('service_role',f,'EXECUTE')) passed
from unnest(array['public.reconcile_seo_queue()','public.claim_seo_job()','public.complete_seo_job(text,text,uuid)','public.fail_seo_job(text,text,uuid)']) f;
select public.seo_run_status() status;
rollback;
