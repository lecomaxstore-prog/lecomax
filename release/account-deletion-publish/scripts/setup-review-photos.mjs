import { createClient } from '@supabase/supabase-js';
import { serviceRoleKey, supabaseUrl } from './supabase-admin-env.mjs';

const sb = createClient(
  supabaseUrl,
  serviceRoleKey
);

// 1. Add image_url column via direct SQL (using REST API)
const sqlRes = await fetch(
  `${supabaseUrl}/rest/v1/rpc/exec_sql`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ sql: 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;' }),
  }
);
console.log('SQL status:', sqlRes.status, await sqlRes.text());

// 2. Create storage bucket
const { data: bucket, error: bucketErr } = await sb.storage.createBucket('review-photos', {
  public: true,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  fileSizeLimit: 5242880, // 5MB
});
if (bucketErr) {
  console.log('Bucket result:', bucketErr.message);
} else {
  console.log('Bucket created:', bucket);
}
