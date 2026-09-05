import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (new URL(url).hostname !== 'yddqwgdgeljkzfsmtein.supabase.co') throw new Error('Unexpected Supabase project');
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const name = 'support-private';
const { data } = await db.storage.getBucket(name);
if (data) {
  if (data.public) throw new Error('Support bucket must be private');
  console.log('Private support bucket already exists.');
} else {
  const { error } = await db.storage.createBucket(name, { public: false, fileSizeLimit: 3 * 1024 * 1024, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] });
  if (error) throw error;
  console.log('Created private support storage in lecomaxstore.');
}
