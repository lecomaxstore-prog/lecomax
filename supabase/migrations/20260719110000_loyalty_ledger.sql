-- Idempotent EcoClub ledger: 1 point per 10 MAD, released on delivery.
create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  order_id uuid references public.orders(id) on delete restrict,
  kind text not null default 'order' check (kind in ('order', 'adjustment')),
  points integer not null check (points <> 0),
  status text not null default 'pending' check (status in ('pending', 'earned', 'reversed')),
  reference text not null unique,
  created_at timestamptz not null default now(),
  earned_at timestamptz,
  reversed_at timestamptz,
  unique (order_id, kind)
);

create index if not exists loyalty_transactions_email_created_idx
  on public.loyalty_transactions (email, created_at desc);
create index if not exists loyalty_transactions_status_idx
  on public.loyalty_transactions (status, created_at desc);

alter table public.loyalty_transactions enable row level security;

create or replace function public.reserve_order_loyalty_points(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_total numeric;
  v_status text;
  v_points integer;
begin
  select lower(trim(customer->>'email')), total, status
    into v_email, v_total, v_status
  from public.orders
  where id = p_order_id;

  if v_email is null or v_email = '' or v_status = 'cancelled' then
    return jsonb_build_object('reserved', 0);
  end if;

  v_points := greatest(0, floor(coalesce(v_total, 0) / 10)::integer);
  if v_points = 0 then return jsonb_build_object('reserved', 0); end if;

  insert into public.loyalty_transactions (email, order_id, kind, points, status, reference)
  values (v_email, p_order_id, 'order', v_points, 'pending', 'order:' || p_order_id::text)
  on conflict (order_id, kind) do nothing;

  return jsonb_build_object('reserved', v_points, 'status', 'pending');
end;
$$;

create or replace function public.award_order_loyalty_points(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_total numeric;
  v_status text;
  v_points integer;
  v_awarded integer := 0;
  v_balance integer := 0;
begin
  select lower(trim(customer->>'email')), total, status
    into v_email, v_total, v_status
  from public.orders
  where id = p_order_id
  for update;

  if v_email is null or v_email = '' or v_status <> 'delivered' then
    return jsonb_build_object('awarded', 0, 'reason', 'order_not_eligible');
  end if;

  v_points := greatest(0, floor(coalesce(v_total, 0) / 10)::integer);
  if v_points = 0 then return jsonb_build_object('awarded', 0, 'reason', 'zero_points'); end if;

  insert into public.loyalty_transactions (email, order_id, kind, points, status, reference)
  values (v_email, p_order_id, 'order', v_points, 'pending', 'order:' || p_order_id::text)
  on conflict (order_id, kind) do nothing;

  update public.loyalty_transactions
  set status = 'earned', earned_at = now(), email = v_email, points = v_points
  where order_id = p_order_id and kind = 'order' and status = 'pending'
  returning points into v_awarded;

  if v_awarded > 0 then
    insert into public.user_points (email, points, updated_at)
    values (v_email, v_awarded, now())
    on conflict (email) do update
      set points = public.user_points.points + excluded.points,
          updated_at = now();
  end if;

  select points into v_balance from public.user_points where email = v_email;
  return jsonb_build_object(
    'awarded', v_awarded,
    'balance', coalesce(v_balance, 0),
    'already_awarded', v_awarded = 0
  );
end;
$$;

create or replace function public.reverse_order_loyalty_points(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.loyalty_transactions%rowtype;
  v_reversed integer := 0;
begin
  select * into v_transaction
  from public.loyalty_transactions
  where order_id = p_order_id and kind = 'order'
  for update;

  if not found or v_transaction.status = 'reversed' then
    return jsonb_build_object('reversed', 0);
  end if;

  if v_transaction.status = 'earned' then
    update public.user_points
    set points = greatest(0, points - v_transaction.points), updated_at = now()
    where email = v_transaction.email;
    v_reversed := v_transaction.points;
  end if;

  update public.loyalty_transactions
  set status = 'reversed', reversed_at = now()
  where id = v_transaction.id;

  return jsonb_build_object('reversed', v_reversed);
end;
$$;

create or replace function public.add_loyalty_points(
  p_email text,
  p_amount integer,
  p_reference text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_applied integer := 0;
  v_balance integer := 0;
begin
  if v_email = '' or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'invalid loyalty adjustment';
  end if;

  insert into public.loyalty_transactions (email, kind, points, status, reference, earned_at)
  values (v_email, 'adjustment', p_amount, 'earned', left(p_reference, 160), now())
  on conflict (reference) do nothing
  returning points into v_applied;

  if v_applied > 0 then
    insert into public.user_points (email, points, updated_at)
    values (v_email, v_applied, now())
    on conflict (email) do update
      set points = public.user_points.points + excluded.points,
          updated_at = now();
  end if;

  select points into v_balance from public.user_points where email = v_email;
  return jsonb_build_object('awarded', v_applied, 'balance', coalesce(v_balance, 0));
end;
$$;

revoke all on function public.reserve_order_loyalty_points(uuid) from public, anon, authenticated;
revoke all on function public.award_order_loyalty_points(uuid) from public, anon, authenticated;
revoke all on function public.reverse_order_loyalty_points(uuid) from public, anon, authenticated;
revoke all on function public.add_loyalty_points(text, integer, text) from public, anon, authenticated;
grant execute on function public.reserve_order_loyalty_points(uuid) to service_role;
grant execute on function public.award_order_loyalty_points(uuid) to service_role;
grant execute on function public.reverse_order_loyalty_points(uuid) to service_role;
grant execute on function public.add_loyalty_points(text, integer, text) to service_role;

-- Establish ledger history for existing orders. Existing balances are never
-- reduced: they are only raised when completed-order earnings prove that the
-- customer should already have more points.
insert into public.loyalty_transactions (
  email,
  order_id,
  kind,
  points,
  status,
  reference,
  created_at,
  earned_at
)
select
  lower(trim(customer->>'email')),
  id,
  'order',
  greatest(0, floor(coalesce(total, 0) / 10)::integer),
  case when status = 'delivered' then 'earned' else 'pending' end,
  'order:' || id::text,
  coalesce(created_at, now()),
  case when status = 'delivered' then coalesce(updated_at, created_at, now()) else null end
from public.orders
where status <> 'cancelled'
  and nullif(trim(customer->>'email'), '') is not null
  and floor(coalesce(total, 0) / 10)::integer > 0
on conflict (order_id, kind) do nothing;

insert into public.user_points (email, points, updated_at)
select email, sum(points)::integer, now()
from public.loyalty_transactions
where kind = 'order' and status = 'earned'
group by email
on conflict (email) do update
set points = greatest(public.user_points.points, excluded.points),
    updated_at = case
      when excluded.points > public.user_points.points then now()
      else public.user_points.updated_at
    end;

comment on table public.loyalty_transactions is
  'Immutable-source EcoClub ledger. Pending order points are released exactly once on delivery.';
