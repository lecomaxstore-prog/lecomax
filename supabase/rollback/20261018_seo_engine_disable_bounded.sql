-- PREPARED ONLY. Separate explicit production recovery approval required.
-- Disable synchronization and API writes; retain SEO content and all audit history.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
alter table public.products disable trigger products_seo_sync;
alter table public.categories disable trigger categories_seo_sync;
revoke execute on function public.save_seo_document(text,text,integer,text,jsonb,text,text,text) from service_role;
commit;
