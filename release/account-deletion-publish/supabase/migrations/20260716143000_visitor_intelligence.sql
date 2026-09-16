-- Rich, privacy-conscious visitor analytics for the L'ecomax admin dashboard.
alter table public.page_views add column if not exists session_id text;
alter table public.page_views add column if not exists visitor_id text;
alter table public.page_views add column if not exists ip_hash text;
alter table public.page_views add column if not exists ip_masked text;
alter table public.page_views add column if not exists country_code text;
alter table public.page_views add column if not exists region text;
alter table public.page_views add column if not exists city text;
alter table public.page_views add column if not exists device_type text;
alter table public.page_views add column if not exists browser text;
alter table public.page_views add column if not exists operating_system text;
alter table public.page_views add column if not exists screen_width integer;
alter table public.page_views add column if not exists screen_height integer;
alter table public.page_views add column if not exists language text;
alter table public.page_views add column if not exists timezone text;

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_session_id_idx on public.page_views (session_id) where session_id is not null;
create index if not exists page_views_visitor_id_idx on public.page_views (visitor_id) where visitor_id is not null;
create index if not exists page_views_country_code_idx on public.page_views (country_code) where country_code is not null;

comment on column public.page_views.ip_masked is 'Display-safe partial IP. The complete IP is never stored.';
comment on column public.page_views.ip_hash is 'Keyed one-way fingerprint used only for anonymous visitor deduplication.';
