-- Private, reusable translations. Source fingerprints prevent stale copy after edits.
create table if not exists public.product_translations (
  product_id uuid not null references public.products(id) on delete cascade,
  locale text not null check (locale = 'en'),
  source_hash text not null check (length(source_hash) = 64),
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  description text,
  model text,
  retry_after timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, locale, source_hash),
  check (status <> 'ready' or (description is not null and length(trim(description)) > 0))
);
alter table public.product_translations enable row level security;
revoke all on public.product_translations from anon, authenticated;
grant all on public.product_translations to service_role;

-- Atomic lease: concurrent visitors share one generation, including across servers.
create or replace function public.claim_product_translation(p_product_id uuid, p_source_hash text)
returns boolean language plpgsql security invoker set search_path = public as $$
declare claimed integer;
begin
  insert into public.product_translations(product_id, locale, source_hash, retry_after)
    values(p_product_id, 'en', p_source_hash, now() + interval '90 seconds')
  on conflict (product_id, locale, source_hash) do update
    set status = 'pending', retry_after = now() + interval '90 seconds', updated_at = now()
    where product_translations.status <> 'ready' and product_translations.retry_after <= now();
  get diagnostics claimed = row_count;
  return claimed = 1;
end;
$$;
revoke all on function public.claim_product_translation(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_product_translation(uuid, text) to service_role;
