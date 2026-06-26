import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://yddqwgdgeljkzfsmtein.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZHF3Z2RnZWxqa3pmc210ZWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNDM5MywiZXhwIjoyMDkyODkwMzkzfQ.76uWpxv2hnt665DmOf0xjYnm61Nbot0FWB5Bf9XCTnQ'
);

// 1. Add image_url column via direct SQL (using REST API)
const sqlRes = await fetch(
  'https://yddqwgdgeljkzfsmtein.supabase.co/rest/v1/rpc/exec_sql',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZHF3Z2RnZWxqa3pmc210ZWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNDM5MywiZXhwIjoyMDkyODkwMzkzfQ.76uWpxv2hnt665DmOf0xjYnm61Nbot0FWB5Bf9XCTnQ',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZHF3Z2RnZWxqa3pmc210ZWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNDM5MywiZXhwIjoyMDkyODkwMzkzfQ.76uWpxv2hnt665DmOf0xjYnm61Nbot0FWB5Bf9XCTnQ',
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
