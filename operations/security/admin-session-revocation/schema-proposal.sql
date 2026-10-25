-- REVIEW PROPOSAL ONLY. Not an E migration; no deployment runner references this file.
-- A separately approved release must create its timestamped migration via the CLI.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create table public.admin_session_registry (
 key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
 email text not null check (email=lower(btrim(email)) and length(email)<=254),
 issued_at bigint not null,
 expires_at bigint not null check (expires_at>issued_at and expires_at-issued_at<=2592000000),
 revoked_at bigint
);
create index admin_session_registry_email on public.admin_session_registry(email) where revoked_at is null;
alter table public.admin_session_registry enable row level security;
revoke all on public.admin_session_registry from public,anon,authenticated,service_role;
grant select,insert on public.admin_session_registry to service_role;
grant update(revoked_at) on public.admin_session_registry to service_role;
create policy admin_session_registry_service on public.admin_session_registry to service_role using(true) with check(true);
commit;
