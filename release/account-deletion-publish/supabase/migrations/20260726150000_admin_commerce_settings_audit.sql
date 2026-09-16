-- Immutable audit trail for admin changes affecting checkout money and availability.
create table if not exists public.admin_commerce_settings_audit (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  area text not null check (area in ('payment', 'delivery', 'payment_delivery')),
  changed_keys text[] not null,
  changes jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_commerce_settings_audit_created_at_idx
  on public.admin_commerce_settings_audit (created_at desc);

alter table public.admin_commerce_settings_audit enable row level security;
revoke all on table public.admin_commerce_settings_audit from anon, authenticated;
grant all on table public.admin_commerce_settings_audit to service_role;

comment on table public.admin_commerce_settings_audit is
  'Server-written audit events for payment and delivery configuration changes.';
