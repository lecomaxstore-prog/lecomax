-- Additive SEO storage. Existing products, categories and customers are never deleted.
begin;
-- Fail safely instead of waiting indefinitely behind catalogue writes.
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create table public.seo_documents (
  kind text not null check (kind in ('product','category')),
  entity_id text not null,
  slug text not null,
  active boolean not null default false,
  source jsonb not null,
  fallback jsonb not null,
  draft jsonb,
  published jsonb,
  draft_source jsonb,
  published_source jsonb,
  provider text,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  primary key(kind,entity_id)
);
create index seo_documents_slug on public.seo_documents(kind,slug) where active;
create table public.seo_events (
  id bigint generated always as identity primary key,
  kind text not null,
  entity_id text not null,
  action text not null,
  actor text not null,
  content jsonb,
  detail text,
  created_at timestamptz not null default now()
);
create index seo_events_document on public.seo_events(kind,entity_id,id desc);
alter table public.seo_documents enable row level security;
alter table public.seo_events enable row level security;
-- Supabase may grant service_role ALL through default privileges. Remove those
-- defaults explicitly before allowing read-only access and the mutation RPC.
revoke all on public.seo_documents, public.seo_events from public, anon, authenticated, service_role;
-- Sequence defaults are independent of table grants. Prevent direct setval/
-- nextval calls from disrupting the append-only audit identity sequence.
revoke all on sequence public.seo_events_id_seq from public, anon, authenticated, service_role;
grant select on public.seo_documents, public.seo_events to service_role;
-- Writes are only possible through the transactional functions below.

create function public.seo_fallback(p_source jsonb, p_kind text) returns jsonb
language sql immutable set search_path = public as $$
  with clean as (select
    trim(regexp_replace(regexp_replace(coalesce(p_source->>'name',''), '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')) as name,
    trim(regexp_replace(regexp_replace(coalesce(p_source->>'description',''), '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')) as description)
  select jsonb_build_object(
    'title', left(name,110) || ' | L''ecomax Maroc',
    'description', left(name || ' sur L''ecomax au Maroc. ' || coalesce(nullif(description,''),
      case when p_kind='product' then 'Consultez les photos et les informations de ce produit dans notre boutique.'
      else 'Explorez les produits de cette catégorie et consultez leurs fiches détaillées.' end),180),
    'imageAlt',left(name,180)) from clean;
$$;

create function public.sync_seo_document(p_kind text, p_row jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare facts jsonb;
begin
  facts := jsonb_build_object('name',p_row->>'name','slug',p_row->>'slug',
    'description',p_row->>'description','category',p_row->>'category','brand',p_row->>'brand',
    'images',case when p_kind='product' then coalesce(p_row->'images','[]'::jsonb)
      when coalesce(p_row->>'image','') <> '' then jsonb_build_array(p_row->>'image') else '[]'::jsonb end);
  insert into public.seo_documents(kind,entity_id,slug,active,source,fallback)
    values(p_kind,p_row->>'id',p_row->>'slug',coalesce((p_row->>'active')::boolean,false),facts,public.seo_fallback(facts,p_kind))
  on conflict(kind,entity_id) do update set slug=excluded.slug,active=excluded.active,
    source=excluded.source,fallback=excluded.fallback,version=seo_documents.version+1,updated_at=now()
  where seo_documents.source is distinct from excluded.source or seo_documents.active is distinct from excluded.active;
end $$;

create function public.seo_catalogue_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP='DELETE' then
    -- Retain all SEO content and history after a catalogue deletion.
    update public.seo_documents set active=false,version=version+1,updated_at=now()
      where kind=TG_ARGV[0] and entity_id=old.id::text;
    return old;
  end if;
  perform public.sync_seo_document(TG_ARGV[0],to_jsonb(new));
  return new;
end $$;
create trigger products_seo_sync after insert or update or delete on public.products
  for each row execute function public.seo_catalogue_trigger('product');
create trigger categories_seo_sync after insert or update or delete on public.categories
  for each row execute function public.seo_catalogue_trigger('category');
select public.sync_seo_document('product',to_jsonb(p)) from public.products p;
select public.sync_seo_document('category',to_jsonb(c)) from public.categories c;

create function public.save_seo_document(p_kind text,p_entity_id text,p_version integer,p_action text,
  p_content jsonb,p_actor text,p_provider text default 'manual',p_detail text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare doc public.seo_documents%rowtype; payload jsonb;
begin
  select * into doc from public.seo_documents where kind=p_kind and entity_id=p_entity_id for update;
  if not found then raise exception 'SEO_NOT_FOUND'; end if;
  if doc.version <> p_version then raise exception 'SEO_CONFLICT'; end if;
  if p_action not in ('draft','approve','reset','error') then raise exception 'SEO_ACTION_INVALID'; end if;
  if p_action='draft' then
    if p_content is null or jsonb_typeof(p_content) <> 'object' or
      coalesce(length(trim(p_content->>'title')),0) not between 1 and 140 or
      coalesce(length(trim(p_content->>'description')),0) not between 1 and 320 or
      coalesce(length(trim(p_content->>'imageAlt')),0) not between 1 and 240 or
      p_content::text ~ '[<>]' then raise exception 'SEO_CONTENT_INVALID'; end if;
    update public.seo_documents set draft=p_content,draft_source=source,provider=p_provider where kind=p_kind and entity_id=p_entity_id;
    payload:=p_content;
  elsif p_action='approve' then
    if doc.draft is null then raise exception 'SEO_DRAFT_REQUIRED'; end if;
    if doc.draft_source is distinct from doc.source then raise exception 'SEO_SOURCE_CHANGED'; end if;
    update public.seo_documents set published=draft,published_source=source,published_at=now(),draft=null,draft_source=null
      where kind=p_kind and entity_id=p_entity_id;
    payload:=doc.draft;
  elsif p_action='reset' then
    payload:=doc.published;
    update public.seo_documents set published=null,published_source=null,published_at=now()
      where kind=p_kind and entity_id=p_entity_id;
  end if;
  insert into public.seo_events(kind,entity_id,action,actor,content,detail)
    values(p_kind,p_entity_id,p_action,p_actor,payload,left(p_detail,500));
  update public.seo_documents set version=version+1,updated_at=now()
    where kind=p_kind and entity_id=p_entity_id returning * into doc;
  return to_jsonb(doc);
end $$;

revoke all on function public.seo_fallback(jsonb,text), public.sync_seo_document(text,jsonb), public.seo_catalogue_trigger(),
  public.save_seo_document(text,text,integer,text,jsonb,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.save_seo_document(text,text,integer,text,jsonb,text,text,text) to service_role;
commit;
