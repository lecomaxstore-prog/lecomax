alter table public.mobile_push_tokens
  alter column user_id drop not null;

alter table public.mobile_push_tokens
  add column if not exists installation_id text;

alter table public.mobile_push_tokens
  drop constraint if exists mobile_push_tokens_owner_check;

alter table public.mobile_push_tokens
  add constraint mobile_push_tokens_owner_check
  check (user_id is not null or (installation_id is not null and char_length(installation_id) between 20 and 100));

create index if not exists mobile_push_tokens_installation_active_idx
  on public.mobile_push_tokens (installation_id, active)
  where installation_id is not null;

notify pgrst, 'reload schema';
