-- Read-only verification for the standalone alternative, before or after backfill.
select 'no synchronous SEO catalogue triggers' check_name, not exists(
  select 1 from pg_trigger where not tgisinternal and
    (tgname in ('products_seo_sync','categories_seo_sync') or tgfoid=to_regprocedure('public.seo_catalogue_trigger()'))
) passed;
select 'four SEO tables have RLS' check_name, count(*)=4 passed
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
  and c.relname in ('seo_documents','seo_events','seo_sync_queue','seo_sync_health') and c.relrowsecurity;
select 'no anonymous or authenticated SEO table access' check_name, not exists(
  select 1 from (values('anon'),('authenticated')) r(role_name)
  cross join (values('seo_documents'),('seo_events'),('seo_sync_queue'),('seo_sync_health')) t(table_name)
  where has_table_privilege(r.role_name,'public.'||t.table_name,'SELECT,INSERT,UPDATE,DELETE')
) passed;
select 'no public worker or editor execution' check_name, not exists(
  select 1 from (values('anon'),('authenticated')) r(role_name)
  cross join (values('reconcile_seo_queue()'),('claim_seo_job()'),('complete_seo_job(text,text,uuid)'),
    ('fail_seo_job(text,text,uuid)'),('retry_failed_seo_jobs()'),('seo_sync_status(text)'),
    ('save_seo_document(text,text,integer,text,jsonb,text,text,text)')) f(signature)
  where has_function_privilege(r.role_name,'public.'||f.signature,'EXECUTE')
) passed;
select 'service RPC access' check_name, bool_and(has_function_privilege('service_role','public.'||signature,'EXECUTE')) passed
from (values('reconcile_seo_queue()'),('claim_seo_job()'),('complete_seo_job(text,text,uuid)'),
  ('fail_seo_job(text,text,uuid)'),('retry_failed_seo_jobs()'),('seo_sync_status(text)'),
  ('save_seo_document(text,text,integer,text,jsonb,text,text,text)')) f(signature);
select 'no service direct mutation' check_name, not exists(
  select 1 from (values('seo_documents'),('seo_events'),('seo_sync_queue'),('seo_sync_health')) t(table_name)
  where has_table_privilege('service_role','public.'||t.table_name,'INSERT,UPDATE,DELETE')
) passed;
select 'internal generator is not callable by application roles' check_name,
  not bool_or(has_function_privilege(role_name,'public.sync_seo_document(text,jsonb)','EXECUTE')) passed
from (values('anon'),('authenticated'),('service_role')) r(role_name);
select 'SEO has no commerce foreign keys' check_name, not exists(
  select 1 from pg_constraint where contype='f' and
  conrelid in ('public.seo_documents'::regclass,'public.seo_sync_queue'::regclass)
) passed;
select public.seo_sync_status() synchronization;
-- Coverage is expected to be nonzero before the worker's first backfill.
select count(*) catalogue_entities_without_document from (
  select 'product' kind,id::text entity_id from public.products
  union all select 'category',id::text from public.categories
) c where not exists(select 1 from public.seo_documents d where d.kind=c.kind and d.entity_id=c.entity_id);
