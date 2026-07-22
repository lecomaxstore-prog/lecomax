-- Close PostgREST access to every public-schema table unless a table has an
-- explicit RLS policy. Server routes use service_role and continue to bypass RLS.
do $$
declare
  table_record record;
begin
  for table_record in
    select c.relname
    from pg_catalog.pg_class as c
    join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'alter table public.%I enable row level security',
      table_record.relname
    );
  end loop;
end
$$;

-- The edge middleware can use the anon key when the service-role key is not
-- available. Only operational settings that are safe to publish are readable.
drop policy if exists "Public read storefront settings" on public.settings;
create policy "Public read storefront settings"
on public.settings
for select
to anon, authenticated
using (
  key = 'maintenance_mode'
  or key = 'shipping_cost'
  or key = 'free_shipping_threshold'
  or key = 'shipping_estimated_days'
  or key = 'trustpilot_business_unit_id'
  or key = 'trustpilot_featured_enabled'
  or key = 'size_guide_enabled'
  or key like 'announcement\_%' escape '\'
  or key like 'category\_media:%' escape '\'
  or key like 'size\_guide:%' escape '\'
);

grant select on table public.settings to anon, authenticated;

comment on policy "Public read storefront settings" on public.settings is
  'Read-only access to non-sensitive storefront configuration.';

notify pgrst, 'reload schema';
