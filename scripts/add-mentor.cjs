const fs = require('fs');

// The MentorSection component content
const mentorSection = `
// ─── MENTOR SECTION ────────────────────────────────────────────────────────────
function MentorSection() {
  const [chap, setChap] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const curriculum = [
    {
      id: "mindset", icon: "🧠", color: "#6366f1",
      title: "Mindset d'un Senior Engineer",
      desc: "Comment pensent les vrais professionnels avant d'écrire UNE seule ligne de code",
      lessons: [
        {
          title: "Pourquoi 90% des débutants échouent",
          why: "La plupart des débutants cherchent à ÉCRIRE du code le plus vite possible. Les seniors font l'INVERSE : ils réfléchissent longtemps, puis écrivent peu.",
          analogy: "🏠 Construire une maison\\nUn débutant commence à poser des briques sans plan.\\nUn architecte passe des semaines à dessiner, mesurer, calculer — AVANT de toucher une brique.\\n\\nC'est pareil en code.",
          content: [
            "LES 5 QUESTIONS QU'UN SENIOR POSE AVANT DE CODER:",
            "",
            "1. POURQUOI ce code doit-il exister ?",
            "   → Quel problème résout-il exactement ?",
            "   → Est-ce qu'il existe déjà ?",
            "",
            "2. QUI va l'utiliser ?",
            "   → Un client ? Un admin ? Une machine ?",
            "   → Ça change TOUT dans la conception.",
            "",
            "3. QUE se passe-t-il quand ça rate ?",
            "   → Si la base de données tombe ?",
            "   → Si l'utilisateur met des données bizarres ?",
            "",
            "4. EST-CE scalable ?",
            "   → Pour 10 utilisateurs c'est facile.",
            "   → Pour 10,000 ? Pour 1,000,000 ?",
            "",
            "5. EST-CE sécurisé ?",
            "   → Un hacker peut-il exploiter ça ?",
            "   → Les données sont-elles protégées ?",
            "",
            "EXEMPLE CONCRET avec lecomax.com:",
            "Avant d'écrire la page checkout, un senior demande:",
            "• Que se passe-t-il si le client soumet 2 fois ?",
            "• Que se passe-t-il si le prix change entre le panier et le paiement ?",
            "• Que se passe-t-il si la DB est down pendant la commande ?",
            "• Un hacker peut-il changer le prix côté client ?",
          ].join("\\n"),
          quiz: {
            q: "Un développeur senior reçoit une tâche : 'Créer un formulaire de commande'. Que fait-il EN PREMIER ?",
            options: [
              "Il ouvre VS Code et commence à coder le HTML",
              "Il pose des questions sur les cas d'erreur, la sécurité et la scalabilité",
              "Il cherche sur Google comment faire un formulaire",
              "Il demande combien il va être payé",
            ],
            correct: 1,
            explanation: "Un senior RÉFLÉCHIT avant de coder. Il identifie tous les cas possibles — succès ET échec — avant d'écrire la première ligne."
          },
          exercise: "Choisissez une page de lecomax.com (ex: /checkout).\\nÉcrivez sur papier 10 questions de sécurité/scalabilité avant d'écrire du code.\\nExemple: 'Que se passe-t-il si...'"
        },
        {
          title: "Comment lire du code inconnu",
          why: "80% du travail d'un développeur professionnel, c'est LIRE et COMPRENDRE du code existant — pas en écrire du nouveau.",
          analogy: "📚 Lire un roman\\nQuand vous lisez un livre pour la première fois, vous ne commencez pas au milieu.\\nVous lisez le titre, le résumé, puis le début.\\n\\nPour lire du code: fichier principal → imports → exports → fonctions.",
          content: [
            "MÉTHODE POUR LIRE N'IMPORTE QUEL FICHIER:",
            "",
            "ÉTAPE 1 — La vue d'ensemble (30 secondes)",
            "→ Quel est le nom du fichier ?",
            "→ Dans quel dossier est-il ?",
            "→ Combien de lignes fait-il ?",
            "",
            "ÉTAPE 2 — Les imports (lignes du haut)",
            "→ Quelles bibliothèques utilise-t-il ?",
            "→ Quels fichiers du projet importe-t-il ?",
            "",
            "ÉTAPE 3 — L'export par défaut",
            "→ Qu'est-ce que ce fichier EXPORTE ?",
            "→ C'est ce que les autres fichiers reçoivent.",
            "",
            "ÉTAPE 4 — Les fonctions principales",
            "→ Listez chaque fonction et ce qu'elle fait en 1 phrase.",
            "",
            "EXERCICE avec app/page.tsx de lecomax:",
            "1. Nom: page.tsx → c'est la page d'accueil (route /)",
            "2. Imports: Image, Link, HeroBanner, ScrollReveal...",
            "3. Export: export default async function HomePage()",
            "4. Fonctions: getHeroImages(), puis le rendu JSX",
            "",
            "CONSEIL PRO: Ne lisez JAMAIS ligne par ligne la première fois.",
            "Lisez d'abord la structure, PUIS les détails.",
          ].join("\\n"),
          quiz: {
            q: "Vous ouvrez un fichier de 500 lignes que vous n'avez jamais vu. Que lisez-vous EN PREMIER ?",
            options: [
              "La ligne 1 jusqu'à la ligne 500 dans l'ordre",
              "Les imports en haut, puis l'export, puis les fonctions principales",
              "Vous cherchez 'function' avec Ctrl+F",
              "Vous demandez à quelqu'un de l'expliquer",
            ],
            correct: 1,
            explanation: "Les imports révèlent les dépendances. L'export révèle ce que fait le fichier. La structure globale avant les détails."
          },
          exercise: "Ouvrez components/Header.tsx dans l'explorateur de fichiers à gauche.\\nSans lire chaque ligne, répondez: Que fait ce fichier ? Quels composants importe-t-il ? Qu'exporte-t-il ?"
        },
      ]
    },
    {
      id: "js", icon: "🟡", color: "#f59e0b",
      title: "JavaScript — La Fondation",
      desc: "Variables, fonctions, objets, tableaux, async/await — tout ce que vous devez maîtriser",
      lessons: [
        {
          title: "C'est quoi JavaScript ?",
          why: "JavaScript est le SEUL langage que les navigateurs comprennent nativement. Sans lui, les sites web seraient statiques comme des photos — aucune interaction.",
          analogy: "🏗️ Le cerveau d'une page web\\nHTML = le squelette (la structure)\\nCSS = la peau (l'apparence)\\nJavaScript = le cerveau (le comportement)\\n\\nSans JS: cliquer un bouton ne fait rien.\\nAvec JS: cliquer ouvre un menu, fait une animation, envoie des données.",
          content: [
            "POURQUOI JAVASCRIPT EST PARTOUT:",
            "",
            "1. NAVIGATEUR: JavaScript tourne dans Chrome, Firefox, Safari",
            "   → Toutes les animations sur lecomax.com",
            "   → Le panier qui se met à jour sans recharger la page",
            "   → Les filtres de produits",
            "",
            "2. SERVEUR: Node.js = JavaScript côté serveur",
            "   → Les API routes de Next.js tournent grâce à Node.js",
            "   → /api/orders traite les commandes en JavaScript",
            "",
            "3. BASE DE DONNÉES: Supabase retourne du JSON",
            "   → JSON est né de JavaScript",
            "   → const { data } = await supabase.from('products').select()",
            "",
            "TIMELINE DE JS:",
            "1995: Créé en 10 jours par Brendan Eich chez Netscape",
            "2009: Node.js — JS sur le serveur",
            "2015: ES6 — révolution: arrow functions, const, let, classes",
            "2017: async/await — plus simple pour le code asynchrone",
            "2023: JavaScript = langage le + utilisé au monde",
            "",
            "JAVASCRIPT vs TYPESCRIPT:",
            "JavaScript: pas de types → erreurs difficiles à trouver",
            "TypeScript: types obligatoires → erreurs détectées avant exécution",
            "→ lecomax.com utilise TypeScript pour + de sécurité",
          ].join("\\n"),
          quiz: {
            q: "Pourquoi utilise-t-on TypeScript plutôt que JavaScript dans lecomax.com ?",
            options: [
              "Parce que TypeScript est plus rapide que JavaScript",
              "Parce que TypeScript ajoute des types qui détectent les erreurs AVANT l'exécution",
              "Parce que Next.js ne supporte que TypeScript",
              "Parce que c'est plus moderne",
            ],
            correct: 1,
            explanation: "TypeScript = JavaScript + types. Les types permettent à VS Code et au compilateur de détecter les bugs AVANT que le code tourne. Sur un vrai projet e-commerce, ça évite des bugs coûteux en production."
          },
          exercise: "Ouvrez lib/products.ts dans l'explorateur.\\nIdentifiez: où les types TypeScript sont utilisés ? (cherchez 'type' et 'interface')\\nPourquoi ces types sont-ils importants pour lecomax.com ?"
        },
        {
          title: "Variables: const, let, var — et pourquoi const partout",
          why: "Une variable est une boîte avec un nom. Elle stocke une valeur. MAIS: il existe 3 façons de créer cette boîte, et choisir la mauvaise crée des bugs impossibles à trouver.",
          analogy: "📦 Les boîtes de déménagement\\nvar = une boîte sans couvercle qu'on peut mettre n'importe où dans la maison\\nlet = une boîte qu'on peut remplir et vider dans une pièce précise\\nconst = une boîte scellée — on ne peut pas changer ce qu'elle contient",
          content: [
            "LES 3 FAÇONS DE DÉCLARER UNE VARIABLE:",
            "",
            "// VAR — NE JAMAIS UTILISER en 2024",
            "var nom = 'Mohammed';",
            "var nom = 'Ali';    // pas d'erreur! Bug silencieux",
            "// → var est 'function-scoped': elle existe partout dans la fonction",
            "// → Problème: on peut la redéclarer sans erreur",
            "",
            "// LET — Pour les valeurs qui CHANGENT",
            "let compteur = 0;",
            "compteur = 1;       // OK, la valeur change",
            "let compteur = 2;   // ERREUR: déjà déclarée",
            "// → let est 'block-scoped': elle n'existe que dans son bloc {}",
            "",
            "// CONST — Pour les valeurs qui NE CHANGENT PAS",
            "const API_URL = 'https://lecomax.com';",
            "API_URL = 'autre'; // ERREUR: const ne peut pas changer",
            "",
            "MAIS ATTENTION — Confusion courante:",
            "const produits = [];",
            "produits.push('chaussures');  // OK! On MODIFIE le tableau",
            "produits = ['autre'];          // ERREUR: on REMPLACE le tableau",
            "// → const empêche de REMPLACER la référence",
            "// → const n'empêche PAS de MODIFIER le contenu",
            "",
            "DANS LECOMAX.COM — Exemples réels:",
            "const supabase = createClient(url, key);  // jamais remplacé",
            "const [panier, setPanier] = useState([]); // const mais contenu change via setPanier",
            "let total = 0;",
            "for (const item of panier) { total += item.prix; }",
            "",
            "RÈGLE PROFESSIONNELLE:",
            "→ Toujours commencer par const",
            "→ Si TypeScript se plaint que la valeur doit changer → utiliser let",
            "→ Ne JAMAIS utiliser var",
          ].join("\\n"),
          quiz: {
            q: "Quel est le résultat de ce code ?\\n\\nconst panier = [];\\npanier.push('chaussures');\\nconsole.log(panier.length);",
            options: [
              "Erreur: on ne peut pas modifier un const",
              "0",
              "1",
              "undefined",
            ],
            correct: 2,
            explanation: "const empêche de REMPLACER la variable (panier = autre chose), mais autorise à MODIFIER son contenu (ajouter dans le tableau). panier.push() modifie le contenu → ça marche. panier.length vaut 1."
          },
          exercise: "Ouvrez components/CartContext.tsx.\\nTrouvez 3 utilisations de const et 3 de let.\\nPour chaque utilisation, expliquez POURQUOI const ou let a été choisi."
        },
        {
          title: "Fonctions — Les blocs de construction du code",
          why: "Une fonction est un groupe d'instructions avec un nom. Au lieu de répéter le même code 100 fois, on l'écrit UNE fois dans une fonction et on l'appelle 100 fois.",
          analogy: "🍕 La recette de pizza\\nSans fonction: écrire toute la recette chaque fois qu'on veut une pizza.\\nAvec fonction: écrire fairePizza() une fois, l'appeler autant qu'on veut.\\n\\nSi la recette change → on change UNE seule fois.",
          content: [
            "LES 4 FAÇONS D'ÉCRIRE UNE FONCTION EN JAVASCRIPT:",
            "",
            "// 1. Déclaration classique",
            "function calculerTotal(prix, quantite) {",
            "  return prix * quantite;",
            "}",
            "",
            "// 2. Expression de fonction",
            "const calculerTotal = function(prix, quantite) {",
            "  return prix * quantite;",
            "};",
            "",
            "// 3. Arrow function (moderne — utilisée partout dans lecomax)",
            "const calculerTotal = (prix, quantite) => {",
            "  return prix * quantite;",
            "};",
            "",
            "// 4. Arrow function courte (si 1 seule ligne)",
            "const calculerTotal = (prix, quantite) => prix * quantite;",
            "",
            "EXEMPLES RÉELS DANS LECOMAX.COM:",
            "",
            "// lib/products.ts",
            "export function formatMAD(amount: number): string {",
            "  return new Intl.NumberFormat('fr-MA', {",
            "    style: 'currency',",
            "    currency: 'MAD'",
            "  }).format(amount);",
            "}",
            "// → Utilisée partout pour afficher les prix en Dirhams",
            "// → Si le format change → modifier UNE seule fonction",
            "",
            "// components/PostCard.tsx",
            "async function handleLike() {",
            "  if (likeLoading) return;",
            "  if (!requireAuth('like')) return;",
            "  // ...",
            "}",
            "",
            "PARAMÈTRES vs ARGUMENTS:",
            "function saluer(prenom) {     // prenom = PARAMÈTRE",
            "  return 'Bonjour ' + prenom;",
            "}",
            "saluer('Mohammed');           // 'Mohammed' = ARGUMENT",
            "",
            "VALEURS PAR DÉFAUT (TypeScript):",
            "function créerPost(titre: string, publié: boolean = false) {",
            "  // Si on n'envoie pas 'publié', il vaut false par défaut",
            "}",
          ].join("\\n"),
          quiz: {
            q: "Quelle est la différence entre un paramètre et un argument ?",
            options: [
              "Il n'y a pas de différence, ce sont des synonymes",
              "Le paramètre est dans la définition de la fonction, l'argument est la valeur passée lors de l'appel",
              "Un paramètre est obligatoire, un argument est optionnel",
              "Les paramètres sont pour les fonctions async, les arguments pour les fonctions normales",
            ],
            correct: 1,
            explanation: "function saluer(prenom) → prenom est le PARAMÈTRE (dans la définition).\\nsaluer('Mohammed') → 'Mohammed' est l'ARGUMENT (la valeur passée). Simple mais important pour bien communiquer avec d'autres devs."
          },
          exercise: "Écrivez une fonction calculerLivraison(total: number): number\\n→ Si total >= 500 MAD: livraison gratuite (retourner 0)\\n→ Sinon: retourner 35 MAD\\n\\nTestez avec: calculerLivraison(600) et calculerLivraison(200)"
        },
        {
          title: "async/await — Comprendre le code asynchrone",
          why: "Le problème le plus incompris par les débutants. Quand votre code parle à une base de données ou une API, il doit ATTENDRE la réponse. Sans async/await, le code continue sans attendre — résultat: données vides, bugs bizarres.",
          analogy: "☕ Commander un café\\nSynchrone (bloquant):\\nVous commandez → vous ATTENDEZ devant le bar → vous recevez → vous partez.\\nPendant ce temps: vous ne pouvez rien faire d'autre.\\n\\nAsynchrone (non-bloquant):\\nVous commandez → vous ATTENDEZ que votre numéro soit appelé → pendant ce temps vous lisez votre téléphone.\\n→ C'est ce que fait async/await.",
          content: [
            "LE PROBLÈME SANS ASYNC/AWAIT:",
            "",
            "// ❌ MAUVAIS — ne marche pas",
            "function chargerProduits() {",
            "  const données = fetch('/api/products'); // fetch prend du temps!",
            "  console.log(données);                  // affiche Promise {<pending>}",
            "  // → Le code continue SANS attendre la réponse",
            "}",
            "",
            "// ✅ BON — avec async/await",
            "async function chargerProduits() {",
            "  const réponse = await fetch('/api/products');  // ATTENDRE ici",
            "  const données = await réponse.json();           // ATTENDRE ici aussi",
            "  console.log(données);                           // maintenant c'est les vraies données",
            "}",
            "",
            "RÈGLES IMPORTANTES:",
            "1. await ne peut s'utiliser QUE dans une fonction async",
            "2. async function retourne toujours une Promise",
            "3. Il FAUT gérer les erreurs avec try/catch",
            "",
            "// AVEC GESTION D'ERREUR — comme dans lecomax.com",
            "async function créerCommande(données: OrderData) {",
            "  try {",
            "    // tout ce qui peut échouer",
            "    const { data, error } = await supabase",
            "      .from('orders')",
            "      .insert(données)",
            "      .select()",
            "      .single();",
            "",
            "    if (error) throw error;",
            "    return { success: true, order: data };",
            "",
            "  } catch (erreur) {",
            "    // que faire si ça échoue",
            "    console.error('Erreur commande:', erreur);",
            "    return { success: false, error: erreur.message };",
            "  }",
            "}",
            "",
            "EXÉCUTION PARALLÈLE (plus rapide!):",
            "// ❌ Séquentiel — lent (attend l'un après l'autre)",
            "const produits = await chargerProduits();",
            "const avis = await chargerAvis();",
            "",
            "// ✅ Parallèle — rapide (attend les deux en même temps)",
            "const [produits, avis] = await Promise.all([",
            "  chargerProduits(),",
            "  chargerAvis()",
            "]);",
          ].join("\\n"),
          quiz: {
            q: "Que se passe-t-il si on oublie le mot 'await' devant fetch() ?",
            options: [
              "Le code plante immédiatement avec une erreur",
              "Le code continue sans attendre la réponse — on obtient une Promise, pas les données",
              "Le code attend quand même automatiquement",
              "Rien, await est optionnel",
            ],
            correct: 1,
            explanation: "Sans await, fetch() retourne une Promise (une promesse de résultat futur), pas les vraies données. C'est le bug le plus courant pour les débutants: afficher [object Promise] au lieu des données."
          },
          exercise: "Dans app/api/orders/route.ts (dans l'explorateur), trouvez 3 endroits où await est utilisé.\\nPour chaque await: qu'est-ce qu'on attend ? Pourquoi est-ce qu'on ne peut pas continuer sans attendre ?"
        },
      ]
    },
    {
      id: "react", icon: "⚛️", color: "#61dafb",
      title: "React — L'Interface Utilisateur",
      desc: "Components, Props, State, Hooks — la bibliothèque qui gère tout ce que l'utilisateur voit",
      lessons: [
        {
          title: "C'est quoi React et pourquoi on l'utilise ?",
          why: "Avant React, pour changer une partie d'une page web, on rechargait TOUTE la page. C'était lent et frustrant. React a révolutionné ça: il ne change QUE la partie qui doit changer.",
          analogy: "🖼️ Tableau vivant\\nSans React: pour changer le prix d'un produit, vous brûlez toute la page et la redessinez.\\nAvec React: vous changez SEULEMENT le chiffre du prix. Le reste ne bouge pas.\\n\\nC'est le Virtual DOM: React compare l'ancienne version avec la nouvelle et ne change QUE la différence.",
          content: [
            "PROBLÈME QUE REACT RÉSOUT:",
            "",
            "AVANT REACT (manipulation directe du DOM):",
            "document.getElementById('prix').textContent = '599 MAD';",
            "document.getElementById('stock').textContent = 'En stock';",
            "// → Pour chaque changement: chercher l'élément → le modifier",
            "// → Sur une page complexe: des centaines de ces lignes",
            "// → Difficile à maintenir, bugs fréquents",
            "",
            "AVEC REACT:",
            "function ProduitCard({ prix, stock }) {",
            "  return (",
            "    <div>",
            "      <span>{prix} MAD</span>",
            "      <span>{stock}</span>",
            "    </div>",
            "  );",
            "}",
            "// → On décrit CE QUE l'interface doit afficher",
            "// → React s'occupe de mettre à jour le DOM",
            "",
            "LE VIRTUAL DOM — Comment ça marche:",
            "1. React garde une copie virtuelle du DOM en mémoire",
            "2. Quand l'état change, React crée un nouveau Virtual DOM",
            "3. React compare ancien et nouveau (diffing)",
            "4. React ne met à jour QUE les différences dans le vrai DOM",
            "→ Résultat: beaucoup plus rapide que tout recréer",
            "",
            "JSX — Le mélange HTML + JavaScript:",
            "// JSX n'est pas du HTML! C'est du JavaScript transformé",
            "const element = <h1>Bonjour {nom}</h1>;",
            "// Est transformé en:",
            "const element = React.createElement('h1', null, 'Bonjour ', nom);",
            "",
            "RÈGLES JSX:",
            "→ Une seule racine (ou <> fragment </>)",
            "→ className au lieu de class (class est un mot réservé JS)",
            "→ htmlFor au lieu de for (même raison)",
            "→ Les expressions JS entre {}",
            "→ Les commentaires: {/* ... */}",
          ].join("\\n"),
          quiz: {
            q: "Qu'est-ce que le Virtual DOM ?",
            options: [
              "Un DOM invisible que l'utilisateur ne peut pas voir",
              "Une copie du DOM gardée en mémoire par React pour comparer les changements et minimiser les mises à jour du vrai DOM",
              "Une version simplifiée du DOM HTML",
              "Le DOM des applications mobile",
            ],
            correct: 1,
            explanation: "Le Virtual DOM est une représentation légère du DOM réel gardée en mémoire. Quand l'état change, React compare (diff) l'ancien et le nouveau Virtual DOM, puis ne met à jour QUE les parties différentes dans le vrai DOM. C'est ce qui rend React si rapide."
          },
          exercise: "Ouvrez components/ProductCard.tsx.\\n1. Identifiez les PROPS que ce composant reçoit.\\n2. Quel état (useState) utilise-t-il ?\\n3. À quel moment le composant se re-rend-il ?"
        },
        {
          title: "Props — Passer des données entre composants",
          why: "Les props sont comme des paramètres de fonction, mais pour les composants React. Sans props, chaque composant serait isolé et on devrait dupliquer le code partout.",
          analogy: "📬 Le courrier\\nProps = courrier qu'un parent envoie à son enfant.\\n\\nLe parent (ProductRail) envoie une liste de produits.\\nL'enfant (ProductCard) reçoit UN produit et l'affiche.\\n\\nL'enfant ne peut PAS modifier les props qu'il reçoit — comme on ne peut pas modifier le courrier de quelqu'un d'autre.",
          content: [
            "SYNTAXE DES PROPS:",
            "",
            "// PARENT — envoie les données",
            "function ProduitList() {",
            "  const produits = [",
            "    { id: 1, nom: 'Chaussures Asics', prix: 599 },",
            "    { id: 2, nom: 'Sac à dos', prix: 849 },",
            "  ];",
            "",
            "  return (",
            "    <div>",
            "      {produits.map(p => (",
            "        <ProduitCard",
            "          key={p.id}          // ← obligatoire dans map()",
            "          nom={p.nom}",
            "          prix={p.prix}",
            "        />",
            "      ))}",
            "    </div>",
            "  );",
            "}",
            "",
            "// ENFANT — reçoit les données",
            "function ProduitCard({ nom, prix }: { nom: string, prix: number }) {",
            "  return (",
            "    <div>",
            "      <h3>{nom}</h3>",
            "      <p>{prix} MAD</p>",
            "    </div>",
            "  );",
            "}",
            "",
            "PROPS IMPORTANTES:",
            "",
            "// children — ce qui est entre les balises",
            "function Bouton({ children, onClick }) {",
            "  return <button onClick={onClick}>{children}</button>;",
            "}",
            "// Utilisation:",
            "<Bouton onClick={acheter}>Ajouter au panier</Bouton>",
            "// children = 'Ajouter au panier'",
            "",
            "// VALEURS PAR DÉFAUT",
            "function Bouton({ couleur = 'vert', taille = 'md' }) { ... }",
            "",
            "// PROPS OPTIONNELLES en TypeScript",
            "interface Props {",
            "  nom: string;        // obligatoire",
            "  description?: string; // optionnel (le ? le dit)",
            "  prix: number;",
            "}",
            "",
            "RÈGLE D'OR: Les props sont IMMUTABLES (ne jamais les modifier).",
            "Si vous devez modifier une valeur → utilisez l'état local (useState).",
          ].join("\\n"),
          quiz: {
            q: "Pourquoi doit-on mettre une prop 'key' unique quand on utilise .map() ?",
            options: [
              "C'est juste une convention, pas vraiment obligatoire",
              "React utilise key pour identifier chaque élément et savoir lequel mettre à jour quand la liste change — sans key, React est perdu",
              "La key permet d'accéder à l'élément dans le CSS",
              "La key est le nom de la variable dans la base de données",
            ],
            correct: 1,
            explanation: "Sans key unique, si la liste change (ajout, suppression, réorganisation), React ne sait pas QUEL élément a changé. Il serait obligé de tout re-rendre. Avec key, React sait exactement quel élément mettre à jour — plus efficace."
          },
          exercise: "Regardez comment ProductCard est utilisé dans ProductRail.tsx.\\nListez toutes les props passées. Pour chaque prop: quel type ? Obligatoire ou optionnelle ?\\nEssayez de deviner POURQUOI chaque prop est nécessaire."
        },
        {
          title: "useState — La mémoire des composants",
          why: "Un composant React 'oublie' tout entre chaque rendu. useState est une boîte spéciale qui SURVIT aux rerenders. C'est grâce à useState que le panier se souvient de vos produits.",
          analogy: "🧠 La mémoire à court terme\\nSans useState: chaque fois que React réaffiche le composant, toutes les variables sont remises à zéro.\\nAvec useState: la valeur est préservée, comme une boîte dans un coffre-fort que React garde entre les rendus.",
          content: [
            "SYNTAXE:",
            "",
            "import { useState } from 'react';",
            "",
            "// Déclaration:",
            "const [valeur, setValeur] = useState(valeurInitiale);",
            "//     ↑ état    ↑ fonction   ↑ valeur au départ",
            "",
            "// Exemple réel:",
            "const [quantite, setQuantite] = useState(1);",
            "const [enChargement, setEnChargement] = useState(false);",
            "const [produits, setProduits] = useState<Product[]>([]);",
            "const [erreur, setErreur] = useState<string | null>(null);",
            "",
            "MODIFIER L'ÉTAT:",
            "// ✅ Toujours utiliser la fonction setter",
            "setQuantite(3);",
            "setEnChargement(true);",
            "",
            "// ❌ JAMAIS modifier directement",
            "quantite = 3;    // Bug: React ne sait pas qu'il a changé!",
            "",
            "METTRE À JOUR BASÉ SUR L'ANCIENNE VALEUR:",
            "// ✅ Utiliser la fonction callback",
            "setQuantite(ancienne => ancienne + 1);",
            "",
            "// ❌ Dangereux (peut être stale)",
            "setQuantite(quantite + 1);",
            "",
            "EXEMPLE COMPLET — Bouton +/- quantité:",
            "function QuantiteSelector() {",
            "  const [qte, setQte] = useState(1);",
            "",
            "  return (",
            "    <div>",
            "      <button onClick={() => setQte(q => Math.max(1, q - 1))}>-</button>",
            "      <span>{qte}</span>",
            "      <button onClick={() => setQte(q => Math.min(10, q + 1))}>+</button>",
            "    </div>",
            "  );",
            "}",
            "",
            "RÈGLE D'OR: Chaque appel à setXxx déclenche un re-render.",
            "Ne jamais appeler setXxx en dehors d'un événement ou useEffect.",
            "Ne jamais appeler setXxx dans le corps du composant directement.",
          ].join("\\n"),
          quiz: {
            q: "Que se passe-t-il quand on appelle setQuantite(5) ?",
            options: [
              "La variable quantite est immédiatement mise à jour à 5",
              "React planifie un re-render du composant, et au prochain rendu, quantite vaudra 5",
              "Le composant est détruit et recréé",
              "Tous les composants parents sont aussi re-rendus",
            ],
            correct: 1,
            explanation: "setState est ASYNCHRONE. Il ne change pas la valeur immédiatement. Il dit à React: 'hey, au prochain rendu, utilise cette nouvelle valeur'. C'est pourquoi après setQuantite(5), console.log(quantite) peut encore afficher l'ancienne valeur."
          },
          exercise: "Dans components/ProductActions.tsx, trouvez tous les useState.\\nPour chaque état: quel est son rôle ? Quand est-il modifié ? Quel composant le lit ?"
        },
        {
          title: "useEffect — Agir quand quelque chose change",
          why: "useEffect permet de faire des actions EN RÉPONSE à des changements: charger des données au montage, mettre à jour le titre de page, s'abonner à des événements, nettoyer des ressources.",
          analogy: "👂 Le vigile à la porte\\nuseEffect = un vigile qui surveille et réagit.\\n'Chaque fois que le stock change → envoie une notification'\\n'Quand la page charge → charge les produits depuis la DB'\\n'Quand le composant disparaît → annule les timers actifs'",
          content: [
            "SYNTAXE:",
            "",
            "useEffect(() => {",
            "  // CODE À EXÉCUTER",
            "  return () => {",
            "    // NETTOYAGE (optionnel)",
            "  };",
            "}, [/* DÉPENDANCES */]);",
            "",
            "LES 3 FORMES:",
            "",
            "// 1. S'exécute à CHAQUE rendu (rare, souvent un bug)",
            "useEffect(() => {",
            "  console.log('rendu!');",
            "}); // pas de []",
            "",
            "// 2. S'exécute UNE SEULE FOIS au montage",
            "useEffect(() => {",
            "  chargerProduits(); // au démarrage",
            "}, []); // [] vide = une seule fois",
            "",
            "// 3. S'exécute quand une dépendance change",
            "useEffect(() => {",
            "  chargerProduits(categorie); // quand categorie change",
            "}, [categorie]);",
            "",
            "NETTOYAGE — TRÈS IMPORTANT:",
            "useEffect(() => {",
            "  const timer = setInterval(() => {",
            "    actualiserStock();",
            "  }, 5000);",
            "",
            "  return () => clearInterval(timer); // NETTOYAGE",
            "  // Sans ce return → timer continue même si composant disparu → memory leak!",
            "}, []);",
            "",
            "ERREUR CLASSIQUE — La boucle infinie:",
            "// ❌ MAUVAIS",
            "useEffect(() => {",
            "  chargerProduits();",
            "}, [produits]); // produits change → useEffect → chargerProduits → produits change → boucle!",
            "",
            "// ✅ BON",
            "useEffect(() => {",
            "  chargerProduits();",
            "}, []); // seulement au montage",
            "",
            "EXEMPLE RÉEL — EcomediaFeed.tsx:",
            "useEffect(() => {",
            "  if (!authChecked || !user) return;",
            "  fetch('/api/ecomedia/likes?postId=' + post.id + '&visitorId=' + user.id)",
            "    .then(r => r.json())",
            "    .then(d => { if (d.liked) setLiked(true); })",
            "    .catch(() => {});",
            "}, [post.id, user, authChecked]);",
            "// → Se déclenche quand post.id, user ou authChecked change",
          ].join("\\n"),
          quiz: {
            q: "Vous chargez des données dans useEffect. Que se passe-t-il si vous ne mettez PAS [] comme dépendances ?",
            options: [
              "Les données ne se chargent jamais",
              "Les données se chargent une seule fois correctement",
              "useEffect s'exécute à CHAQUE rendu du composant, causant des chargements infinis",
              "TypeScript affiche une erreur",
            ],
            correct: 2,
            explanation: "Sans [], useEffect s'exécute à chaque rendu. Charger des données cause un setState → un re-render → useEffect s'exécute → charge les données → setState → ... boucle infinie. Toujours mettre [] pour les chargements initiaux."
          },
          exercise: "Trouvez dans components/ecomedia/PostCard.tsx les useEffect.\\nPour chaque useEffect:\\n1. Quand s'exécute-t-il ? (au montage ? quand une valeur change ?)\\n2. Que fait-il ?\\n3. Y a-t-il une fonction de nettoyage ? Pourquoi ?"
        },
      ]
    },
    {
      id: "nextjs", icon: "▲", color: "#000",
      title: "Next.js — Le Framework Complet",
      desc: "App Router, Server Components, API Routes, Middleware — tout ce qui fait tourner lecomax.com",
      lessons: [
        {
          title: "App Router — Comment fonctionne le routing",
          why: "Avant Next.js App Router, créer une route /boutique nécessitait de la configuration. Maintenant: créez un fichier app/boutique/page.tsx → la route existe automatiquement.",
          analogy: "🗺️ L'adresse d'une maison\\nChaque fichier page.tsx = une adresse sur internet.\\napp/page.tsx = / (accueil)\\napp/boutique/page.tsx = /boutique\\napp/produit/[slug]/page.tsx = /produit/chaussures-asics",
          content: [
            "STRUCTURE DE FICHIERS = STRUCTURE D'URLs:",
            "",
            "app/",
            "  page.tsx              → https://lecomax.com/",
            "  layout.tsx            → Layout de TOUTES les pages",
            "  boutique/",
            "    page.tsx            → https://lecomax.com/boutique",
            "  produit/",
            "    [slug]/",
            "      page.tsx          → https://lecomax.com/produit/ANYTHING",
            "  api/",
            "    products/",
            "      route.ts          → https://lecomax.com/api/products",
            "",
            "FICHIERS SPÉCIAUX:",
            "",
            "page.tsx      → Ce qui s'affiche pour cette route",
            "layout.tsx    → Wrapper persistant (header, footer)",
            "loading.tsx   → Affiché pendant le chargement",
            "error.tsx     → Affiché en cas d'erreur",
            "not-found.tsx → Page 404",
            "",
            "ROUTES DYNAMIQUES [slug]:",
            "// app/produit/[slug]/page.tsx",
            "export default function ProduitPage({",
            "  params",
            "}: {",
            "  params: { slug: string }  // TypeScript: slug est une string",
            "}) {",
            "  // URL /produit/chaussures-asics → params.slug = 'chaussures-asics'",
            "  return <h1>Produit: {params.slug}</h1>;",
            "}",
            "",
            "ROUTE GROUPS (grouper sans changer l'URL):",
            "app/",
            "  (public)/         ← () = groupe, pas dans l'URL",
            "    page.tsx         → /",
            "    boutique/",
            "      page.tsx       → /boutique",
            "  (admin)/",
            "    admin/",
            "      page.tsx       → /admin",
            "// → Permet de partager des layouts différents",
            "",
            "POURQUOI LECOMAX UTILISE APP ROUTER (pas Pages Router):",
            "→ Server Components par défaut → meilleure performance",
            "→ Streaming → chargement progressif",
            "→ Nested layouts → moins de duplication",
            "→ C'est l'avenir de Next.js",
          ].join("\\n"),
          quiz: {
            q: "Quel fichier faut-il créer pour que https://lecomax.com/ecomedia/un-post fonctionne ?",
            options: [
              "app/ecomedia/un-post.tsx",
              "app/ecomedia/[slug]/page.tsx",
              "pages/ecomedia/[slug].tsx",
              "app/ecomedia/page.tsx avec un paramètre slug",
            ],
            correct: 1,
            explanation: "Dans App Router, les routes dynamiques utilisent [nomDuParamètre] comme dossier. app/ecomedia/[slug]/page.tsx crée la route /ecomedia/ANYTHING. Le slug est récupéré via params.slug dans le composant."
          },
          exercise: "Regardez la structure de dossiers app/ dans l'explorateur de fichiers.\\nMappez CHAQUE dossier/fichier page.tsx vers son URL correspondante.\\nTrouvez toutes les routes dynamiques [slug] ou [id]."
        },
        {
          title: "Server Components vs Client Components",
          why: "C'est la décision la plus importante dans Next.js. Server Components = code qui tourne sur le serveur, invisible au client. Client Components = code qui tourne dans le navigateur. Mauvais choix = sécurité compromise ou interactivité impossible.",
          analogy: "🏪 Le restaurant\\nServer Component = ce qui se passe EN CUISINE (invisible pour le client)\\n→ La recette secrète, les ingrédients, la préparation\\n→ Le client reçoit seulement le plat fini\\n\\nClient Component = ce qui se passe en SALLE (visible, interactif)\\n→ Le serveur qui prend votre commande\\n→ L'ambiance, la musique, vous qui choisissez\\n→ Interaction en temps réel",
          content: [
            "SERVER COMPONENT (défaut dans app/):",
            "",
            "// app/produits/page.tsx — PAS de 'use client'",
            "// → Tourne SEULEMENT sur le serveur",
            "// → Le JavaScript N'EST PAS envoyé au navigateur",
            "",
            "PEUT FAIRE:",
            "✅ Accéder directement à la base de données",
            "✅ Utiliser des variables d'env secrètes (SERVICE_ROLE_KEY)",
            "✅ Fetch côté serveur (plus rapide, pas de CORS)",
            "✅ Accéder au système de fichiers",
            "",
            "NE PEUT PAS:",
            "❌ useState, useEffect (pas de hooks React)",
            "❌ Event listeners (onClick, onChange)",
            "❌ APIs du browser (window, document, localStorage)",
            "",
            "CLIENT COMPONENT:",
            "",
            "'use client'; // ← Cette ligne OBLIGATOIRE en haut du fichier",
            "",
            "PEUT FAIRE:",
            "✅ useState, useEffect, tous les hooks",
            "✅ Event listeners (onClick, etc.)",
            "✅ APIs du browser",
            "✅ Animations en temps réel",
            "",
            "NE PEUT PAS:",
            "❌ Accéder directement à la DB avec le service_role",
            "❌ Garder des secrets côté serveur",
            "",
            "DANS LECOMAX.COM — Exemples réels:",
            "",
            "SERVER COMPONENTS:",
            "app/page.tsx              → charge les produits depuis Supabase",
            "app/produit/[slug]/page.tsx → charge UN produit, génère les metadata",
            "",
            "CLIENT COMPONENTS:",
            "components/Header.tsx     → menu hamburger, hover, navigation",
            "components/CartContext.tsx → gestion du panier (state)",
            "components/ecomedia/PostCard.tsx → likes, commentaires, interactions",
            "",
            "RÈGLE D'OR:",
            "Commencez par Server Component.",
            "Ajoutez 'use client' SEULEMENT si vous avez besoin d'interactivité.",
            "Plus vous avez de Server Components → meilleure performance + sécurité.",
          ].join("\\n"),
          quiz: {
            q: "Vous créez une page qui charge des produits depuis Supabase ET a un bouton 'Ajouter au panier' interactif. Comment structurez-vous ça ?",
            options: [
              "Tout en Client Component avec 'use client' en haut",
              "Tout en Server Component sans 'use client'",
              "La page principale en Server Component (charge les données), le bouton en Client Component séparé",
              "Impossible de combiner les deux",
            ],
            correct: 2,
            explanation: "La bonne pratique: pages en Server Component pour charger les données (plus rapide, sécurisé). Les boutons interactifs en Client Component importés dans la page. C'est exactement ce que fait lecomax.com: app/produit/[slug]/page.tsx est server, components/ProductActions.tsx est client."
          },
          exercise: "Listez 5 fichiers de lecomax.com et pour chacun:\\n1. Server ou Client Component ?\\n2. Comment vous le savez ? ('use client' présent ou non)"
        },
      ]
    },
    {
      id: "security", icon: "🔐", color: "#ef4444",
      title: "Sécurité — Protéger son Site",
      desc: "Les 10 menaces qui coulent les sites web et comment les éviter dans lecomax.com",
      lessons: [
        {
          title: "Les variables d'environnement — Ne jamais exposer les secrets",
          why: "Votre code est public sur GitHub. Si vous écrivez votre clé Supabase directement dans le code, n'importe qui peut vider votre base de données. Les variables d'env gardent les secrets HORS du code.",
          analogy: "🔑 Le coffre-fort\\nVotre code = la maison. N'importe qui peut la visiter.\\nVos secrets = les bijoux. Ils ne doivent PAS être dans la maison.\\nLes variables d'env = le coffre-fort à la banque. Seuls les autorisés y accèdent.",
          content: [
            "COMMENT ÇA MARCHE:",
            "",
            "// ❌ DANGEREUX — secret dans le code",
            "const sb = createClient(",
            "  'https://xxx.supabase.co',",
            "  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // TOUT LE MONDE VOIT ÇA",
            ");",
            "",
            "// ✅ SÉCURISÉ — secret dans .env.local",
            "const sb = createClient(",
            "  process.env.NEXT_PUBLIC_SUPABASE_URL!,",
            "  process.env.SUPABASE_SERVICE_ROLE_KEY!",
            ");",
            "",
            "DEUX TYPES DE VARIABLES:",
            "",
            "NEXT_PUBLIC_xxx   → Visible dans le navigateur",
            "→ N'Y METTEZ que des valeurs non-secrètes",
            "→ Ex: URL Supabase (publique), clé anon (sécurisée par RLS)",
            "",
            "SANS NEXT_PUBLIC_  → Seulement sur le serveur",
            "→ SECRÈTES: clé service_role, RESEND, SESSION_SECRET",
            "→ Jamais accessibles depuis le browser",
            "",
            ".env.local = fichier JAMAIS commité sur GitHub (.gitignore)",
            "",
            "STOCKAGE EN PRODUCTION:",
            "Vercel Dashboard → Settings → Environment Variables",
            "→ Chaque variable ajoutée manuellement",
            "→ Chiffrement automatique au repos et en transit",
            "",
            "VÉRIFIER QU'UNE VARIABLE EXISTE (sécurité défensive):",
            "if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {",
            "  throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante!');",
            "}",
            "",
            "ERREUR CLASSIQUE:",
            "Committer accidentellement .env.local sur GitHub.",
            "→ Même supprimé après, l'historique Git garde la trace.",
            "→ Solution: révoquer IMMÉDIATEMENT toutes les clés compromises.",
            "",
            "RÈGLE D'OR:",
            "Imaginez que votre code est sur un panneau publicitaire.",
            "Ne mettez JAMAIS dans le code ce que vous ne voudriez pas voir sur ce panneau.",
          ].join("\\n"),
          quiz: {
            q: "Quelle est la différence entre NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY ?",
            options: [
              "Aucune différence, les deux sont secrètes",
              "NEXT_PUBLIC_ est envoyée au navigateur (publique), sans ce préfixe = seulement côté serveur (secrète)",
              "NEXT_PUBLIC_ est pour Next.js, l'autre pour Supabase",
              "NEXT_PUBLIC_ fonctionne en local, l'autre en production",
            ],
            correct: 1,
            explanation: "NEXT_PUBLIC_ = inclus dans le bundle JavaScript envoyé au navigateur → visible par tout le monde. Sans ce préfixe = seulement disponible côté serveur Node.js → jamais envoyé au client. La service_role key donne un accès TOTAL à votre DB — jamais côté client."
          },
          exercise: "Ouvrez .gitignore à la racine du projet.\\nVérifiez que .env.local y est bien.\\nSi quelqu'un supprimait .env.local de .gitignore et commitait accidentellement, quelle serait la PREMIÈRE chose à faire ?"
        },
        {
          title: "Validation des entrées — Ne jamais faire confiance aux données",
          why: "Chaque donnée qui vient d'un utilisateur peut être malveillante. Un hacker peut envoyer du code SQL dans un champ texte (SQL Injection), du HTML/JavaScript dans un titre (XSS), ou un nombre négatif comme prix.",
          analogy: "🍽️ Le restaurant et l'allergique\\nLe client dit: 'Je suis allergique aux noix'.\\nUn bon restaurant VÉRIFIE chaque ingrédient.\\nUn restaurant négligent prend la parole du client pour acquise.\\n\\nDe même: ne JAMAIS croire ce qu'un utilisateur envoie.",
          content: [
            "LES ATTAQUES COURANTES:",
            "",
            "1. SQL INJECTION:",
            "// L'utilisateur entre: ' OR '1'='1",
            "// Dans une requête non-protégée:",
            "db.query('SELECT * FROM users WHERE email = \\'' + email + '\\'');",
            "// → La requête devient:",
            "// SELECT * FROM users WHERE email = '' OR '1'='1'",
            "// → Retourne TOUS les utilisateurs!",
            "",
            "// PROTECTION: Supabase utilise des requêtes paramétrées automatiquement",
            "supabase.from('users').select().eq('email', email);",
            "// → email est séparé de la requête SQL → injection impossible",
            "",
            "2. XSS (Cross-Site Scripting):",
            "// L'utilisateur entre: <script>volerLesCookies()</script>",
            "// Si affiché sans protection: le script s'exécute!",
            "",
            "// PROTECTION: React échappe automatiquement les valeurs dans JSX",
            "<p>{commentaireUtilisateur}</p>",
            "// → React affiche littéralement '<script>...' comme texte",
            "",
            "// DANGER: dangerouslySetInnerHTML",
            "<div dangerouslySetInnerHTML={{ __html: html }} />",
            "// → Si html vient d'un utilisateur → XSS possible",
            "// → N'utiliser QUE si vous contrôlez entièrement le HTML",
            "",
            "3. VALIDATION DANS LES API ROUTES (lecomax.com):",
            "export async function POST(req: NextRequest) {",
            "  const body = await req.json();",
            "  const { title, content } = body;",
            "",
            "  // Validation obligatoire:",
            "  if (!title || typeof title !== 'string') {",
            "    return NextResponse.json({ error: 'Titre invalide' }, { status: 400 });",
            "  }",
            "  if (title.length > 200) {",
            "    return NextResponse.json({ error: 'Titre trop long' }, { status: 400 });",
            "  }",
            "  if (title.length < 3) {",
            "    return NextResponse.json({ error: 'Titre trop court' }, { status: 400 });",
            "  }",
            "",
            "  // Seulement après validation → insérer en DB",
            "  await sb.from('posts').insert({ title, content });",
            "}",
            "",
            "RÈGLE D'OR:",
            "Validate on the server ALWAYS.",
            "La validation frontend (HTML required, JS) = confort pour l'utilisateur.",
            "La validation backend = sécurité réelle.",
            "Un hacker peut ignorer toute validation frontend.",
          ].join("\\n"),
          quiz: {
            q: "Vous avez mis 'required' sur un champ HTML. Est-ce suffisant pour sécuriser votre formulaire ?",
            options: [
              "Oui, le navigateur bloque les soumissions vides",
              "Non, un hacker peut envoyer une requête directement à votre API sans passer par le formulaire HTML",
              "Oui, TypeScript vérifie aussi les types",
              "Non, mais c'est suffisant pour un petit site",
            ],
            correct: 1,
            explanation: "Un hacker utilise curl, Postman, ou du code pour envoyer des requêtes DIRECTEMENT à /api/orders — sans passer par votre HTML. La validation HTML = UX. La validation côté serveur = sécurité. TOUJOURS valider côté serveur."
          },
          exercise: "Ouvrez app/api/ecomedia/posts/route.ts dans l'explorateur.\\nTrouvez toutes les validations. Pour chaque validation:\\n1. Qu'est-ce qu'elle vérifie ?\\n2. Quelle attaque empêche-t-elle ?\\n3. Y a-t-il des validations MANQUANTES selon vous ?"
        },
      ]
    },
  ];

  const ch = curriculum[chap];
  const lesson = ch?.lessons[lessonIdx];

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white text-lg">🎓</div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Mentor Interactif — Senior Engineer</h2>
            <p className="text-sm text-gray-500">Chaque concept expliqué comme si vous aviez un senior à côté de vous</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <span className="text-lg">💡</span>
          <p className="text-[12px] text-amber-800 leading-relaxed font-medium">
            <strong>Philosophie:</strong> Pourquoi AVANT Comment. Chaque leçon explique d'abord POURQUOI quelque chose existe, puis HOW ça fonctionne. Avec analogies, code réel de lecomax.com, quiz et exercices.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Curriculum sidebar */}
        <div className="lg:w-52 shrink-0 space-y-1">
          {curriculum.map((c, i) => (
            <button key={c.id} onClick={() => { setChap(i); setLessonIdx(0); setQuizAnswer(null); setShowAnswer(false); }}
              className={\`w-full text-left px-3 py-2.5 rounded-xl transition-all \${chap === i ? "text-white shadow-md" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}\`}
              style={chap === i ? { backgroundColor: c.color } : {}}>
              <div className="flex items-center gap-2">
                <span>{c.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black truncate">{c.title}</p>
                  <p className="text-[9px] opacity-70">{c.lessons.length} leçons</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Lesson tabs */}
          <div className="flex gap-1 flex-wrap mb-4">
            {ch.lessons.map((l, i) => (
              <button key={i} onClick={() => { setLessonIdx(i); setQuizAnswer(null); setShowAnswer(false); }}
                className={\`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all \${lessonIdx === i ? "text-white" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}\`}
                style={lessonIdx === i ? { backgroundColor: ch.color } : {}}>
                {i + 1}. {l.title.split('—')[0].trim().slice(0, 25)}{l.title.length > 25 ? '…' : ''}
              </button>
            ))}
          </div>

          {lesson && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: ch.color }}>{ch.icon} {ch.title}</p>
                <h3 className="text-[17px] font-black mb-3">{lesson.title}</h3>

                {/* WHY */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-3">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1.5">🤔 POURQUOI ça existe ?</p>
                  <p className="text-[13px] text-blue-900 leading-relaxed">{lesson.why}</p>
                </div>

                {/* Analogy */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1.5">🌍 Analogie avec la vraie vie</p>
                  <pre className="text-[12px] text-amber-900 leading-relaxed font-sans whitespace-pre-wrap">{lesson.analogy}</pre>
                </div>
              </div>

              {/* Code & Explanation */}
              <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50">
                  <p className="text-[11px] font-black text-neutral-500 uppercase tracking-widest">📝 Explication détaillée + Code réel</p>
                </div>
                <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-[11px] leading-relaxed p-5 overflow-x-auto font-mono whitespace-pre-wrap m-4 rounded-xl"><code>{lesson.content}</code></pre>
              </div>

              {/* Quiz */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">🧪 Mini Quiz — Testez votre compréhension</p>
                <p className="text-[14px] font-bold text-gray-900 mb-4 leading-snug whitespace-pre-line">{lesson.quiz.q}</p>
                <div className="space-y-2 mb-4">
                  {lesson.quiz.options.map((opt, i) => (
                    <button key={i}
                      onClick={() => { setQuizAnswer(i); setShowAnswer(false); }}
                      className={\`w-full text-left px-4 py-3 rounded-xl text-[13px] font-medium transition-all border-2 \${
                        quizAnswer === i
                          ? showAnswer
                            ? i === lesson.quiz.correct
                              ? "bg-green-50 border-green-400 text-green-800"
                              : "bg-red-50 border-red-400 text-red-800"
                            : "bg-black border-black text-white"
                          : showAnswer && i === lesson.quiz.correct
                          ? "bg-green-50 border-green-400 text-green-800"
                          : "bg-neutral-50 border-neutral-200 hover:border-neutral-400"
                      }\`}>
                      <span className="font-black mr-2">{['A', 'B', 'C', 'D'][i]}.</span> {opt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAnswer(true)}
                    disabled={quizAnswer === null}
                    className="px-4 py-2 bg-black text-white text-[12px] font-black rounded-xl disabled:opacity-40 hover:bg-neutral-800 transition-colors active:scale-95">
                    Vérifier ma réponse
                  </button>
                  {showAnswer && (
                    <p className="text-[12px] font-bold">
                      {quizAnswer === lesson.quiz.correct ? "✅ Correct!" : "❌ Incorrect"}
                    </p>
                  )}
                </div>
                {showAnswer && (
                  <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">Explication</p>
                    <p className="text-[12px] text-neutral-700 leading-relaxed">{lesson.quiz.explanation}</p>
                  </div>
                )}
              </div>

              {/* Exercise */}
              <div className="bg-[#0d0d0d] rounded-2xl p-5">
                <p className="text-[10px] font-black text-[#3ecf4c] uppercase tracking-widest mb-2">💪 Exercice pratique</p>
                <pre className="text-[12px] text-white/80 leading-relaxed font-sans whitespace-pre-wrap">{lesson.exercise}</pre>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { if (lessonIdx > 0) { setLessonIdx(l => l - 1); setQuizAnswer(null); setShowAnswer(false); } else if (chap > 0) { setChap(c => c - 1); setLessonIdx(curriculum[chap - 1].lessons.length - 1); setQuizAnswer(null); setShowAnswer(false); } }}
                  disabled={chap === 0 && lessonIdx === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-[12px] font-bold text-neutral-600 hover:border-neutral-400 disabled:opacity-40 transition-colors">
                  ← Leçon précédente
                </button>
                <span className="text-[11px] text-neutral-400 font-semibold">
                  {curriculum.slice(0, chap).reduce((s, c) => s + c.lessons.length, 0) + lessonIdx + 1}
                  {' / '}
                  {curriculum.reduce((s, c) => s + c.lessons.length, 0)} leçons
                </span>
                <button
                  onClick={() => {
                    if (lessonIdx < ch.lessons.length - 1) { setLessonIdx(l => l + 1); setQuizAnswer(null); setShowAnswer(false); }
                    else if (chap < curriculum.length - 1) { setChap(c => c + 1); setLessonIdx(0); setQuizAnswer(null); setShowAnswer(false); }
                  }}
                  disabled={chap === curriculum.length - 1 && lessonIdx === ch.lessons.length - 1}
                  className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-[12px] font-bold hover:bg-neutral-800 disabled:opacity-40 transition-colors active:scale-95">
                  Leçon suivante →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const current = fs.readFileSync('app/admin/how-it-was-built/page.tsx', 'utf8');
const patched = current + '\n' + mentorSection;
fs.writeFileSync('app/admin/how-it-was-built/page.tsx', patched, 'utf8');
console.log('Done. Lines:', patched.split('\n').length);
