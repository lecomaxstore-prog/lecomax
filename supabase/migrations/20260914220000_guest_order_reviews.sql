-- One review per delivered order/product, shared by phone, email and accounts.
create unique index if not exists reviews_one_per_order_product
  on public.reviews (order_id, product_slug) where order_id is not null;

create table if not exists public.review_lookup_limits (
  key text primary key,
  attempts integer not null,
  expires_at timestamptz not null
);
alter table public.review_lookup_limits enable row level security;
revoke all on public.review_lookup_limits from anon, authenticated;

create or replace function public.consume_review_lookup(p_key text)
returns boolean language plpgsql security definer set search_path = public as $$
declare hits integer;
begin
  delete from public.review_lookup_limits where expires_at < now();
  insert into public.review_lookup_limits(key, attempts, expires_at)
  values (p_key, 1, now() + interval '15 minutes')
  on conflict (key) do update set attempts = review_lookup_limits.attempts + 1
  returning attempts into hits;
  return hits <= 30;
end;
$$;
revoke all on function public.consume_review_lookup(text) from public, anon, authenticated;
grant execute on function public.consume_review_lookup(text) to service_role;

comment on column public.reviews.verified_purchase is
  'Server matched an account or order number plus phone/email to a delivered order containing this product.';
