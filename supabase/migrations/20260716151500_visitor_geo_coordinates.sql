alter table public.page_views add column if not exists latitude numeric(8, 4);
alter table public.page_views add column if not exists longitude numeric(8, 4);

comment on column public.page_views.latitude is 'Approximate network geolocation supplied by Vercel, rounded to city-level precision.';
comment on column public.page_views.longitude is 'Approximate network geolocation supplied by Vercel, rounded to city-level precision.';
