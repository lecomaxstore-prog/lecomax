-- Only the server can look up review purchases. No customer data is returned
-- to the public API caller; submission repeats the same eligibility checks.
create or replace function public.review_contact_phone(raw text)
returns text language sql immutable strict set search_path = public as $$
  select case when digits ~ '^0[5-7][0-9]{8}$'
    then '212' || substring(digits from 2) else digits end
  from (select regexp_replace(regexp_replace(raw, '[^0-9]', '', 'g'), '^00', '') as digits) normalized;
$$;

create index if not exists orders_review_phone_idx
  on public.orders (public.review_contact_phone(customer->>'phone'));
create index if not exists orders_review_email_idx
  on public.orders (lower(btrim(customer->>'email')));

create or replace function public.find_review_orders_by_contact(
  p_contact_type text, p_contact text, p_slug text
) returns table (id uuid, items jsonb, status text, customer jsonb)
language sql stable security invoker set search_path = public as $$
  select o.id, o.items::jsonb, o.status::text, o.customer::jsonb
  from public.orders o
  where (
    (p_contact_type = 'phone' and public.review_contact_phone(o.customer->>'phone') = p_contact)
    or (p_contact_type = 'email' and lower(btrim(o.customer->>'email')) = p_contact)
  )
  and o.items::jsonb @> jsonb_build_array(jsonb_build_object('slug', p_slug))
  order by o.created_at desc, o.id
  limit 100;
$$;
revoke all on function public.find_review_orders_by_contact(text, text, text) from public, anon, authenticated;
grant execute on function public.find_review_orders_by_contact(text, text, text) to service_role;
