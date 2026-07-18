-- The original user_points migration enabled RLS but did not grant table
-- privileges to the server role, causing points reads and writes to fail.
grant select, insert, update, delete on table public.user_points to service_role;
