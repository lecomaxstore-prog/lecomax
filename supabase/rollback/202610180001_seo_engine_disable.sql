-- Operational rollback only. Preserve all generated content and audit records.
-- Roll back application code first. Run as database owner after review.
begin;
alter table public.products disable trigger products_seo_sync;
alter table public.categories disable trigger categories_seo_sync;
revoke execute on function public.save_seo_document(text,text,integer,text,jsonb,text,text,text) from service_role;
commit;
-- To re-enable, enable both triggers, grant execute to service_role, and call
-- sync_seo_document(kind,to_jsonb(row)) as schema owner for each catalogue row.
