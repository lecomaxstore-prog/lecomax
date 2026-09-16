-- Invitation tokens are single-purpose secrets. Active accounts no longer need them.
update public.admin_staff
set invite_token = null
where status = 'active' and invite_token is not null;
