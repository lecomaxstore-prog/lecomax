import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://yddqwgdgeljkzfsmtein.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZHF3Z2RnZWxqa3pmc210ZWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNDM5MywiZXhwIjoyMDkyODkwMzkzfQ.76uWpxv2hnt665DmOf0xjYnm61Nbot0FWB5Bf9XCTnQ'
);

const updates = [
  {
    slug: 'c-chaussons-exterieur-poils-femme',
    description: "Chaussons d'extérieur en peluche pour femme avec cœur brodé — parfaits pour l'automne et l'hiver. Semelle antidérapante robuste pour une utilisation en extérieur, revêtement intérieur chaud et moelleux, style tendance avec broderie cœur décorative. Légèreté et chaleur garanties toute la saison froide.",
  },
  {
    slug: 'c-chaussons-fleurs-rose-femme',
    description: "Chaussons motif fleurs de rose pour femme — douceur et féminité au quotidien. Matière souple et confortable, semelle épaisse antidérapante, style fleuri délicat. Disponibles en gris clair et kaki. Parfaits pour l'intérieur comme pour de courtes sorties, légers et faciles à enfiler.",
  },
  {
    slug: 'c-chaussons-mode-femme-peluche',
    description: "Chaussons de mode en peluche pour femme avec lanières croisées tendance — confort et style pour la maison. Matériau peluche ultra-doux, lanières croisées élégantes, couleur unie sobre. Disponibles en kaki et blanc. Semelle épaisse antidérapante pour un confort optimal au quotidien.",
  },
];

for (const u of updates) {
  const { error } = await sb.from('products').update({ description: u.description }).eq('slug', u.slug);
  if (error) console.error('ERROR', u.slug, error.message);
  else console.log('OK', u.slug);
}
