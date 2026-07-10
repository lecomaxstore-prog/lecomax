/**
 * Run this script once to create Ecomedia tables in Supabase.
 * Usage: node scripts/create-ecomedia-tables.mjs
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
try {
  const env = readFileSync(join(__dirname, "../.env.local"), "utf-8");
  env.split("\n").forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  });
} catch { /* ignore */ }

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SQL = `
-- ─── ECOMEDIA_POSTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ecomedia_posts (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text          UNIQUE NOT NULL,
  title       text          NOT NULL,
  content     text,
  type        text          NOT NULL DEFAULT 'text',
  -- type: image | video_upload | video_url | text | product | promotion
  media_url   text,
  thumbnail_url text,
  video_url   text,
  product_url text,
  cta_text    text,
  is_published boolean      DEFAULT false,
  is_featured  boolean      DEFAULT false,
  likes_count  integer      DEFAULT 0,
  comments_count integer    DEFAULT 0,
  created_at  timestamptz   DEFAULT now(),
  updated_at  timestamptz   DEFAULT now()
);

-- ─── ECOMEDIA_LIKES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ecomedia_likes (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid          NOT NULL REFERENCES ecomedia_posts(id) ON DELETE CASCADE,
  visitor_id  text          NOT NULL,
  created_at  timestamptz   DEFAULT now(),
  UNIQUE(post_id, visitor_id)
);

-- ─── ECOMEDIA_COMMENTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ecomedia_comments (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid          NOT NULL REFERENCES ecomedia_posts(id) ON DELETE CASCADE,
  name        text          NOT NULL,
  email       text,
  content     text          NOT NULL,
  is_approved boolean       DEFAULT true,
  created_at  timestamptz   DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ecomedia_posts_published ON ecomedia_posts(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ecomedia_posts_slug ON ecomedia_posts(slug);
CREATE INDEX IF NOT EXISTS idx_ecomedia_likes_post ON ecomedia_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_ecomedia_comments_post ON ecomedia_comments(post_id, is_approved);

-- ─── FUNCTION: auto-update likes_count ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ecomedia_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ecomedia_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ecomedia_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecomedia_likes ON ecomedia_likes;
CREATE TRIGGER trigger_ecomedia_likes
AFTER INSERT OR DELETE ON ecomedia_likes
FOR EACH ROW EXECUTE FUNCTION update_ecomedia_likes_count();

-- ─── FUNCTION: auto-update comments_count ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ecomedia_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_approved THEN
    UPDATE ecomedia_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_approved THEN
    UPDATE ecomedia_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ecomedia_comments ON ecomedia_comments;
CREATE TRIGGER trigger_ecomedia_comments
AFTER INSERT OR DELETE ON ecomedia_comments
FOR EACH ROW EXECUTE FUNCTION update_ecomedia_comments_count();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE ecomedia_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomedia_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomedia_comments ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
DROP POLICY IF EXISTS "ecomedia_posts_public_read" ON ecomedia_posts;
CREATE POLICY "ecomedia_posts_public_read" ON ecomedia_posts
  FOR SELECT USING (is_published = true);

-- Public can read approved comments
DROP POLICY IF EXISTS "ecomedia_comments_public_read" ON ecomedia_comments;
CREATE POLICY "ecomedia_comments_public_read" ON ecomedia_comments
  FOR SELECT USING (is_approved = true);

-- Public can read likes
DROP POLICY IF EXISTS "ecomedia_likes_public_read" ON ecomedia_likes;
CREATE POLICY "ecomedia_likes_public_read" ON ecomedia_likes
  FOR SELECT USING (true);
`;

async function run() {
  console.log("Creating Ecomedia tables...");
  const { error } = await sb.rpc("exec_sql", { sql: SQL }).catch(() => ({ error: null }));
  
  // Try direct via REST if rpc fails
  // The service_role bypasses RLS so we can run DDL via the JavaScript client
  // Actually, Supabase JS client doesn't support raw DDL — you must run this in SQL Editor
  console.log("⚠️  Please run the SQL below in Supabase Dashboard → SQL Editor:");
  console.log("─".repeat(60));
  console.log(SQL);
  console.log("─".repeat(60));
  console.log("Then create the 'ecomedia' storage bucket:");
  console.log("  Supabase Dashboard → Storage → New Bucket → 'ecomedia' → Public");
}

run();
