-- New RLS-protected intelligence tables are server-only. Explicit table
-- privileges are still required in addition to service_role's RLS bypass.
grant select, insert, update, delete on table public.loyalty_transactions to service_role;
grant select, insert, update, delete on table public.product_intelligence_daily to service_role;
