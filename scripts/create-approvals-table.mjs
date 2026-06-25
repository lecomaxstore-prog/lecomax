// Run this in your Supabase SQL Editor to create the pending_changes table

/*
-- ─── COPY THIS SQL INTO SUPABASE SQL EDITOR ──────────────────────────────────

CREATE TABLE IF NOT EXISTS pending_changes (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_email     text          NOT NULL,
  staff_name      text,
  action          text          NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type     text          NOT NULL,  -- 'product', 'banner', 'announcement', 'promotion', 'page', 'category', 'coupon', 'other'
  entity_id       text,                    -- for update / delete
  description     text          NOT NULL,
  payload         jsonb,                   -- full data to auto-apply
  api_endpoint    text,                    -- e.g. '/api/admin/products'
  api_method      text,                    -- 'POST', 'PUT', 'PATCH', 'DELETE'
  preview_image   text,                    -- URL for thumbnail preview
  status          text          DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by     text,
  reviewed_at     timestamptz,
  created_at      timestamptz   DEFAULT now()
);

-- Enable RLS (service role bypasses it)
ALTER TABLE pending_changes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (all admin API routes use service role)
CREATE POLICY "service_role_all" ON pending_changes
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast status filtering
CREATE INDEX IF NOT EXISTS idx_pending_changes_status ON pending_changes(status);
CREATE INDEX IF NOT EXISTS idx_pending_changes_staff  ON pending_changes(staff_email);
CREATE INDEX IF NOT EXISTS idx_pending_changes_created ON pending_changes(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
*/

console.log("Copy the SQL comment above into your Supabase SQL Editor and run it.");
