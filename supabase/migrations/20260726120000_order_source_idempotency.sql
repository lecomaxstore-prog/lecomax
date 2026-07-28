-- Shared website/mobile order provenance and duplicate-submission protection.
-- Nullable idempotency keeps every pre-existing website order compatible.

alter table public.orders
  add column if not exists order_source text not null default 'website',
  add column if not exists idempotency_key text;

alter table public.orders
  drop constraint if exists orders_order_source_check;

alter table public.orders
  add constraint orders_order_source_check
  check (order_source in ('website', 'mobile_app'));

create unique index if not exists orders_idempotency_key_uidx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

create index if not exists orders_order_source_created_at_idx
  on public.orders (order_source, created_at desc);

comment on column public.orders.order_source is
  'Originating storefront. Website and mobile orders remain in the same table.';

comment on column public.orders.idempotency_key is
  'Opaque client request key used to return the original order after a duplicate submission.';

notify pgrst, 'reload schema';
