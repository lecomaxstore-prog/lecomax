begin;

-- The same configured color/size identifiers used by existing inventory tags.
create or replace function public.selected_product_stock(p public.products, c text, s text)
returns integer language plpgsql immutable set search_path = public as $$
declare available integer := coalesce(p.stock,0); tag text; matrix jsonb; matched boolean := false; has_matrix boolean := false;
begin
  if coalesce(array_length(p.colors,1),0)>0 and (c is null or not c=any(p.colors)) then return -1; end if;
  if coalesce(array_length(p.sizes,1),0)>0 and (s is null or not s=any(p.sizes)) then return -1; end if;
  if c is not null and not (c=any(coalesce(p.colors,array[]::text[]))) then return -1; end if;
  if s is not null and not (s=any(coalesce(p.sizes,array[]::text[]))) then return -1; end if;
  if c is not null and coalesce(p.color_stock,'{}'::jsonb)<>'{}'::jsonb then
    if not p.color_stock ? c then return -1; end if;
    available := least(available,(p.color_stock->>c)::integer);
  end if;
  foreach tag in array coalesce(p.tags,array[]::text[]) loop
    if s is not null and left(tag,length('__sstock:'||s||':'))='__sstock:'||s||':' then
      available := least(available,substring(tag from length('__sstock:'||s||':')+1)::integer);
    end if;
    if left(tag,9)='__vstock:' then
      has_matrix := true; matrix := substring(tag from 10)::jsonb;
      if matrix->>0=c and (matrix->1) ? s then
        matched := true; available := least(available,((matrix->1)->>s)::integer);
      end if;
    end if;
  end loop;
  if has_matrix and not matched then return -1; end if;
  return greatest(0,available);
exception when invalid_text_representation or numeric_value_out_of_range then return -1;
end; $$;

-- Service-role only. Product locks, inventory, immutable snapshots and order
-- insertion are one transaction. A retry never reserves stock a second time.
create or replace function public.create_order_with_inventory(p_order jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.products%rowtype; o public.orders%rowtype; line jsonb;
  snapshots jsonb := '[]'; available integer; quantity integer; fulfillment text;
  c text; s text; current_price numeric; price_tag text; price_row jsonb;
begin
  if nullif(p_order->>'idempotency_key','') is null then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_order->>'idempotency_key',0));
  select * into o from public.orders where idempotency_key=p_order->>'idempotency_key';
  if found then return jsonb_build_object('id',o.id,'order_number',o.order_number,'items',o.items,'duplicate',true); end if;
  if jsonb_typeof(p_order->'items') is distinct from 'array' or jsonb_array_length(p_order->'items') not between 1 and 50 then
    raise exception 'INVALID_INVENTORY_ITEMS' using errcode='22023';
  end if;
  perform 1 from public.products where slug in (select value->>'slug' from jsonb_array_elements(p_order->'items')) order by slug for update;
  for line in select value from jsonb_array_elements(p_order->'items') loop
    if jsonb_typeof(line->'qty') is distinct from 'number' or (line->>'qty') !~ '^[0-9]+$' then raise exception 'INVALID_INVENTORY_QUANTITY' using errcode='22023'; end if;
    quantity := (line->>'qty')::integer;
    if quantity is null or quantity not between 1 and 20 then raise exception 'INVALID_INVENTORY_QUANTITY' using errcode='22023'; end if;
    select * into p from public.products where slug=line->>'slug' and active=true;
    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    c:=nullif(line->>'color',''); s:=nullif(line->>'size','');
    available:=public.selected_product_stock(p,c,s);
    if available<0 then raise exception 'INVALID_VARIANT'; end if;
    fulfillment:=case when available>=quantity then 'STANDARD' when p.preorder_enabled then 'PREORDER' else 'OUT_OF_STOCK' end;
    if fulfillment='OUT_OF_STOCK' then raise exception 'PREORDER_UNAVAILABLE'; end if;
    -- Never silently change an immediately available order into delayed delivery.
    if fulfillment<>coalesce(line->>'fulfillment_type','STANDARD') then raise exception 'FULFILLMENT_CHANGED'; end if;
    if fulfillment='PREORDER' and (p.preorder_estimated_at::text is distinct from line->>'preorder_estimated_at' or p.preorder_message is distinct from line->>'preorder_message') then raise exception 'FULFILLMENT_CHANGED'; end if;
    -- API computes existing encoded-color prices; reject any pricing/tag change
    -- between that authoritative read and the transaction. Clients cannot call RPC.
    if p.price is distinct from (line->>'base_price')::numeric or
      to_jsonb(array(select tag from unnest(coalesce(p.tags,array[]::text[])) tag where left(tag,9)='__cprice:')) is distinct from line->'pricing_tags' then raise exception 'PRICE_CHANGED'; end if;
    current_price:=(line->>'price')::numeric;
    if current_price is null or current_price<=0 then raise exception 'PRICE_CHANGED'; end if;
    line := (line - 'base_price' - 'pricing_tags') || jsonb_build_object('product_id',p.id,'name',p.name,'price',current_price,
      'fulfillment_type',fulfillment,'inventory_reserved',fulfillment='STANDARD',
      'preorder_estimated_at',case when fulfillment='PREORDER' then p.preorder_estimated_at else null end,
      'preorder_message',case when fulfillment='PREORDER' then p.preorder_message else null end);
    if fulfillment='STANDARD' then perform public.reserve_order_inventory(jsonb_build_array(line)); end if;
    snapshots:=snapshots||jsonb_build_array(line);
  end loop;
  o:=jsonb_populate_record(null::public.orders,p_order||jsonb_build_object('items',snapshots,'id',gen_random_uuid()));
  insert into public.orders(id,order_number,customer,items,total,payment_method,payment_reference,payment_status,payment_currency,payment_amount,status,tracking_number,notes,created_at,order_source,idempotency_key)
    values(o.id,o.order_number,o.customer,o.items,o.total,o.payment_method,o.payment_reference,o.payment_status,o.payment_currency,o.payment_amount,o.status,o.tracking_number,o.notes,now(),o.order_source,o.idempotency_key);
  return jsonb_build_object('id',o.id,'order_number',o.order_number,'items',snapshots,'duplicate',false);
