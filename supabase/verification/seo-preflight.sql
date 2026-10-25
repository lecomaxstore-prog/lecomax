-- READ ONLY. Run as the intended migration owner on the intended database.
begin transaction read only;
set local statement_timeout = '15s';

select 'roles' as check_name, rolname, rolbypassrls,
  has_schema_privilege(rolname, 'public', 'CREATE') as can_create_in_public
from pg_roles where rolname in (current_user, 'anon', 'authenticated', 'service_role');

select 'catalogue_permissions' as check_name, c.relname,
  pg_get_userbyid(c.relowner) as owner,
  has_table_privilege(current_user,c.oid,'SELECT') as can_read,
  has_table_privilege(current_user,c.oid,'TRIGGER') as can_create_trigger
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('products','categories');

select 'catalogue_columns' as check_name, table_name, column_name, data_type,
  udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('products','categories')
order by table_name, ordinal_position;

select 'catalogue_constraints' as check_name, c.relname as table_name,
  con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid=con.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('products','categories');

select 'existing_relations' as check_name, n.nspname, c.relname, c.relkind,
  c.relrowsecurity, c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('seo_documents','seo_events','seo_documents_pkey','seo_events_pkey',
  'seo_documents_slug','seo_events_document','seo_events_id_seq');

select 'existing_functions' as check_name, p.oid::regprocedure::text as signature,
  p.prosecdef, p.proconfig
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
 ('seo_fallback','sync_seo_document','seo_catalogue_trigger','save_seo_document');

select 'catalogue_triggers' as check_name, c.relname, t.tgname, t.tgenabled,
  pg_get_triggerdef(t.oid) as definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('products','categories') and not t.tgisinternal;

select 'existing_policies' as check_name, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname='public' and tablename in ('seo_documents','seo_events');

select 'default_privileges' as check_name, pg_get_userbyid(d.defaclrole) as owner,
  n.nspname, d.defaclobjtype, d.defaclacl::text
from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace
where d.defaclrole=(select oid from pg_roles where rolname=current_user)
  and (n.nspname='public' or d.defaclnamespace=0);

-- Aggregate catalogue checks only; no customer, order or product content output.
select 'catalogue_integrity' as check_name, 'products' as table_name, count(*) as rows,
  count(*) filter(where id is null or slug is null or name is null) as null_required,
  count(*) filter(where trim(slug)='' or trim(name)='') as empty_required,
  count(*)-count(distinct id) as duplicate_ids,
  count(*) filter(where active) - count(distinct slug) filter(where active) as duplicate_active_slugs
from public.products
union all
select 'catalogue_integrity','categories',count(*),
  count(*) filter(where id is null or slug is null or name is null),
  count(*) filter(where trim(slug)='' or trim(name)=''),
  count(*)-count(distinct id),
  count(*) filter(where active) - count(distinct slug) filter(where active)
from public.categories;
rollback;
