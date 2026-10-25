# Livraison — 7 octobre 2026

> Historical 1.0.0 delivery record. For the audited 1.0.1 changes, current limitations and validation, see [the senior audit](SENIOR-AUDIT-2026-10-07.md) and [audit delivery](AUDIT-DELIVERY.md).

Application indépendante dans `lecomax-learning-app/`, React Native, Expo 57,
TypeScript strict, Expo Router. Package Android `com.lecomax.learning`.

## APK

`artifacts/lecomax-learn-1.0.0-arm64.apk` — 73 718 602 octets (70,3 Mio).
Android 7.0 minimum (API 24), ARM64, version 1.0.0 / code 1.
Compilation Gradle release réussie. Signature dédiée RSA 4096 bits, schémas APK
v2/v3 vérifiés par Android apksigner.

SHA256 : `210079338E4979783E1D8AB187F2CB8C5A287B779128971B61FBEEAFDC5C86DB`

## Contenu

- 48 modules et 192 leçons de l’académie conservés dans les trois langues.
- 109 groupes au total, 1 363 entrées **de cours et de référence**.
- 659 questions existantes importées, plus 3 exercices de recherche d’erreur.
- 100 niveaux Code Quest, 102 microleçons arabes, parcours débutant,
  guides Next.js/Python/backend, ateliers boutique, contenus quotidiens et anciens
  Guide/Debug/Cours/Mentor extraits des composants.
- 594 fichiers réels référencés par hash, imports et utilisateurs des modules.
- 26 termes de glossaire utilisables comme flashcards.

Inventaire détaillé : `inventory.json`. Comptes par groupe : `migration-report.json`.
Les anciens exemples restent distingués des fichiers réels actuels.

## Fonctions

Accueil avec reprise, progression, série et temps étudié ; lecteur en quatre
étapes ; quiz corrigés immédiatement ; exercices avec indices et solutions ;
lecteur de code numéroté avec couleurs, copie et explications ; recherche ;
explorateur de projet ; favoris, notes, brouillons, difficulté et révision des
erreurs ; glossaire et flashcards ; thèmes clair/sombre/système ; interface RTL ;
export de progression ; rappels locaux opt-in ; contenus et progression hors ligne.

## Professeur IA

App → nouvelles routes sécurisées du site → fournisseur OpenAI existant côté
serveur. Authentification Supabase du propriétaire, jeton Android SecureStore,
validation des entrées, limites de taille et de fréquence, contexte limité aux
fichiers concernés, contrôle des secrets et délais maximaux.

L’IA nécessite encore le déploiement des nouvelles routes sur le site. Aucun
appel réel avec les identifiants du propriétaire n’a été effectué. Le limiteur
existant utilise Redis si configuré, sinon un compteur local au processus.

## Validation effectuée

- TypeScript application : OK.
- TypeScript site : OK avec les nouvelles routes.
- ESLint application : OK.
- Expo Doctor : 21/21 contrôles.
- Tests contenu, progression et sécurité/API : 14/14.
- Exécution dans un DOM de test : 12 scénarios, aucun échec ; accueil arabe hors
  ligne, cours, quiz, favoris, notes, langue, thème, recherche, code, connexion IA
  et restauration après redémarrage complet.
- Audit secrets : 950 fichiers contrôlés, comparaison avec les valeurs privées
  locales sans les journaliser.
- Export web et compilation Android release : OK.
- Signature et métadonnées APK : OK.

Les tests DOM ne constituent pas une validation visuelle Android. La reprise du
7 octobre a ensuite validé le lancement natif sur émulateur API 36 avec un APK
x86_64 signé, compilé depuis les mêmes sources : cours, quiz, favoris, notes et
progression après arrêt complet, langue/thème conservés et lecture hors ligne.
Voir [le rapport et les captures](ANDROID-VALIDATION.md). L’APK ARM64 initial est
inchangé ; son lancement sur téléphone ARM64 reste à vérifier. Aucun téléphone
physique n’a été utilisé et les notifications n’ont pas été observées sur appareil réel.

## Limites de contenu

Les traductions disponibles ont été conservées. Les documents historiques non
traduits restent dans leur langue d’origine : certains guides français et des
champs Code Quest anglais. Les 102 microleçons originales sont arabes. Il ne
s’agit donc pas d’une traduction intégrale de toutes les archives dans trois
langues. Les réponses IA stockées dans une session privée du site ne sont pas
des leçons du dépôt et n’ont pas été exportées.

## Fichiers et lancement

Créés : application, données générées, services, état local, composants, tests,
inventaires, documentation, icônes, configuration EAS et artefact APK.

Ajoutés côté site : `app/api/learning-mobile/auth/route.ts`,
`app/api/learning-mobile/teacher/route.ts`, `lib/learning-mobile-auth.ts`,
`lib/learning-mobile-validation.ts`.

Modifications limitées côté site : `tsconfig.json` (exclusion de l’app),
`next.config.js` (traçage du catalogue source), `.vercelignore` (exclusion des
fichiers mobiles du déploiement web). Aucun écran existant n’a été réécrit.

```powershell
cd lecomax-learning-app
npm ci
npm start
```

Compilation cloud après connexion et association à un nouveau projet Expo :

```powershell
eas build --platform android --profile preview
```

La clé de signature et `credentials.json` sont locaux et ignorés par Git.
Les conserver en lieu privé pour signer les futures mises à jour avec la même clé.
