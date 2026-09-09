-- Additive, service-only compare-and-swap. No existing product is changed by migration.
create or replace function public.apply_product_bulk_change(p_id uuid, p_expected jsonb, p_patch jsonb, p_delete boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_row public.products%rowtype; next_row public.products%rowtype;
begin
  select * into current_row from public.products where id = p_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  if to_jsonb(current_row) is distinct from p_expected then raise exception 'PRODUCT_CHANGED'; end if;
  if p_delete then
    delete from public.products where id = p_id;
    return jsonb_build_object('previous', to_jsonb(current_row), 'current', null);
  end if;
  if jsonb_typeof(p_patch) <> 'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('active','category','price','original_price','stock','color_stock','tags')) then
    raise exception 'INVALID_BULK_PATCH';
  end if;
  next_row := jsonb_populate_record(current_row, p_patch);
  if next_row.stock < 0 or next_row.stock > 1000000 or next_row.price < 0 then raise exception 'INVALID_BULK_PATCH'; end if;
  update public.products set active=next_row.active, category=next_row.category,
    price=next_row.price, original_price=next_row.original_price, stock=next_row.stock,
    color_stock=next_row.color_stock, tags=next_row.tags where id=p_id returning * into next_row;
  return jsonb_build_object('previous',to_jsonb(current_row),'current',to_jsonb(next_row));
end $$;
revoke all on function public.apply_product_bulk_change(uuid,jsonb,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.apply_product_bulk_change(uuid,jsonb,jsonb,boolean) to service_role;
