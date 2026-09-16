# Lecomax — dossier de mise en production

Ce dossier prépare la version mobile `1.0.3` pour Google Play et l’App Store. Il ne contient ni identifiant, ni secret, ni certificat, ni binaire factice. Aucun envoi aux stores n’a été effectué.

## Identité vérifiée

| Élément | Valeur actuelle |
| --- | --- |
| Nom | Lecomax |
| Slug Expo | `lecomax` |
| Android package | `com.lecomax.app` |
| iOS bundle ID | `com.lecomax.app` |
| Version | `1.0.3` |
| Android versionCode | `11` (source distante EAS en production) |
| iOS buildNumber | `11` (source distante EAS en production) |
| Scheme | `lecomax` |
| EAS project ID | configuré dans `mobile/app.base.json` |
| Site/API | `https://lecomax.com` |

Le propriétaire doit confirmer que les identifiants de bundle sont disponibles dans ses comptes Google et Apple et que le projet EAS appartient au bon compte.

## Statut des builds

| Plateforme | Statut | Artefact | Lien EAS |
| --- | --- | --- | --- |
| Android AAB | Non généré : authentification/signature requises | Aucun | À renseigner |
| iOS IPA | Non généré : compte Apple/signature requis | Aucun | À renseigner |

La date, les numéros définitifs et les liens de build doivent être ajoutés ici après un build EAS authentifié. Les dossiers `builds/` expliquent où déposer les artefacts.

## Commandes de build (à lancer par le propriétaire)

Depuis `mobile/` :

```bash
npm install -g eas-cli
eas login
eas init
eas build --platform android --profile production
eas build --platform ios --profile production
```

`eas init` n’est nécessaire que si le projet EAS existant n’est pas le bon. Avant le build, créer dans l’environnement EAS `production` les variables publiques attendues par l’application : `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Une clé Supabase anonyme est intégrée au client par conception ; ne jamais y placer une clé de service. `EXPO_PUBLIC_API_URL` est déjà défini sur l’URL HTTPS de production.

Ne pas utiliser `eas submit` avant validation des questionnaires, des captures, des URLs publiques et du binaire sur appareils réels.

Après validation humaine, les commandes de dépôt (elles déclenchent un envoi au store) sont :

```bash
eas submit --platform android --profile production --latest
eas submit --platform ios --profile production --latest
```

## Validations locales effectuées

| Contrôle | Résultat |
| --- | --- |
| `npx expo-doctor` | 20/20 contrôles réussis |
| `npm run typecheck` (mobile) | Réussi, aucune erreur TypeScript |
| `npm run lint` (mobile) | Réussi, aucune erreur ESLint |
| `npm test` (racine) | 52/52 tests réussis |
| `npm run audit:mobile-interactions` | 191 contrôles interactifs, 0 erreur/avertissement |
| `npm run audit:mobile-secrets` | 283 fichiers et bundle contrôlés, 0 secret détecté |
| `npm audit --omit=dev` (mobile) | 0 vulnérabilité de production |
| `npx expo export --platform all --clear` | Android, iOS et web exportés avec succès ; 25 routes web |

L’audit npm complet signale 9 avis « high » dans la chaîne d’outils ESLint/minimatch, tous absents des dépendances de production et sans correctif compatible proposé. Aucun `npm audit fix --force` n’a été appliqué afin de ne pas casser la pile Expo.

## Limites de la validation

Un export Metro/Hermes valide le code et les ressources, mais ne remplace pas un AAB/IPA signé ni les essais sur appareils. Aucun compte Expo, Google ou Apple n’a été utilisé. Les fichiers d’association de domaine `assetlinks.json` et `apple-app-site-association` n’ont pas été trouvés dans le site : ils nécessitent respectivement l’empreinte du certificat Android et l’Apple Team ID du propriétaire avant de pouvoir être créés sans inventer de valeurs.
