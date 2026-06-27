/**
 * One-time migration: Add image_url column to reviews table
 *
 * Usage:
 *   1. Find your Supabase DB password:
 *      Supabase Dashboard → Settings (bottom left) → Database → "Database password" (or use "Reset database password" to reveal it)
 *
 *   2. Run this script with your password as env var (password stays local, never sent to AI):
 *      $env:DB_PASS="your-password-here"; node scripts/add-image-url-column.mjs
 *
 *   3. You can delete this script afterwards.
 */

import pg from 'pg';

const { Client } = pg;

const pass = process.env.DB_PASS;
if (!pass) {
  console.error('❌  Set DB_PASS env var first:');
  console.error('   $env:DB_PASS="your-password-here"; node scripts/add-image-url-column.mjs');
  process.exit(1);
}

const client = new Client({
  host: 'db.yddqwgdgeljkzfsmtein.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: pass,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('✅  Connected to Supabase database');

  await client.query('ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS image_url TEXT;');
  console.log('✅  image_url column added to reviews table (or already existed)');

  // Verify
  const { rows } = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'image_url';
  `);
  if (rows.length > 0) {
    console.log('✅  Confirmed: column exists —', rows[0]);
  }
} catch (err) {
  console.error('❌  Error:', err.message);
} finally {
  await client.end();
}
