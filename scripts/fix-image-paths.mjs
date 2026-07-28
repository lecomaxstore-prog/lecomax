import { createClient } from '@supabase/supabase-js';
import { serviceRoleKey, supabaseUrl } from './supabase-admin-env.mjs';
const sb = createClient(
  supabaseUrl,
  serviceRoleKey
);

const sacImages = [1,2,3,4,5,6].map(n => `/images/products/sac-dos-voyage/${n}.avif`);
const sacDescImages = [1,2,3,4,5,6,7,8,9].map(n => `/images/products/sac-dos-voyage/desc/${n}.avif`);

const valiseImages = [1,2,3,4,5,6].map(n => `/images/products/valise-60l/${n}.avif`);
const valiseDescImages = [1,2,3,4].map(n => `/images/products/valise-60l/desc/${n}.avif`);

const r1 = await sb.from('products').update({ images: sacImages, description_images: sacDescImages }).eq('slug', 'a-sac-dos-voyage-compression-sous-vide-43cm');
const r2 = await sb.from('products').update({ images: valiseImages, description_images: valiseDescImages }).eq('slug', 'a-valise-voyage-antivol-extensible-60l');

console.log('Sac:', r1.error?.message ?? 'OK');
console.log('Valise:', r2.error?.message ?? 'OK');

const { data } = await sb.from('products').select('slug,images').in('slug', ['a-sac-dos-voyage-compression-sous-vide-43cm','a-valise-voyage-antivol-extensible-60l']);
console.log(JSON.stringify(data, null, 2));
