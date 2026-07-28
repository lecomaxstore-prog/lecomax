import { createClient } from '@supabase/supabase-js';
import { serviceRoleKey, supabaseUrl } from './supabase-admin-env.mjs';

const sb = createClient(
  supabaseUrl,
  serviceRoleKey
);

const updates = [
  {
    slug: 'c-chaussons-exterieur-poils-femme',
    description: "Chaussons d'extÃ©rieur en peluche pour femme avec cÅ“ur brodÃ© â€” parfaits pour l'automne et l'hiver. Semelle antidÃ©rapante robuste pour une utilisation en extÃ©rieur, revÃªtement intÃ©rieur chaud et moelleux, style tendance avec broderie cÅ“ur dÃ©corative. LÃ©gÃ¨retÃ© et chaleur garanties toute la saison froide.",
  },
  {
    slug: 'c-chaussons-fleurs-rose-femme',
    description: "Chaussons motif fleurs de rose pour femme â€” douceur et fÃ©minitÃ© au quotidien. MatiÃ¨re souple et confortable, semelle Ã©paisse antidÃ©rapante, style fleuri dÃ©licat. Disponibles en gris clair et kaki. Parfaits pour l'intÃ©rieur comme pour de courtes sorties, lÃ©gers et faciles Ã  enfiler.",
  },
  {
    slug: 'c-chaussons-mode-femme-peluche',
    description: "Chaussons de mode en peluche pour femme avec laniÃ¨res croisÃ©es tendance â€” confort et style pour la maison. MatÃ©riau peluche ultra-doux, laniÃ¨res croisÃ©es Ã©lÃ©gantes, couleur unie sobre. Disponibles en kaki et blanc. Semelle Ã©paisse antidÃ©rapante pour un confort optimal au quotidien.",
  },
];

for (const u of updates) {
  const { error } = await sb.from('products').update({ description: u.description }).eq('slug', u.slug);
  if (error) console.error('ERROR', u.slug, error.message);
  else console.log('OK', u.slug);
}
