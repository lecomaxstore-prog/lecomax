-- READ ONLY, after successful migration. Never calls mutation functions.
-- Every `passed` column must be true. Inspect all definitions as well.
-- Missing relations cause an error: stop and investigate, do not rerun blindly.
begin transaction isolation level repeatable read read only;
set local statement_timeout = '15s';

select 'tables_rls' as check_name, count(*)=2 and bool_and(c.relrowsecurity) as passed
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('seo_documents','seo_events') and c.relkind='r';

-- Zero policies is intentional: browser roles have no access. The server role
-- bypasses RLS, and only the owner-executed RPC may mutate these tables.
select 'no_browser_policies' as check_name, count(*)=0 as passed
from pg_policies where schemaname='public' and tablename in ('seo_documents','seo_events');
select 'service_role_bypasses_rls' as check_name, rolbypassrls as passed
from pg_roles where rolname='service_role';

select 'table_grants' as check_name, role_name, table_name,
  has_table_privilege(role_name, 'public.'||table_name, 'SELECT')=(role_name='service_role')
  and not has_table_privilege(role_name, 'public.'||table_name, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as passed
from (values ('anon'),('authenticated'),('service_role')) r(role_name)
cross join (values ('seo_documents'),('seo_events')) t(table_name);

select 'sequence_grants' as check_name, role_name,
  not has_sequence_privilege(role_name,'public.seo_events_id_seq','USAGE,SELECT,UPDATE') as passed
from (values ('anon'),('authenticated'),('service_role')) r(role_name);

select 'function_grants' as check_name, role_name, signature,
  has_function_privilege(role_name,signature,'EXECUTE')=
    (role_name='service_role' and signature like 'public.save_seo_document%') as passed
from (values ('anon'),('authenticated'),('service_role')) r(role_name)
cross join (values ('public.seo_fallback(jsonb,text)'),('public.sync_seo_document(text,jsonb)'),
 ('public.seo_catalogue_trigger()'),
 ('public.save_seo_document(text,text,integer,text,jsonb,text,text,text)')) f(signature);

select 'function_security' as check_name, p.oid::regprocedure::text as signature,
  p.prosecdef=(p.proname<>'seo_fallback') and p.proconfig @> array['search_path=public'] as passed,
  pg_get_userbyid(p.proowner) as owner
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
 ('seo_fallback','sync_seo_document','seo_catalogue_trigger','save_seo_document');

select 'indexes' as check_name, count(*)=4 and bool_and(i.indisvalid and i.indisready) as passed
from pg_index i join pg_class c on c.oid=i.indexrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('seo_documents_pkey','seo_events_pkey','seo_documents_slug','seo_events_document');
select 'index_definitions' as check_name, indexname, indexdef from pg_indexes
where schemaname='public' and tablename in ('seo_documents','seo_events');

select 'no_cascading_foreign_keys' as check_name, count(*)=0 as passed
from pg_constraint where contype='f' and
 (conrelid in ('public.seo_documents'::regclass,'public.seo_events'::regclass)
 or confrelid in ('public.seo_documents'::regclass,'public.seo_events'::regclass));

select 'sync_triggers' as check_name,
  count(*)=2 and bool_and(t.tgenabled='O' and t.tgfoid='public.seo_catalogue_trigger()'::regprocedure) as passed
from pg_trigger t where not t.tgisinternal and
 ((t.tgrelid='public.products'::regclass and t.tgname='products_seo_sync')
 or (t.tgrelid='public.categories'::regclass and t.tgname='categories_seo_sync'));
select 'trigger_definitions' as check_name, tgname, pg_get_triggerdef(oid) as definition
from pg_trigger where tgname in ('products_seo_sync','categories_seo_sync');

with catalogue as (
 select 'product' as kind, id::text as entity_id, slug, name, coalesce(active,false) as active from public.products
 union all
 select 'category',id::text,slug,name,coalesce(active,false) from public.categories
)
select 'backfill_coverage' as check_name, c.kind, count(*) as catalogue_rows,
 count(d.entity_id) as seo_rows,
 count(*)=count(d.entity_id) and bool_and(d.slug=c.slug and d.active=c.active and d.source->>'name'=c.name) as passed
from catalogue c left join public.seo_documents d using(kind,entity_id) group by c.kind;

select 'fallback_shape' as check_name, count(*) filter(where
 jsonb_typeof(fallback->'title') is distinct from 'string' or
 jsonb_typeof(fallback->'description') is distinct from 'string' or
 jsonb_typeof(fallback->'imageAlt') is distinct from 'string' or
 coalesce(length(trim(fallback->>'title')),0) not between 1 and 140 or
 coalesce(length(trim(fallback->>'description')),0) not between 1 and 320 or
 coalesce(length(trim(fallback->>'imageAlt')),0) not between 1 and 240)=0 as passed
from public.seo_documents;

-- Informational: drafts/approvals/events should be zero immediately after first
-- installation, but may legitimately exist once administrators start working.
select 'seo_counts' as check_name, kind, count(*) as rows,
 count(*) filter(where draft is not null) as drafts,
 count(*) filter(where published is not null) as published
from public.seo_documents group by kind;
select 'audit_event_count' as check_name, count(*) as rows from public.seo_events;
rollback;
