-- Apply with the existing backend database role. No public Data API access.
CREATE SCHEMA IF NOT EXISTS learning_private;
REVOKE ALL ON SCHEMA learning_private FROM PUBLIC;
CREATE SEQUENCE IF NOT EXISTS learning_private.academy_revision AS integer;
REVOKE ALL ON SEQUENCE learning_private.academy_revision FROM PUBLIC;
CREATE TABLE IF NOT EXISTS learning_private.academy_progress (
  owner_id text PRIMARY KEY,
  revision integer NOT NULL CHECK (revision > 0),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON learning_private.academy_progress FROM PUBLIC;
COMMENT ON TABLE learning_private.academy_progress IS
  'Authenticated owner learning snapshot: profile, goals, generated courses, lesson progress, assessments, reviews, notes, sessions and conversation history. Revision checks prevent stale overwrite.';
