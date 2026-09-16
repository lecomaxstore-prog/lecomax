begin;

create or replace function public.reserve_order_inventory(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  requested_quantity integer;
  requested_color text;
  color_quantity integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'INVALID_INVENTORY_ITEMS';
  end if;

  -- A stable lock order prevents deadlocks when two carts contain the same
  -- products in a different order.
  for item in
    select value
    from jsonb_array_elements(p_items)
    order by value->>'slug', coalesce(value->>'color', '')
  loop
    requested_quantity := (item->>'qty')::integer;
    requested_color := nullif(trim(item->>'color'), '');
    if requested_quantity < 1 or requested_quantity > 20 then
      raise exception using errcode = '22023', message = 'INVALID_INVENTORY_QUANTITY';
    end if;

    select *
      into product_row
      from public.products
      where slug = item->>'slug'
      for update;

    if not found or product_row.stock is null or product_row.stock < requested_quantity then
      raise exception using errcode = 'P0001', message = 'INSUFFICIENT_PRODUCT_STOCK';
    end if;

    if requested_color is not null
       and product_row.color_stock is not null
       and product_row.color_stock ? requested_color then
      color_quantity := (product_row.color_stock->>requested_color)::integer;
      if color_quantity < requested_quantity then
        raise exception using errcode = 'P0001', message = 'INSUFFICIENT_VARIANT_STOCK';
      end if;
      product_row.color_stock := jsonb_set(
        product_row.color_stock,
        array[requested_color],
        to_jsonb(color_quantity - requested_quantity),
        false
      );
    end if;

    update public.products
      set stock = stock - requested_quantity,
          color_stock = product_row.color_stock
      where id = product_row.id;
  end loop;
end;
$$;

create or replace function public.release_order_inventory(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  released_quantity integer;
  released_color text;
  color_quantity integer;
begin
  if jsonb_typeof(p_items) <> 'array' then
    return;
  end if;

  for item in
    select value
    from jsonb_array_elements(p_items)
    order by value->>'slug', coalesce(value->>'color', '')
  loop
    released_quantity := (item->>'qty')::integer;
    released_color := nullif(trim(item->>'color'), '');

    select *
      into product_row
      from public.products
      where slug = item->>'slug'
      for update;
    if not found then
      continue;
    end if;

    if released_color is not null
       and product_row.color_stock is not null
       and product_row.color_stock ? released_color then
      color_quantity := (product_row.color_stock->>released_color)::integer;
      product_row.color_stock := jsonb_set(
        product_row.color_stock,
        array[released_color],
        to_jsonb(color_quantity + released_quantity),
        false
      );
    end if;

    update public.products
      set stock = stock + released_quantity,
          color_stock = product_row.color_stock
      where id = product_row.id;
  end loop;
end;
$$;

revoke all on function public.reserve_order_inventory(jsonb) from public, anon, authenticated;
revoke all on function public.release_order_inventory(jsonb) from public, anon, authenticated;
grant execute on function public.reserve_order_inventory(jsonb) to service_role;
grant execute on function public.release_order_inventory(jsonb) to service_role;

commit;
