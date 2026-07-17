export type EcomediaGuide = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  relatedLinks: Array<{
    href: string;
    label: string;
    description: string;
  }>;
  faqs: Array<{ question: string; answer: string }>;
};

export const ecomediaGuides: EcomediaGuide[] = [
  {
    slug: "choisir-chaussures-running-maroc",
    title: "Comment choisir des chaussures de running au Maroc",
    description: "Amorti, respirabilité, pointure et terrain : les critères essentiels pour choisir des chaussures de running adaptées au climat et aux routes du Maroc.",
    eyebrow: "Guide running Maroc",
    readingMinutes: 7,
    publishedAt: "2026-07-17T08:00:00.000Z",
    updatedAt: "2026-07-17T08:00:00.000Z",
    sections: [
      {
        heading: "Commencer par votre usage réel",
        paragraphs: [
          "Une bonne chaussure de running n’est pas simplement une basket légère. Elle doit correspondre à votre fréquence de course, à la distance parcourue et au terrain. Pour deux sorties tranquilles par semaine, le confort et la stabilité sont prioritaires. Pour des séances plus rapides, le poids et le dynamisme deviennent plus importants.",
          "Au Maroc, beaucoup de coureurs alternent trottoirs, routes sèches, pistes et chemins poussiéreux. Une semelle extérieure résistante avec une adhérence régulière est donc plus polyvalente qu’une semelle très lisse conçue uniquement pour une piste propre.",
        ],
        bullets: [
          "Marche et usage quotidien : confort, souplesse et maintien.",
          "Running sur route : amorti équilibré et semelle durable.",
          "Chemins et pistes : adhérence renforcée et tige protectrice.",
          "Séances rapides : chaussure légère avec une bonne relance.",
        ],
      },
      {
        heading: "Privilégier la respirabilité",
        paragraphs: [
          "La chaleur augmente rapidement la température du pied. Une tige en mesh respirant aide à évacuer l’humidité et réduit les frottements pendant les sorties longues. Vérifiez toutefois que le tissu maintient correctement le milieu du pied : une chaussure très aérée mais trop lâche peut manquer de stabilité.",
          "Des chaussettes techniques fines complètent le travail de la chaussure. Évitez le coton épais pour courir, car il conserve davantage l’humidité et peut favoriser les ampoules.",
        ],
      },
      {
        heading: "Trouver la bonne pointure",
        paragraphs: [
          "Le pied gonfle légèrement pendant l’effort. Il est conseillé de conserver environ la largeur d’un pouce entre l’orteil le plus long et l’avant de la chaussure. Le talon doit rester stable sans être comprimé, et les orteils doivent pouvoir bouger naturellement.",
          "Mesurez vos deux pieds en fin de journée et retenez la mesure du pied le plus long. Si vous êtes entre deux pointures, consultez le guide du modèle et privilégiez généralement la demi-pointure supérieure pour le running.",
        ],
      },
      {
        heading: "Amorti, stabilité et poids",
        paragraphs: [
          "Un amorti généreux apporte du confort, mais il ne doit pas rendre la foulée instable. Les débutants et les coureurs recherchant une chaussure quotidienne bénéficient souvent d’une base assez large et d’une mousse souple mais contrôlée. Une chaussure plus légère paraît plus rapide, mais peut offrir moins de protection sur les longues distances.",
          "Essayez toujours les deux chaussures, marchez quelques minutes et vérifiez qu’aucun point de pression n’apparaît sur les côtés, le talon ou le dessus du pied.",
        ],
      },
      {
        heading: "La checklist avant d’acheter",
        paragraphs: [
          "Choisissez d’abord selon votre pratique, puis selon le style. Une couleur attrayante ne compense pas une mauvaise pointure ou un maintien insuffisant. Contrôlez enfin les conditions de retour afin de pouvoir essayer la paire chez vous sur une surface propre.",
        ],
        bullets: [
          "Usage et terrain clairement définis.",
          "Espace suffisant devant les orteils.",
          "Talon maintenu sans glissement.",
          "Mesh respirant adapté aux températures élevées.",
          "Semelle offrant adhérence et résistance.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/produit/c-baasploa-course-homme/", label: "Baskets de running Baasploa", description: "Modèle respirant et léger pour homme." },
      { href: "/chaussures/", label: "Toutes les chaussures", description: "Comparer les modèles disponibles sur L’ecomax." },
      { href: "/guide-des-tailles/", label: "Guide des tailles", description: "Mesurer votre pied avant de commander." },
    ],
    faqs: [
      { question: "Faut-il prendre une pointure au-dessus pour courir ?", answer: "Il faut surtout conserver un espace devant les orteils. Selon le modèle et vos mesures, cela peut correspondre à une demi-pointure ou une pointure supérieure." },
      { question: "Quelle chaussure choisir pour courir par temps chaud ?", answer: "Privilégiez une tige en mesh respirant, des chaussettes techniques et un maintien stable du milieu du pied." },
      { question: "Une chaussure très amortie est-elle toujours meilleure ?", answer: "Non. L’amorti doit rester stable et correspondre à votre poids, votre foulée, vos distances et votre terrain." },
    ],
  },
  {
    slug: "comparatif-ecouteurs-bluetooth-lenovo",
    title: "Comparatif des écouteurs Bluetooth Lenovo : GM2 Pro ou LP40 Pro ?",
    description: "Comparaison claire des Lenovo GM2 Pro et LP40 Pro pour la musique, les appels, le sport et le gaming au quotidien.",
    eyebrow: "Comparatif audio",
    readingMinutes: 6,
    publishedAt: "2026-07-17T08:10:00.000Z",
    updatedAt: "2026-07-17T08:10:00.000Z",
    sections: [
      {
        heading: "Deux écouteurs pour des usages différents",
        paragraphs: [
          "Les Lenovo GM2 Pro et LP40 Pro sont deux écouteurs Bluetooth compacts, mais leur positionnement n’est pas identique. Les GM2 Pro privilégient une présentation plus gaming, une bonne immersion et une latence réduite. Les LP40 Pro adoptent un format plus discret, adapté à la musique, aux appels et aux déplacements quotidiens.",
          "Le meilleur choix dépend donc moins du chiffre inscrit sur la boîte que de votre usage principal : jeu mobile, transport, appels professionnels ou séances de sport.",
        ],
      },
      {
        heading: "Lenovo GM2 Pro : pour le gaming et l’immersion",
        paragraphs: [
          "Les GM2 Pro conviennent aux utilisateurs qui jouent régulièrement sur smartphone ou recherchent un son énergique. Leur format intra-auriculaire améliore l’isolation passive et renforce la sensation d’immersion. Le mode à faible latence est utile pour mieux synchroniser le son avec l’action à l’écran.",
          "Ils sont également adaptés à la musique moderne et aux vidéos. Comme pour tous les écouteurs intra-auriculaires, le choix d’un embout adapté est essentiel pour le confort, les basses et la stabilité.",
        ],
        bullets: ["Gaming mobile et vidéos.", "Bonne isolation passive.", "Maintien intra-auriculaire.", "Signature sonore dynamique."],
      },
      {
        heading: "Lenovo LP40 Pro : pour la mobilité",
        paragraphs: [
          "Les LP40 Pro sont plus sobres et faciles à porter au quotidien. Leur conception semi-intra peut être plus agréable pour les personnes qui n’aiment pas la pression d’un embout en silicone. Ils sont pratiques pour écouter des podcasts, passer des appels et accompagner les trajets.",
          "Un format plus ouvert laisse généralement davantage passer les bruits extérieurs. Cela peut être utile dans la rue, mais moins adapté aux environnements très bruyants.",
        ],
        bullets: ["Musique et podcasts.", "Appels et trajets quotidiens.", "Format léger et discret.", "Utilisation simple au quotidien."],
      },
      {
        heading: "Les critères à vérifier avant de choisir",
        paragraphs: [
          "Vérifiez la compatibilité Bluetooth de votre téléphone, le type de port de charge, la tenue dans vos oreilles et l’autonomie annoncée pour votre rythme d’utilisation. Pour les appels, la qualité dépend aussi du bruit ambiant et de la position des microphones.",
          "Pour le sport, privilégiez avant tout la stabilité. Pour le gaming, la latence est prioritaire. Pour les transports, le confort sur une longue durée et l’isolation deviennent plus importants.",
        ],
      },
      {
        heading: "Notre verdict",
        paragraphs: [
          "Choisissez les Lenovo GM2 Pro si votre priorité est le gaming, l’isolation et un son immersif. Choisissez les Lenovo LP40 Pro si vous recherchez des écouteurs légers pour la musique, les appels et les déplacements. Aucun modèle n’est universel : le bon choix est celui qui correspond à vos habitudes.",
        ],
      },
    ],
    relatedLinks: [
      { href: "/produit/a-lenovo-gm2-pro-ecouteurs/", label: "Lenovo GM2 Pro", description: "Écouteurs Bluetooth orientés gaming." },
      { href: "/produit/a-lenovo-lp40-pro-ecouteurs/", label: "Lenovo LP40 Pro", description: "Écouteurs légers pour le quotidien." },
      { href: "/produit/a-lenovo-k3-pro-enceinte/", label: "Enceinte Lenovo K3 Pro", description: "Une alternative pour écouter sans écouteurs." },
    ],
    faqs: [
      { question: "Quels écouteurs Lenovo choisir pour jouer ?", answer: "Les GM2 Pro sont généralement le choix le plus adapté grâce à leur positionnement gaming et leur mode à faible latence." },
      { question: "Quels écouteurs choisir pour les appels ?", answer: "Les LP40 Pro sont pratiques pour un usage quotidien, mais la qualité d’appel dépend toujours du bruit ambiant et du téléphone utilisé." },
      { question: "Les écouteurs Lenovo fonctionnent-ils avec Android et iPhone ?", answer: "Ils utilisent une connexion Bluetooth standard et sont compatibles avec la majorité des appareils Android et iOS équipés du Bluetooth." },
    ],
  },
  {
    slug: "choisir-sac-voyage-week-end",
    title: "Quel sac de voyage choisir pour un week-end ?",
    description: "Volume, organisation, confort et sécurité : choisissez le bon sac pour un week-end, un trajet en train ou un court séjour au Maroc.",
    eyebrow: "Guide voyage",
    readingMinutes: 6,
    publishedAt: "2026-07-17T08:20:00.000Z",
    updatedAt: "2026-07-17T08:20:00.000Z",
    sections: [
      {
        heading: "Choisir le volume selon la durée",
        paragraphs: [
          "Pour un week-end de deux à trois jours, un sac bien organisé de 30 à 45 litres suffit généralement. Il peut contenir deux tenues, une paire de chaussures légère, une trousse de toilette et les accessoires essentiels. Les voyageurs qui transportent du matériel électronique ou des vêtements volumineux peuvent préférer un modèle extensible.",
          "Un sac trop grand encourage à emporter des objets inutiles et devient inconfortable. Un sac trop petit oblige à comprimer les affaires sans organisation. Le bon volume est celui que vous pouvez porter facilement une fois rempli.",
        ],
      },
      {
        heading: "Sac à dos, valise souple ou sac bandoulière",
        paragraphs: [
          "Le sac à dos libère les mains et convient bien aux gares, aux transports urbains et aux rues irrégulières. Une valise souple ou extensible facilite le rangement des vêtements et convient aux trajets où le sac est peu porté. Un petit sac bandoulière complète l’ensemble pour garder téléphone, papiers et argent accessibles.",
        ],
        bullets: [
          "Sac à dos : mobilité et confort de portage.",
          "Valise extensible : capacité et organisation.",
          "Sac bandoulière ou banane : accès rapide aux objets importants.",
        ],
      },
      {
        heading: "L’intérêt de la compression",
        paragraphs: [
          "Un compartiment de compression sous vide réduit le volume des vêtements souples. Il est particulièrement utile pour les vestes légères, pulls et tenues de rechange. Il ne réduit toutefois pas le poids : vérifiez toujours que le sac reste confortable et respecte les limites du transporteur.",
          "Placez les objets lourds près du dos, protégez les appareils électroniques et répartissez les petits accessoires dans des poches dédiées.",
        ],
      },
      {
        heading: "Sécurité et résistance",
        paragraphs: [
          "Pour un trajet fréquent, recherchez des fermetures robustes, des coutures renforcées et un tissu facile à nettoyer. Les poches cachées ou les fermetures pouvant recevoir un cadenas ajoutent une protection utile dans les zones très fréquentées.",
          "Gardez toujours les documents, médicaments, clés et moyens de paiement dans une poche accessible mais proche du corps. Une protection antivol ne remplace pas une bonne vigilance.",
        ],
      },
      {
        heading: "Checklist d’un week-end bien organisé",
        paragraphs: ["Préparez les tenues complètes avant de remplir le sac. Roulez les vêtements souples, utilisez les petits espaces pour les accessoires et conservez une poche libre pour les objets utilisés pendant le trajet."],
        bullets: ["Deux ou trois tenues coordonnées.", "Trousse de toilette compacte.", "Chargeur et batterie externe.", "Documents et moyens de paiement.", "Petit sac pour les déplacements sur place."],
      },
    ],
    relatedLinks: [
      { href: "/produit/a-sac-dos-voyage-compression-sous-vide-43cm/", label: "Sac à dos de voyage 43 cm", description: "Compression sous vide et format week-end." },
      { href: "/produit/a-valise-voyage-antivol-extensible-60l/", label: "Valise extensible 60 L", description: "Plus de capacité pour les séjours chargés." },
      { href: "/produit/a-sac-banane-pu-polyvalent/", label: "Sac banane polyvalent", description: "Garder les essentiels à portée de main." },
    ],
    faqs: [
      { question: "Quel volume de sac pour un week-end ?", answer: "Un volume d’environ 30 à 45 litres suffit généralement pour deux à trois jours, selon la saison et les affaires transportées." },
      { question: "La compression sous vide réduit-elle le poids ?", answer: "Non. Elle réduit le volume des vêtements, mais leur poids reste identique." },
      { question: "Quel sac choisir pour voyager en train ?", answer: "Un sac à dos confortable ou une valise compacte sont pratiques. Le choix dépend surtout de la distance de marche et du poids transporté." },
    ],
  },
  {
    slug: "guide-tailles-chaussures-femme",
    title: "Guide des tailles pour chaussures femme",
    description: "Mesurez correctement vos pieds, comparez les pointures et choisissez des chaussures ou chaussons femme confortables lors d’un achat en ligne.",
    eyebrow: "Guide des pointures",
    readingMinutes: 5,
    publishedAt: "2026-07-17T08:30:00.000Z",
    updatedAt: "2026-07-17T08:30:00.000Z",
    sections: [
      {
        heading: "Mesurer ses pieds correctement",
        paragraphs: [
          "Posez une feuille contre un mur, placez le talon contre le mur et tenez-vous debout avec votre poids réparti normalement. Marquez l’extrémité de l’orteil le plus long, puis mesurez la distance entre le bord de la feuille et la marque. Répétez l’opération pour l’autre pied.",
          "Effectuez la mesure en fin de journée, lorsque les pieds sont légèrement plus volumineux. Utilisez la mesure du pied le plus long et comparez-la au tableau du produit.",
        ],
      },
      {
        heading: "Pourquoi la pointure varie selon les modèles",
        paragraphs: [
          "Deux chaussures portant la même pointure peuvent offrir des volumes différents. La forme de l’avant-pied, l’épaisseur de la doublure, la matière et le type de semelle influencent le chaussant. Une chaussure pointue paraît souvent plus étroite qu’un chausson arrondi.",
          "Consultez les indications propres au modèle et les avis authentiques lorsqu’ils mentionnent un chaussant petit, normal ou grand.",
        ],
      },
      {
        heading: "Choisir des chaussons femme",
        paragraphs: [
          "Pour des chaussons fourrés, prévoyez la place nécessaire pour la doublure et les chaussettes portées en hiver. Le pied doit être maintenu sans que les orteils touchent l’avant. Sur un modèle ouvert ou à lanières, vérifiez aussi la largeur et la stabilité du talon.",
          "Une semelle intérieure souple améliore le confort, tandis qu’une semelle extérieure antidérapante est importante sur le carrelage et les surfaces lisses.",
        ],
      },
      {
        heading: "Que faire entre deux pointures ?",
        paragraphs: [
          "Si votre mesure se situe entre deux tailles, tenez compte du type de chaussure. Pour un modèle fermé, fourré ou porté avec des chaussettes épaisses, la taille supérieure est souvent plus confortable. Pour un modèle ouvert, vérifiez surtout que le pied ne glisse pas.",
          "Ne choisissez jamais une pointure plus petite en espérant que la chaussure s’allonge fortement. Une matière peut s’assouplir, mais la longueur de la semelle ne change pas.",
        ],
      },
      {
        heading: "Vérifications à la réception",
        paragraphs: ["Essayez les chaussures en intérieur sur une surface propre. Marchez quelques minutes et contrôlez le talon, l’avant du pied et les côtés. Conservez l’emballage jusqu’à ce que la taille soit confirmée."],
        bullets: ["Les orteils bougent librement.", "Le talon ne glisse pas excessivement.", "Aucun point de pression douloureux.", "Les deux pieds sont confortables.", "La chaussure correspond à l’usage prévu."],
      },
    ],
    relatedLinks: [
      { href: "/produit/c-chaussons-exterieur-poils-femme/", label: "Chaussons fourrés à cœur brodé", description: "Modèle chaud pour l’automne et l’hiver." },
      { href: "/produit/c-chaussons-mode-femme-peluche/", label: "Chaussons en peluche à lanières", description: "Modèle doux à lanières croisées." },
      { href: "/guide-des-tailles/", label: "Tableau complet des tailles", description: "Consulter les correspondances disponibles." },
    ],
    faqs: [
      { question: "Quand faut-il mesurer ses pieds ?", answer: "Mesurez-les de préférence en fin de journée, debout, puis retenez la longueur du pied le plus grand." },
      { question: "Que choisir si je suis entre deux pointures ?", answer: "Pour un modèle fermé ou fourré, la pointure supérieure est souvent plus confortable. Vérifiez toujours les indications propres au produit." },
      { question: "Une chaussure trop petite va-t-elle s’agrandir ?", answer: "Elle peut s’assouplir légèrement selon la matière, mais la longueur de la semelle ne change pas. Il vaut mieux choisir une longueur correcte dès le départ." },
    ],
  },
];

export function getEcomediaGuide(slug: string): EcomediaGuide | undefined {
  return ecomediaGuides.find((guide) => guide.slug === slug);
}
