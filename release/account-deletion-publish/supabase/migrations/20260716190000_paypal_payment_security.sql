-- Verified PayPal capture metadata and webhook idempotency.
-- Safe to run more than once in the Supabase SQL editor.

alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists payment_status text;
alter table public.orders add column if not exists payment_currency text;
alter table public.orders add column if not exists payment_amount numeric(12,2);

create unique index if not exists orders_payment_reference_uidx
  on public.orders (payment_reference)
  where payment_reference is not null;

create table if not exists public.paypal_webhook_events (
  event_id text primary key,
  event_type text not null,
  capture_id text,
  processed_at timestamptz not null default now()
);

create index if not exists paypal_webhook_events_processed_at_idx
  on public.paypal_webhook_events (processed_at desc);

alter table public.paypal_webhook_events enable row level security;
revoke all on table public.paypal_webhook_events from anon, authenticated;
grant all on table public.paypal_webhook_events to service_role;
grant all on table public.orders to service_role;

notify pgrst, 'reload schema';
