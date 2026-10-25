-- Read-only after separately approved AI migration. All assertions must be true.
select 'disabled_initially' assertion, not enabled and monthly_limit=0 and not mirai_enabled ok from public.seo_ai_settings;
select 'no_commerce_triggers' assertion,not exists(select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid
  where not t.tgisinternal and t.tgrelid in ('public.products'::regclass,'public.categories'::regclass) and pg_get_functiondef(p.oid) ilike '%seo%') ok;
select 'no_direct_job_access_'||r assertion, not has_table_privilege(r,'public.seo_ai_jobs','SELECT,INSERT,UPDATE,DELETE') ok
  from unnest(array['anon','authenticated','service_role']) r;
select 'rpc_role_'||r||'_'||f assertion, has_function_privilege(r,f,'EXECUTE')=(r='service_role') ok
  from unnest(array['anon','authenticated','service_role']) r cross join unnest(array[
    'public.seo_ai_enqueue(text,text,text,text,text)','public.seo_ai_set_budget(boolean,numeric,boolean,text)',
    'public.seo_ai_claim(uuid,numeric)','public.seo_ai_finish(uuid,uuid,jsonb,text,jsonb)',
    'public.seo_ai_approve(uuid,integer,text)','public.seo_ai_dashboard(text,text)']) f;
select 'helper_private_'||r assertion,not has_function_privilege(r,'public.seo_ai_source(text,text)','EXECUTE') ok
  from unnest(array['anon','authenticated','service_role']) r;
