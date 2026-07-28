alter table public.reviews
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists verified_purchase boolean not null default false;

create unique index if not exists reviews_one_per_user_product
  on public.reviews (user_id, product_slug)
  where user_id is not null;

create index if not exists reviews_order_id_idx
  on public.reviews (order_id)
  where order_id is not null;

comment on column public.reviews.verified_purchase is
  'True only when the server matched the authenticated user to a delivered order containing the reviewed product.';
