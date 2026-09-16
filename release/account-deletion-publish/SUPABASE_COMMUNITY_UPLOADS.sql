-- L'ecomax / photos publiées directement par les clients
-- À exécuter une seule fois dans Supabase Dashboard > SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ecomedia',
  'ecomedia',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads pass through the protected Next.js API using the service-role key.
-- Visitors receive read access only so published photos can be displayed.
drop policy if exists "Public read ecomedia media" on storage.objects;
create policy "Public read ecomedia media"
on storage.objects for select
to public
using (bucket_id = 'ecomedia');

-- No browser INSERT/UPDATE/DELETE policy is granted. This prevents users from
-- bypassing the API's file-type, size and ownership validation.
