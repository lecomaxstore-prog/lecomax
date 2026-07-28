import { createClient } from '@supabase/supabase-js';
import { serviceRoleKey, supabaseUrl } from './supabase-admin-env.mjs';
const sb = createClient(supabaseUrl, serviceRoleKey);

const { data } = await sb.from('products').select('slug,name').in('slug', ['a-sac-dos-voyage-compression-sous-vide-43cm','a-valise-voyage-antivol-extensible-60l']);
console.log(JSON.stringify(data, null, 2));

// Update with proper short names
const r1 = await sb.from('products').update({ name: 'Sac \u00e0 Dos Voyage Sous Vide 43cm' }).eq('slug', 'a-sac-dos-voyage-compression-sous-vide-43cm');
const r2 = await sb.from('products').update({ name: 'Valise Anti-Vol Extensible 60L avec Sac \u00e0 Dos' }).eq('slug', 'a-valise-voyage-antivol-extensible-60l');
console.log('Update 1:', r1.error?.message ?? 'OK');
console.log('Update 2:', r2.error?.message ?? 'OK');

// Verify
const { data: after } = await sb.from('products').select('slug,name').in('slug', ['a-sac-dos-voyage-compression-sous-vide-43cm','a-valise-voyage-antivol-extensible-60l']);
console.log('After:', JSON.stringify(after, null, 2));
