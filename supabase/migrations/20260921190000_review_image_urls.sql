-- The review API sends image_urls even for reviews without attachments.
-- Keep legacy rows NULL so clients still fall back to their image_url photo.
alter table public.reviews add column if not exists image_urls text[];
grant select (image_urls) on public.reviews to anon, authenticated;
notify pgrst, 'reload schema';
