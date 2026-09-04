begin;

create or replace function public.reserve_order_inventory(p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  item jsonb; product_row public.products%rowtype;
  qty integer; chosen_color text; chosen_size text;
  color_qty integer; size_qty integer; size_prefix text; size_tag text;
  matrix_tag text; matrix_json jsonb; matrix_qty integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'INVALID_INVENTORY_ITEMS';
  end if;
  for item in select value from jsonb_array_elements(p_items)
    order by value->>'slug', coalesce(value->>'color',''), coalesce(value->>'size','')
  loop
    qty := (item->>'qty')::integer;
    chosen_color := nullif(trim(item->>'color'), '');
    chosen_size := nullif(trim(item->>'size'), '');
    if qty < 1 or qty > 20 then raise exception using errcode = '22023', message = 'INVALID_INVENTORY_QUANTITY'; end if;
    select * into product_row from public.products where slug = item->>'slug' for update;
    if not found or product_row.stock is null or product_row.stock < qty then
      raise exception using errcode = 'P0001', message = 'INSUFFICIENT_PRODUCT_STOCK';
    end if;
    if chosen_color is not null and product_row.color_stock is not null and product_row.color_stock ? chosen_color then
      color_qty := (product_row.color_stock->>chosen_color)::integer;
      if color_qty < qty then raise exception using errcode = 'P0001', message = 'INSUFFICIENT_VARIANT_STOCK'; end if;
      product_row.color_stock := jsonb_set(product_row.color_stock, array[chosen_color], to_jsonb(color_qty - qty), false);
    end if;
    if chosen_size is not null then
      size_prefix := '__sstock:' || chosen_size || ':';
      select tag into size_tag from unnest(coalesce(product_row.tags,array[]::text[])) tag where left(tag,length(size_prefix)) = size_prefix limit 1;
      if size_tag is not null then
        size_qty := substring(size_tag from length(size_prefix)+1)::integer;
        if size_qty < qty then raise exception using errcode = 'P0001', message = 'INSUFFICIENT_VARIANT_STOCK'; end if;
        product_row.tags := array_replace(product_row.tags,size_tag,size_prefix || (size_qty-qty)::text);
      end if;
    end if;
    if chosen_color is not null and chosen_size is not null then
      select tag into matrix_tag from unnest(coalesce(product_row.tags,array[]::text[])) tag
        where left(tag,9) = '__vstock:' and (substring(tag from 10)::jsonb)->>0 = chosen_color limit 1;
      if matrix_tag is not null then
        matrix_json := substring(matrix_tag from 10)::jsonb;
        matrix_qty := coalesce(((matrix_json->1)->>chosen_size)::integer,0);
        if matrix_qty < qty then raise exception using errcode = 'P0001', message = 'INSUFFICIENT_VARIANT_STOCK'; end if;
        matrix_json := jsonb_set(matrix_json,array['1',chosen_size],to_jsonb(matrix_qty-qty),false);
        product_row.tags := array_replace(product_row.tags,matrix_tag,'__vstock:' || matrix_json::text);
      end if;
    end if;
    update public.products set stock=stock-qty,color_stock=product_row.color_stock,tags=product_row.tags where id=product_row.id;
  end loop;
end; $$;

create or replace function public.release_order_inventory(p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  item jsonb; product_row public.products%rowtype;
  qty integer; chosen_color text; chosen_size text;
  color_qty integer; size_qty integer; size_prefix text; size_tag text;
  matrix_tag text; matrix_json jsonb; matrix_qty integer;
begin
  if jsonb_typeof(p_items) <> 'array' then return; end if;
  for item in select value from jsonb_array_elements(p_items)
    order by value->>'slug', coalesce(value->>'color',''), coalesce(value->>'size','')
  loop
    qty := (item->>'qty')::integer; chosen_color := nullif(trim(item->>'color'),''); chosen_size := nullif(trim(item->>'size'),'');
    select * into product_row from public.products where slug=item->>'slug' for update;
    if not found then continue; end if;
    if chosen_color is not null and product_row.color_stock is not null and product_row.color_stock ? chosen_color then
      color_qty := (product_row.color_stock->>chosen_color)::integer;
      product_row.color_stock := jsonb_set(product_row.color_stock,array[chosen_color],to_jsonb(color_qty+qty),false);
    end if;
    if chosen_size is not null then
      size_prefix := '__sstock:' || chosen_size || ':';
      select tag into size_tag from unnest(coalesce(product_row.tags,array[]::text[])) tag where left(tag,length(size_prefix))=size_prefix limit 1;
      if size_tag is not null then size_qty := substring(size_tag from length(size_prefix)+1)::integer; product_row.tags := array_replace(product_row.tags,size_tag,size_prefix || (size_qty+qty)::text); end if;
    end if;
    if chosen_color is not null and chosen_size is not null then
      select tag into matrix_tag from unnest(coalesce(product_row.tags,array[]::text[])) tag
        where left(tag,9)='__vstock:' and (substring(tag from 10)::jsonb)->>0=chosen_color limit 1;
      if matrix_tag is not null then
        matrix_json := substring(matrix_tag from 10)::jsonb; matrix_qty := coalesce(((matrix_json->1)->>chosen_size)::integer,0);
        matrix_json := jsonb_set(matrix_json,array['1',chosen_size],to_jsonb(matrix_qty+qty),false);
        product_row.tags := array_replace(product_row.tags,matrix_tag,'__vstock:' || matrix_json::text);
      end if;
    end if;
    update public.products set stock=stock+qty,color_stock=product_row.color_stock,tags=product_row.tags where id=product_row.id;
  end loop;
end; $$;

revoke all on function public.reserve_order_inventory(jsonb) from public, anon, authenticated;
revoke all on function public.release_order_inventory(jsonb) from public, anon, authenticated;
grant execute on function public.reserve_order_inventory(jsonb) to service_role;
grant execute on function public.release_order_inventory(jsonb) to service_role;
commit;
