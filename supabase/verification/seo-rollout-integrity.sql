-- Read-only before/after baseline. Compare using identical UTC formatting.
-- Concurrent legitimate transactions may change counts/hashes; investigate, never overwrite them.
begin transaction isolation level repeatable read read only;
set local statement_timeout = '20s';
set local timezone = 'UTC';
select 'products' as table_name,count(*) as rows,
 md5(coalesce(string_agg(row_to_json(t)::text,E'\n' order by row_to_json(t)::text),'')) as content_fingerprint
from public.products t
union all
select 'categories',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' order by row_to_json(t)::text),'')) from public.categories t
union all
select 'orders',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' order by row_to_json(t)::text),'')) from public.orders t
union all
select 'auth.users',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' order by row_to_json(t)::text),'')) from auth.users t;
-- Aggregate lock/activity evidence only: no query text, customer data or credentials.
select count(*) filter(where xact_start < now()-interval '60 seconds') as transactions_over_60_seconds,
 count(*) filter(where wait_event_type='Lock') as lock_waiting_sessions
from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid();
rollback;
