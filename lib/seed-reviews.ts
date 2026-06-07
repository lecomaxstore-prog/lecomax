/**
 * Seed reviews — realistic, product-specific comments shown on product pages
 * when no real DB reviews exist yet.
 *
 * Count per product matches ratingFor(slug).count (2 + (h % 5)).
 *   c-baasploa-course-homme        → 5 reviews, target 4.9
 *   a-sac-bandouliere-antivol-code → 5 reviews, target 4.4
 *   a-sac-banane-pu-polyvalent     → 6 reviews, target 4.7
 *   a-lenovo-k3-pro-enceinte       → 2 reviews, target 4.8
 *   a-manette-sans-fil-rgb-v2      → 2 reviews, target 4.8
 *   a-genai-tws-hd                 → 5 reviews, target 4.7
 */
export type SeedReview = {
  id: string;
  author_name: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string;
  color: string | null;
  created_at: string;
};

const SEED_REVIEWS: Record<string, SeedReview[]> = {

  /* ── Baasploa Running Sneakers ── */
  "c-baasploa-course-homme": [
    {
      id: "seed-1-1",
      author_name: "Hamza R.",
      city: "Casablanca",
      rating: 5,
      title: "Légères et très respirantes",
      body: "Je les utilise pour mes joggings matinaux depuis 3 semaines et je suis vraiment satisfait. Le mesh laisse bien passer l'air, les pieds ne chauffent pas du tout. Semelle très confortable dès le premier port.",
      color: "Jaune",
      created_at: "2026-05-22T10:14:00.000Z",
    },
    {
      id: "seed-1-2",
      author_name: "Yassine B.",
      city: "Rabat",
      rating: 5,
      title: "Top qualité pour le prix",
      body: "Franchement incroyable rapport qualité/prix. La semelle amortit bien les chocs, l'adhérence est excellente sur route comme sur piste. Je les recommande à tous les coureurs amateurs.",
      color: "Bleu",
      created_at: "2026-05-14T08:45:00.000Z",
    },
    {
      id: "seed-1-3",
      author_name: "Othmane A.",
      city: "Fès",
      rating: 5,
      title: "Conforme aux photos",
      body: "Livraison en 2 jours, emballage soigné. Les chaussures sont exactement comme sur les photos. La couleur jaune est vraiment belle. Je les porte aussi bien pour le sport que pour les sorties décontractées.",
      color: "Jaune",
      created_at: "2026-05-05T15:20:00.000Z",
    },
    {
      id: "seed-1-4",
      author_name: "Khalil M.",
      city: "Marrakech",
      rating: 5,
      title: "Très bon amorti",
      body: "J'ai couru 10 km avec ces baskets la semaine dernière, zéro douleur aux pieds. L'amorti est vraiment au rendez-vous. Le système de laçage tient bien. Je vais en commander une autre paire.",
      color: "Gris",
      created_at: "2026-04-28T12:00:00.000Z",
    },
    {
      id: "seed-1-5",
      author_name: "Saad L.",
      city: "Tanger",
      rating: 4,
      title: "Bien, prendre une pointure en dessous",
      body: "Très bonnes chaussures, légères et confortables. Seul petit bémol : elles taillent légèrement grand, j'aurais dû prendre une taille en dessous. Le service client m'a bien conseillé après coup.",
      color: "Bleu",
      created_at: "2026-04-18T09:30:00.000Z",
    },
  ],

  /* ── Sac Bandoulière Anti-Vol ── */
  "a-sac-bandouliere-antivol-code": [
    {
      id: "seed-2-1",
      author_name: "Mehdi B.",
      city: "Casablanca",
      rating: 5,
      title: "Verrou à code très efficace",
      body: "J'utilise ce sac pour mes déplacements en moto et en transport en commun. Le verrou à code à 3 chiffres est vraiment rassurant, impossible d'ouvrir discrètement. Finitions dorées très élégantes.",
      color: "Noir",
      created_at: "2026-05-30T11:00:00.000Z",
    },
    {
      id: "seed-2-2",
      author_name: "Amine K.",
      city: "Marrakech",
      rating: 5,
      title: "Sac solide et bien compartimenté",
      body: "Tissu résistant, zippers bien lisses, sangle réglable de qualité. J'y mets mon téléphone, mon portefeuille, mes écouteurs et il reste discret. Rapport qualité/prix imbattable.",
      color: "Noir",
      created_at: "2026-05-18T14:30:00.000Z",
    },
    {
      id: "seed-2-3",
      author_name: "Ismail F.",
      city: "Agadir",
      rating: 4,
      title: "Bonne qualité, port USB pratique",
      body: "Le port USB intégré est très pratique pour charger son téléphone en déplacement. La technologie anti-RFID donne une bonne tranquillité d'esprit. La bandoulière est bien rembourrée.",
      color: "Noir",
      created_at: "2026-05-08T09:15:00.000Z",
    },
    {
      id: "seed-2-4",
      author_name: "Tarik H.",
      city: "Rabat",
      rating: 4,
      title: "Idéal pour les voyages",
      body: "Je l'ai emmené lors d'un voyage à Marrakech, très pratique pour garder mes affaires en sécurité dans les souks. Les finitions dorées font très classe. Je recommande.",
      color: "Noir",
      created_at: "2026-04-25T16:40:00.000Z",
    },
    {
      id: "seed-2-5",
      author_name: "Younes S.",
      city: "Oujda",
      rating: 4,
      title: "Bon rapport qualité/prix",
      body: "Sac anti-vol bien conçu, le code à 3 chiffres est simple à configurer. Taille parfaite pour les essentiels. Livraison rapide depuis L'ecomax, je n'hésiterai pas à recommander.",
      color: "Noir",
      created_at: "2026-04-12T10:20:00.000Z",
    },
  ],

  /* ── Sac Banane PU Polyvalent ── */
  "a-sac-banane-pu-polyvalent": [
    {
      id: "seed-3-1",
      author_name: "Zineb M.",
      city: "Casablanca",
      rating: 5,
      title: "4 façons de porter, vraiment polyvalent",
      body: "J'alterne entre le port à la ceinture et en bandoulière selon les occasions. Le matériau PU est de très bonne qualité, ne se raye pas. Parfait pour les sorties shopping et les week-ends.",
      color: "Noir",
      created_at: "2026-05-28T13:00:00.000Z",
    },
    {
      id: "seed-3-2",
      author_name: "Salma B.",
      city: "Rabat",
      rating: 5,
      title: "Fermeture éclair ultra-lisse",
      body: "La fermeture éclair glisse parfaitement, pas d'accroc. Les deux compartiments principaux sont bien dimensionnés. Je le porte en bandoulière croisée et ça tient très bien. Couleur grise très classe.",
      color: "Gris",
      created_at: "2026-05-15T10:30:00.000Z",
    },
    {
      id: "seed-3-3",
      author_name: "Hind A.",
      city: "Fès",
      rating: 5,
      title: "Parfait pour les voyages",
      body: "Léger, compact, sécurisé. J'ai fait tout le voyage de Fès à Casablanca avec. Je mets mon téléphone, mes espèces, mes clés et mes écouteurs sans problème. Livraison en 48h chrono.",
      color: "Noir",
      created_at: "2026-05-04T08:50:00.000Z",
    },
    {
      id: "seed-3-4",
      author_name: "Kawtar N.",
      city: "Agadir",
      rating: 5,
      title: "Très bon achat",
      body: "Je ne pensais pas qu'un sac banane pouvait être aussi pratique. Le fait de pouvoir le porter de 4 façons différentes change vraiment la mise. Le PU ne se déforme pas même quand il est plein.",
      color: "Noir",
      created_at: "2026-04-22T15:10:00.000Z",
    },
    {
      id: "seed-3-5",
      author_name: "Rim E.",
      city: "Meknès",
      rating: 4,
      title: "Bonne qualité construction",
      body: "Solide et bien cousu. Le dos en maille respirante est apprécié quand on le porte à la taille. Seul bémol : j'aurais aimé un deuxième coloris avec plus d'éclat. Sinon très satisfaite.",
      color: "Gris",
      created_at: "2026-04-10T11:30:00.000Z",
    },
    {
      id: "seed-3-6",
      author_name: "Nora T.",
      city: "Marrakech",
      rating: 4,
      title: "Conforme à la description",
      body: "Sac reçu en 3 jours, emballé soigneusement. Le PU est propre et sans odeur. Les 4 modes de port sont tous fonctionnels. Pratique pour la salle de sport aussi.",
      color: "Noir",
      created_at: "2026-03-30T09:00:00.000Z",
    },
  ],

  /* ── Lenovo K3 PRO Enceinte ── */
  "a-lenovo-k3-pro-enceinte": [
    {
      id: "seed-4-1",
      author_name: "Ayoub D.",
      city: "Casablanca",
      rating: 5,
      title: "Son incroyable pour cette taille",
      body: "Sérieusement je ne m'attendais pas à un son aussi riche et puissant dans un aussi petit boîtier. Les basses sont bien présentes, le stéréo est très large. Je l'utilise pour regarder des films le soir et c'est une autre expérience. La batterie tient toute la journée.",
      color: null,
      created_at: "2026-05-20T18:00:00.000Z",
    },
    {
      id: "seed-4-2",
      author_name: "Imad R.",
      city: "Tanger",
      rating: 5,
      title: "Connexion Bluetooth instantanée",
      body: "Elle se connecte en moins de 3 secondes dès que j'ouvre le Bluetooth. La qualité sonore HiFi stéréo est vraiment au niveau de l'annonce, cinéma à domicile dans un format compact. Très bon achat.",
      color: null,
      created_at: "2026-05-07T14:20:00.000Z",
    },
  ],

  /* ── Manette Sans Fil RGB V2 ── */
  "a-manette-sans-fil-rgb-v2": [
    {
      id: "seed-5-1",
      author_name: "Walid M.",
      city: "Casablanca",
      rating: 5,
      title: "Zéro drift, vraiment aucune dérive",
      body: "J'ai joué plus de 20 heures de jeux d'action (FIFA, Fortnite) et les sticks Hall sont parfaits, aucune dérive constatée. L'éclairage RGB est magnifique et personnalisable. La batterie 1800 mAh tient facilement une longue session. Incompatible Xbox/PS5 comme indiqué, ça correspond parfaitement à mon setup PC/Switch.",
      color: "Noir",
      created_at: "2026-05-25T20:00:00.000Z",
    },
    {
      id: "seed-5-2",
      author_name: "Hicham B.",
      city: "Rabat",
      rating: 5,
      title: "Parfaite sur PC et iOS",
      body: "La compatibilité multi-plateforme est vraiment au rendez-vous. Je switche entre mon PC et mon iPhone sans aucune manipulation complexe. Les gâchettes progressives Hall rendent l'expérience de conduite très précise. Station de charge incluse, c'est un plus.",
      color: "Noir",
      created_at: "2026-05-12T16:30:00.000Z",
    },
  ],

  /* ── GENAI Écouteurs TWS ── */
  "a-genai-tws-hd": [
    {
      id: "seed-6-1",
      author_name: "Anas K.",
      city: "Casablanca",
      rating: 5,
      title: "Son HD cristallin, très impressionné",
      body: "Qualité sonore vraiment épatante pour le prix. Les basses sont équilibrées, les aigus clairs et le son stéréo est large. Je les utilise pour la musique et pour le sport, ils tiennent bien dans les oreilles même en courant.",
      color: "Blanc",
      created_at: "2026-05-26T09:00:00.000Z",
    },
    {
      id: "seed-6-2",
      author_name: "Oussama B.",
      city: "Marrakech",
      rating: 5,
      title: "Connexion automatique au démarrage",
      body: "Dès que j'ouvre le boîtier, les écouteurs se connectent automatiquement à mon téléphone. La connexion Bluetooth est stable, pas de coupure même à 8-9 mètres de distance. L'autonomie totale avec le boîtier dépasse largement ce que j'espérais.",
      color: "Noir",
      created_at: "2026-05-13T11:45:00.000Z",
    },
    {
      id: "seed-6-3",
      author_name: "Zakaria H.",
      city: "Agadir",
      rating: 5,
      title: "Boîtier compact et super pratique",
      body: "Le boîtier de charge tient dans la poche, c'est parfait pour les déplacements. Le contrôle tactile fonctionne très bien, j'appuie une fois pour pause, deux fois pour skip. Très satisfait de cet achat.",
      color: "Blanc",
      created_at: "2026-05-01T08:10:00.000Z",
    },
    {
      id: "seed-6-4",
      author_name: "Rachid N.",
      city: "Rabat",
      rating: 4,
      title: "Bon pour les appels aussi",
      body: "La qualité sonore pour écouter de la musique est très bonne. Le microphone est correct pour les appels, la voix est claire et mes interlocuteurs comprennent bien. Seul bémol mineur : le fit dans l'oreille droite est légèrement moins stable.",
      color: "Noir",
      created_at: "2026-04-19T15:20:00.000Z",
    },
    {
      id: "seed-6-5",
      author_name: "Youssef L.",
      city: "Tanger",
      rating: 5,
      title: "Confortables même sur longue durée",
      body: "Je les porte facilement 4-5 heures sans inconfort. La conception est bien pensée pour les oreilles de différentes tailles. Le son est vraiment HD comme annoncé. Je les recommande à tous les sportifs.",
      color: "Blanc",
      created_at: "2026-04-05T13:00:00.000Z",
    },
  ],
  /* ── Valise Anti-Vol Extensible 60L ── */
  "a-valise-voyage-antivol-extensible-60l": [
    {
      id: "seed-7-1",
      author_name: "Karim B.",
      city: "Casablanca",
      rating: 5,
      title: "Parfaite pour les longs voyages",
      body: "J'ai utilisé cette valise pour un voyage de 10 jours en Espagne. Le système extensible est vraiment pratique au retour quand on ramène des affaires. Les roulettes 360° glissent sans effort même chargée. La serrure TSA donne une vraie tranquillité d'esprit à l'aéroport.",
      color: "Noir",
      created_at: "2026-06-01T09:30:00.000Z",
    },
    {
      id: "seed-7-2",
      author_name: "Nadia E.",
      city: "Rabat",
      rating: 5,
      title: "Robuste et bien organisée",
      body: "La coque ABS résiste très bien aux chocs, j'ai vu ma valise prise en soute sans aucune rayure. L'intérieur avec les sangles et les poches est très bien pensé. Les 60L suffisent amplement pour un déplacement de 2 semaines.",
      color: "Noir",
      created_at: "2026-05-22T14:00:00.000Z",
    },
    {
      id: "seed-7-3",
      author_name: "Anas M.",
      city: "Agadir",
      rating: 4,
      title: "Bonne valise, livraison rapide",
      body: "Livraison en 3 jours, emballage sécurisé. La valise est solide et élégante. Le mécanisme d'extension fonctionne bien et ajoute un bon volume supplémentaire. La poignée télescopique est stable. Je recommande.",
      color: "Noir",
      created_at: "2026-05-10T11:00:00.000Z",
    },
  ],

  /* ── Sac à Dos Voyage Compression Sous Vide 43cm ── */
  "a-sac-dos-voyage-compression-sous-vide-43cm": [
    {
      id: "seed-8-1",
      author_name: "Yassine K.",
      city: "Casablanca",
      rating: 5,
      title: "La compression sous vide, une révolution",
      body: "Je pars souvent en weekend avec beaucoup d'affaires et ce sac m'a changé la vie. La poche à compression sous vide permet d'emporter 2x plus de vêtements dans la même place. Le sac à dos est à la fois esthétique et ultra fonctionnel. Qualité au rendez-vous.",
      color: "Gris",
      created_at: "2026-06-03T10:00:00.000Z",
    },
    {
      id: "seed-8-2",
      author_name: "Zineb A.",
      city: "Marrakech",
      rating: 5,
      title: "Parfait école + voyage",
      body: "Je l'utilise d'abord comme sac à dos école avec mon laptop 15 pouces qui rentre parfaitement. Pour les déplacements j'active la poche sous vide et j'optimise l'espace. Les bretelles rembourrées sont vraiment confortables même portées longtemps.",
      color: "Gris",
      created_at: "2026-05-28T15:30:00.000Z",
    },
    {
      id: "seed-8-3",
      author_name: "Mohamed L.",
      city: "Tanger",
      rating: 5,
      title: "Grande capacité, petit encombrement",
      body: "43 cm de hauteur et pourtant il rentre en cabine avion sans problème. J'ai voyagé Tanger-Paris avec lui, pas de soute, tout dans le sac. La poche de compression tient bien fermée même avec beaucoup d'affaires dedans.",
      color: "Gris",
      created_at: "2026-05-18T08:45:00.000Z",
    },
    {
      id: "seed-8-4",
      author_name: "Soukaina B.",
      city: "Fès",
      rating: 5,
      title: "Élégant et très bien conçu",
      body: "Le design est sobre et élégant, ce sac passe aussi bien au bureau qu'en randonnée. Les multiples compartiments permettent d'organiser ses affaires facilement. La qualité des zippers est excellente. Très satisfaite de mon achat.",
      color: "Gris",
      created_at: "2026-05-08T12:00:00.000Z",
    },
    {
      id: "seed-8-5",
      author_name: "Driss M.",
      city: "Meknès",
      rating: 5,
      title: "Idéal pour les déplacements business",
      body: "En déplacement professionnel chaque semaine, ce sac est devenu mon compagnon indispensable. Il accueille mon laptop, mes dossiers, et mes vêtements pour 2 jours grâce à la compression. Look professionnel et fonctionnalité au top.",
      color: "Gris",
      created_at: "2026-04-25T09:00:00.000Z",
    },
    {
      id: "seed-8-6",
      author_name: "Amira H.",
      city: "Rabat",
      rating: 4,
      title: "Très bon sac, la poche sous vide est utile",
      body: "La poche à compression sous vide fonctionne vraiment bien pour les vêtements. Le sac est solide et léger. Seul petit bémol, la fermeture du compartiment avant est un peu rigide au début, mais ça se détend avec l'usage. Globalement très satisfaite.",
      color: "Gris",
      created_at: "2026-04-12T16:20:00.000Z",
    },
  ],

};

export default SEED_REVIEWS;
