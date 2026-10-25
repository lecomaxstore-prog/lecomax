# Restore error ledger ? 18 October 2026

All 36 errors from the original unfiltered local restore are listed below. No application-table or application-schema failure was found in this error set. Infrastructure omissions can still affect scheduled automation, secrets and hosted services; they are not a full-recovery success.

| # | Category | Failed operation |
| --- | --- | --- |
| 1 | pg_cron | CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog; |
| 2 | pg_cron | COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL'; |
| 3 | pg_net | CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions; |
| 4 | pg_net | COMMENT ON EXTENSION pg_net IS 'Async HTTP'; |
| 5 | vault | CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault; |
| 6 | vault | COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension'; |
| 7 | pg_cron | COPY cron.job (jobid, schedule, command, nodename, nodeport, database, username, active, jobname) FROM stdin; |
| 8 | pg_cron | COPY cron.job_run_details (jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time) FROM stdin; |
| 9 | vault | COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin; |
| 10 | pg_cron | SELECT pg_catalog.setval('cron.jobid_seq', 1, true); |
| 11 | pg_cron | SELECT pg_catalog.setval('cron.runid_seq', 17471, true); |
| 12 | pg_cron | GRANT USAGE ON SCHEMA cron TO postgres WITH GRANT OPTION; |
| 13 | pg_net | GRANT USAGE ON SCHEMA net TO supabase_functions_admin; |
| 14 | pg_cron | GRANT ALL ON FUNCTION cron.alter_job(job_id bigint, schedule text, command text, database text, username text, active boolean) TO postgres WITH GRANT OPTION; |
| 15 | pg_cron | GRANT ALL ON FUNCTION cron.job_cache_invalidate() TO postgres WITH GRANT OPTION; |
| 16 | pg_cron | GRANT ALL ON FUNCTION cron.schedule(schedule text, command text) TO postgres WITH GRANT OPTION; |
| 17 | pg_cron | GRANT ALL ON FUNCTION cron.schedule(job_name text, schedule text, command text) TO postgres WITH GRANT OPTION; |
| 18 | pg_cron | GRANT ALL ON FUNCTION cron.schedule_in_database(job_name text, schedule text, command text, database text, username text, active boolean) TO postgres WITH GRANT OPTION; |
| 19 | pg_cron | GRANT ALL ON FUNCTION cron.unschedule(job_id bigint) TO postgres WITH GRANT OPTION; |
| 20 | pg_cron | GRANT ALL ON FUNCTION cron.unschedule(job_name text) TO postgres WITH GRANT OPTION; |
| 21 | vault | GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION; |
| 22 | vault | GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION; |
| 23 | vault | GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION; |
| 24 | pg_cron | GRANT SELECT ON TABLE cron.job TO postgres WITH GRANT OPTION; |
| 25 | pg_cron | GRANT SELECT,INSERT,REFERENCES,DELETE,TRUNCATE,MAINTAIN,UPDATE ON TABLE cron.job_run_details TO postgres WITH GRANT OPTION; |
| 26 | vault | GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION; |
| 27 | vault | GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION; |
| 28 | pg_cron | ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA cron GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION; |
| 29 | pg_cron | ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA cron GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION; |
| 30 | pg_cron | ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA cron GRANT ALL ON TABLES TO postgres WITH GRANT OPTION; |
| 31 | event-trigger-ownership | ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin; |
| 32 | event-trigger-ownership | ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin; |
| 33 | event-trigger-ownership | ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin; |
| 34 | event-trigger-ownership | ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin; |
| 35 | event-trigger-ownership | ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin; |
| 36 | event-trigger-ownership | ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin; |
