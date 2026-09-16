-- Keep existing translations and the legacy two-argument RPC for older servers.
alter table public.product_translations drop constraint if exists product_translations_locale_check;
alter table public.product_translations add constraint product_translations_locale_check check (locale in ('en', 'fr'));

create or replace function public.claim_product_translation(p_product_id uuid, p_source_hash text, p_locale text)
returns boolean language plpgsql security invoker set search_path = public as $$
declare claimed integer;
begin
  if p_locale not in ('en', 'fr') or p_locale is null then
    raise exception 'Unsupported translation language';
  end if;
  insert into public.product_translations(product_id, locale, source_hash, retry_after)
    values(p_product_id, p_locale, p_source_hash, now() + interval '90 seconds')
  on conflict (product_id, locale, source_hash) do update
    set status = 'pending', retry_after = now() + interval '90 seconds', updated_at = now()
    where product_translations.status <> 'ready' and product_translations.retry_after <= now();
  get diagnostics claimed = row_count;
  return claimed = 1;
end;
$$;
revoke all on function public.claim_product_translation(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_product_translation(uuid, text, text) to service_role;
