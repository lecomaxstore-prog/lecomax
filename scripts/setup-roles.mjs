// Run: node scripts/setup-roles.mjs
// Copy the SQL output and execute it in your Supabase SQL Editor
// https://supabase.com/dashboard/project/yddqwgdgeljkzfsmtein/sql

const sql = `
-- ═══════════════════════════════════════════════════
-- ROLES & STAFF MANAGEMENT TABLES
-- ═══════════════════════════════════════════════════

-- Roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role permissions (permission slugs per role)
CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id         UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_slug TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_slug)
);

-- Staff members
CREATE TABLE IF NOT EXISTS admin_staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  avatar_url   TEXT,
  role_id      UUID REFERENCES admin_roles(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'suspended')),
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed default roles ────────────────────────────
INSERT INTO admin_roles (name, slug, description, color, is_system) VALUES
  ('Super Admin',           'superadmin',       'Accès complet à toutes les fonctionnalités', '#ef4444', TRUE),
  ('Gestionnaire Produits', 'product-manager',  'Gère le catalogue, catégories et stock',     '#f59e0b', FALSE),
  ('Support Client',        'support',          'Répond aux messages, gère retours et avis',  '#3b82f6', FALSE),
  ('Marketing',             'marketing',        'Gère promotions, newsletters et publicités', '#8b5cf6', FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Super Admin gets all permissions (wildcard)
INSERT INTO admin_role_permissions (role_id, permission_slug)
SELECT id, '*' FROM admin_roles WHERE slug = 'superadmin'
ON CONFLICT DO NOTHING;

-- Product Manager permissions
INSERT INTO admin_role_permissions (role_id, permission_slug)
SELECT r.id, p.slug FROM admin_roles r, (VALUES
  ('products.view'), ('products.create'), ('products.edit'), ('products.delete'),
  ('categories.edit'), ('stock.edit'), ('media.manage'), ('pages.edit'),
  ('banners.edit'), ('studio.access'), ('size-guide.edit'), ('analytics.view')
) AS p(slug) WHERE r.slug = 'product-manager'
ON CONFLICT DO NOTHING;

-- Support permissions
INSERT INTO admin_role_permissions (role_id, permission_slug)
SELECT r.id, p.slug FROM admin_roles r, (VALUES
  ('messages.view'), ('messages.reply'), ('reviews.edit'), ('returns.edit'),
  ('orders.view'), ('customers.view')
) AS p(slug) WHERE r.slug = 'support'
ON CONFLICT DO NOTHING;

-- Marketing permissions
INSERT INTO admin_role_permissions (role_id, permission_slug)
SELECT r.id, p.slug FROM admin_roles r, (VALUES
  ('promotions.edit'), ('newsletter.edit'), ('push.send'), ('ads.edit'),
  ('broadcast.send'), ('announcement.edit'), ('analytics.view'), ('media.manage')
) AS p(slug) WHERE r.slug = 'marketing'
ON CONFLICT DO NOTHING;
-- ── Grant access to service_role ──────────────────
GRANT ALL PRIVILEGES ON TABLE admin_roles TO service_role, postgres, authenticated, anon;
GRANT ALL PRIVILEGES ON TABLE admin_role_permissions TO service_role, postgres, authenticated, anon;
GRANT ALL PRIVILEGES ON TABLE admin_staff TO service_role, postgres, authenticated, anon;
`;

console.log(sql);
console.log('\n-- Copy the SQL above and run it in:');
console.log('-- https://supabase.com/dashboard/project/yddqwgdgeljkzfsmtein/sql');
