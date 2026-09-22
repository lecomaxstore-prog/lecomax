alter table public.push_subscriptions add column if not exists admin_email text;

create table if not exists public.owner_learning_days (
  owner_email text not null,
  learning_date date not null,
  completed_at timestamptz,
  reminder_claimed_at timestamptz,
  primary key (owner_email, learning_date)
);
alter table public.owner_learning_days enable row level security;
revoke all on public.owner_learning_days from anon, authenticated;
grant all on public.owner_learning_days to service_role;

-- Atomically skip completed days and repeated/concurrent cron invocations.
create or replace function public.claim_learning_reminder(p_owner text, p_day date)
returns boolean language plpgsql security definer set search_path = public as $$
declare claimed integer;
begin
  insert into owner_learning_days(owner_email, learning_date, reminder_claimed_at)
  values (p_owner, p_day, now())
  on conflict (owner_email, learning_date) do update
    set reminder_claimed_at = now()
    where owner_learning_days.completed_at is null
      and owner_learning_days.reminder_claimed_at is null;
  get diagnostics claimed = row_count;
  return claimed = 1;
end;
$$;
revoke all on function public.claim_learning_reminder(text, date) from public, anon, authenticated;
grant execute on function public.claim_learning_reminder(text, date) to service_role;
