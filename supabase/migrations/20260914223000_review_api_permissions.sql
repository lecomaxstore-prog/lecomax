-- Browser/mobile clients must publish through the purchase-checking API.
-- Existing broad RLS policies cannot override these table privileges.
revoke all on public.reviews from public, anon, authenticated;

-- Preserve direct public rating reads without exposing order IDs or emails.
do $$
declare safe_columns text;
begin
  select string_agg(quote_ident(column_name), ', ') into safe_columns
  from information_schema.columns
  where table_schema = 'public' and table_name = 'reviews'
    and column_name in ('id', 'product_slug', 'author_name', 'city', 'rating',
      'title', 'body', 'color', 'created_at', 'image_url', 'image_urls',
      'verified_purchase', 'admin_reply');
  execute format('grant select (%s) on public.reviews to anon, authenticated', safe_columns);
end;
$$;
