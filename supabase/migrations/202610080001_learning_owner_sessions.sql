-- Run with a backend database role. No tables are exposed through the public Data API.
CREATE SCHEMA IF NOT EXISTS learning_private;
REVOKE ALL ON SCHEMA learning_private FROM PUBLIC;
CREATE TABLE IF NOT EXISTS learning_private.sessions (
 id uuid PRIMARY KEY, credential_version text NOT NULL, device text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), last_seen timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL, revoked_at timestamptz, remembered boolean NOT NULL,
 access_hash text NOT NULL UNIQUE, access_expires timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS learning_private.tokens (
 hash text PRIMARY KEY, session_id uuid NOT NULL REFERENCES learning_private.sessions(id) ON DELETE CASCADE,
 used_at timestamptz
);
CREATE TABLE IF NOT EXISTS learning_private.challenges (
 hash text PRIMARY KEY, credential_version text NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS learning_private.throttle (
 key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS learning_tokens_session ON learning_private.tokens(session_id);
REVOKE ALL ON ALL TABLES IN SCHEMA learning_private FROM PUBLIC;