end; $$;

-- Staff explicitly starts fulfillment. Restocking alone never ships an order.
-- Reserve waiting demand once, and release only physical stock on cancellation.
create or replace function public.update_order_with_inventory(p_id uuid,p_patch jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.orders%rowtype; line jsonb; inventory_line jsonb; snapshots jsonb:='[]'; next_status text; p public.products%rowtype;
begin
  select * into o from public.orders where id=p_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  next_status:=coalesce(p_patch->>'status',o.status);
  if next_status not in ('pending','confirmed','processing','shipped','delivered','cancelled') then raise exception 'INVALID_STATUS'; end if;
  if o.status='cancelled' and next_status<>'cancelled' then raise exception 'CANCELLED_ORDER_CANNOT_REOPEN'; end if;
  if o.status='delivered' and next_status<>o.status then raise exception 'DELIVERED_ORDER_CANNOT_REOPEN'; end if;
  perform 1 from public.products where id::text in (select value->>'product_id' from jsonb_array_elements(o.items))
    or slug in (select value->>'slug' from jsonb_array_elements(o.items) where value->>'product_id' is null) order by slug for update;
  for line in select value from jsonb_array_elements(o.items) loop
    select * into p from public.products where id::text=line->>'product_id' or (line->>'product_id' is null and slug=line->>'slug');
    inventory_line:=line||jsonb_build_object('slug',p.slug);
    if next_status in ('processing','shipped','delivered') and line->>'fulfillment_type'='PREORDER' and not coalesce((line->>'inventory_reserved')::boolean,false) then
      if p.id is null or public.selected_product_stock(p,nullif(line->>'color',''),nullif(line->>'size',''))<(line->>'qty')::integer then raise exception 'PREORDER_WAITING_FOR_STOCK'; end if;
      perform public.reserve_order_inventory(jsonb_build_array(inventory_line));
      line:=line||jsonb_build_object('inventory_reserved',true);
    end if;
    if next_status='cancelled' and o.status<>'cancelled' and coalesce((line->>'inventory_reserved')::boolean,coalesce(line->>'fulfillment_type','STANDARD')='STANDARD') then
      if p.id is not null then perform public.release_order_inventory(jsonb_build_array(inventory_line)); end if;
      line:=line||jsonb_build_object('inventory_reserved',false);
    end if;
    snapshots:=snapshots||jsonb_build_array(line);
  end loop;
  update public.orders set status=next_status,items=snapshots,
    tracking_number=case when p_patch ? 'tracking_number' then p_patch->>'tracking_number' else tracking_number end,
    notes=case when p_patch ? 'notes' then p_patch->>'notes' else notes end,updated_at=now()
    where id=p_id returning * into o;
  return to_jsonb(o);
end; $$;

revoke all on function public.selected_product_stock(public.products,text,text) from public,anon,authenticated;
revoke all on function public.create_order_with_inventory(jsonb) from public,anon,authenticated;
revoke all on function public.update_order_with_inventory(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.selected_product_stock(public.products,text,text) to service_role;
grant execute on function public.create_order_with_inventory(jsonb) to service_role;
grant execute on function public.update_order_with_inventory(uuid,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
