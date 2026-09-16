create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'android' check (platform = 'android'),
  version_name text not null check (version_name ~ '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$'),
  version_code integer not null check (version_code > 0),
  storage_path text not null unique,
  file_name text not null check (file_name ~ '^lecomax-v[0-9A-Za-z.-]+\.apk$'),
  file_size bigint not null check (file_size between 1024 and 157286400),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  minimum_android_version text not null default '8.0',
  release_notes jsonb not null default '[]'::jsonb check (jsonb_typeof(release_notes) = 'array'),
  required boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,
  created_by text,
  published_by text,
  download_count bigint not null default 0 check (download_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, version_name),
  unique (platform, version_code)
);

create unique index if not exists app_releases_one_published_android_idx
  on public.app_releases (platform) where published;
create index if not exists app_releases_android_versions_idx
  on public.app_releases (platform, version_code desc);

create table if not exists public.app_release_audit (
  id bigint generated always as identity primary key,
  release_id uuid references public.app_releases(id) on delete set null,
  actor_email text,
  action text not null check (action in ('created', 'updated', 'published', 'unpublished', 'rolled_back', 'deleted')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.app_releases enable row level security;
alter table public.app_release_audit enable row level security;
revoke all on table public.app_releases, public.app_release_audit from anon, authenticated;
grant all on table public.app_releases, public.app_release_audit to service_role;
grant usage, select on sequence public.app_release_audit_id_seq to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-releases',
  'app-releases',
  false,
  157286400,
  array['application/vnd.android.package-archive', 'application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read published app release objects" on storage.objects;

create or replace function public.publish_android_release(
  target_release_id uuid,
  actor text,
  audit_action text default 'published'
) returns public.app_releases
language plpgsql
security definer
set search_path = public
as $$
declare selected public.app_releases;
begin
  if audit_action not in ('published', 'rolled_back') then
    raise exception 'invalid audit action';
  end if;
  select * into selected from public.app_releases
    where id = target_release_id and platform = 'android'
    for update;
  if not found then raise exception 'release not found'; end if;

  update public.app_releases
    set published = false, updated_at = now()
    where platform = 'android' and published = true and id <> target_release_id;
  update public.app_releases
    set published = true, published_at = now(), published_by = actor, updated_at = now()
    where id = target_release_id
    returning * into selected;
  insert into public.app_release_audit(release_id, actor_email, action)
    values (target_release_id, actor, audit_action);
  return selected;
end;
$$;

revoke all on function public.publish_android_release(uuid, text, text) from public, anon, authenticated;
grant execute on function public.publish_android_release(uuid, text, text) to service_role;

create or replace function public.increment_app_release_download(target_release_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.app_releases
    set download_count = download_count + 1
    where id = target_release_id and published = true;
$$;

revoke all on function public.increment_app_release_download(uuid) from public, anon, authenticated;
grant execute on function public.increment_app_release_download(uuid) to service_role;
