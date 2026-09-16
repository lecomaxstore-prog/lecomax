# Checklist de publication

## Projet et qualité

- [x] Identité Android/iOS cohérente et versionnée.
- [x] Profils EAS development, preview et production configurés.
- [x] Production Android configurée en AAB ; iOS utilise le format store EAS par défaut.
- [x] Variables EAS associées à leurs environnements.
- [x] Permission microphone Android supprimée du scanner.
- [x] Icônes, splash, icône de notification et favicon validés techniquement.
- [x] Export de production Android/iOS/web réussi.
- [ ] Tester une installation propre Android et iOS sur appareils physiques.
- [ ] Tester téléphone, tablette/iPad, thème clair/sombre et grandes tailles de texte.
- [ ] Tester inscription, connexion, déconnexion et réinitialisation du mot de passe.
- [ ] Tester panier, commande, paiement à la livraison et PayPal en production.
- [ ] Tester notifications reçues/ouvertes et deep links HTTPS/`lecomax://`.
- [ ] Vérifier l’accessibilité avec TalkBack et VoiceOver.

## Comptes, sécurité et données

- [ ] Confirmer la propriété du projet EAS et des bundle IDs.
- [ ] Ajouter les variables publiques Supabase à l’environnement EAS `production`.
- [ ] Configurer les credentials EAS dans les comptes du propriétaire.
- [ ] Créer et déployer `/.well-known/assetlinks.json` avec l’empreinte de signature Android réelle.
- [ ] Créer et déployer `/.well-known/apple-app-site-association` avec l’Apple Team ID réel.
- [ ] Faire valider la politique de confidentialité par le responsable légal.
- [ ] Compléter les questionnaires de données avec le responsable produit/backend.
- [ ] Fournir un compte de démonstration si une zone essentielle exige une connexion.
- [ ] Vérifier la procédure de suppression de compte et les délais de conservation.

## Fiches store

- [ ] Confirmer le nom, la catégorie « Shopping » et le texte marketing.
- [ ] Confirmer les URLs de confidentialité, support et marketing en production.
- [ ] Créer des captures réelles sur chaque classe d’écran demandée par les portails.
- [ ] Créer une feature graphic Google Play 1024×500 à partir des sources de marque.
- [ ] Compléter Data safety, App Privacy, classement du contenu et export compliance.
- [ ] Vérifier que prix, stock, livraison et conditions correspondent au site public.
- [ ] Importer les artefacts signés puis effectuer les tests internes/TestFlight.
