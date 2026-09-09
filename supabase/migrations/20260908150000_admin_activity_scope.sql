begin;
alter table public.admin_commerce_settings_audit drop constraint if exists admin_commerce_settings_audit_area_check;
alter table public.admin_commerce_settings_audit add constraint admin_commerce_settings_audit_area_check
  check (area in ('payment','delivery','payment_delivery','store','product','banner'));
alter table public.admin_commerce_settings_audit add column if not exists entity_id text;
alter table public.admin_commerce_settings_audit add column if not exists action text not null default 'update';
create index if not exists admin_commerce_settings_audit_entity_idx on public.admin_commerce_settings_audit(area,entity_id,created_at desc);
notify pgrst, 'reload schema';
commit;
