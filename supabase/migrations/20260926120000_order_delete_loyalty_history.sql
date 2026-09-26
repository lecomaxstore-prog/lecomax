-- Keep the loyalty audit trail when an administrator deletes an order.
-- Runs in the DELETE transaction: a failed deletion rolls this back too.
create or replace function public.preserve_deleted_order_loyalty()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.loyalty_transactions
  set order_id = null,
      status = case when status = 'pending' then 'reversed' else status end,
      reversed_at = case when status = 'pending' then now() else reversed_at end
  where order_id = old.id;
  return old;
end;
$$;

revoke all on function public.preserve_deleted_order_loyalty() from public, anon, authenticated;
drop trigger if exists preserve_deleted_order_loyalty on public.orders;
create trigger preserve_deleted_order_loyalty
before delete on public.orders
for each row execute function public.preserve_deleted_order_loyalty();
