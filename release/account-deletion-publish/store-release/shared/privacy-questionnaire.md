# Questionnaire confidentialité — validation obligatoire

Ce document décrit ce qui est observable dans le code, pas une déclaration juridique. Le propriétaire du backend et le responsable légal doivent confirmer collecte, partage, finalités, conservation et suppression.

| Catégorie potentielle | Usage observé | Liée au compte ? | À confirmer |
| --- | --- | --- | --- |
| Nom, prénom, e-mail, téléphone | compte, commande, livraison, support | Oui lorsque connecté/commande | conservation et accès interne |
| Adresse et ville | livraison et carnet d’adresses | Oui | prestataires de livraison et durée |
| Identifiants utilisateur | authentification Supabase | Oui | politique Supabase et journaux |
| Photo de profil | personnalisation facultative | Oui | stockage, suppression, accès public |
| Panier, favoris, produits consultés | expérience d’achat et synchronisation | Potentiellement | durée et usage analytique |
| Commandes, montant, statut | achat, support et suivi | Oui | obligations comptables et partage livraison |
| Données de paiement | PayPal est proposé ; capture côté serveur | Oui à la commande | confirmer exactement ce que Lecomax stocke/reçoit de PayPal |
| Token push et préférences | notifications commandes/marketing | Associable à l’appareil/compte | durée, désinscription et fournisseur Expo |
| Avis et contenu associé | avis produit | Oui ou pseudonyme | modération, visibilité et suppression |
| Messages de support/newsletter | support et communication | Selon saisie | consentement, prestataire e-mail et durée |
| Diagnostics/usage | services réseau observés, détails backend inconnus | Inconnu | analytics, crash reporting, IP, logs et géolocalisation dérivée |

## Questions à répondre avant les stores

1. Quelles données le serveur journalise-t-il (IP, appareil, requêtes, erreurs) et combien de temps ?
2. Quels sous-traitants reçoivent des données : Supabase, Expo, PayPal, hébergeur, e-mail/SMS, livraison, analytics ?
3. Les données sont-elles utilisées pour publicité, suivi inter-apps, profilage ou personnalisation ?
4. Les messages marketing nécessitent-ils un consentement distinct et comment se désabonner ?
5. Quelle procédure répond aux demandes d’accès, correction, portabilité et suppression ?
6. La suppression du compte efface-t-elle avatar, favoris, adresses et tokens, tout en conservant les pièces légalement obligatoires ?
7. L’application vise-t-elle les enfants ? Si non, quel âge minimum est défini dans les conditions ?
8. Les transferts internationaux et mesures de sécurité sont-ils documentés ?

## Permissions natives observées

- **Caméra :** scanner un code produit et, via le sélecteur d’image, prendre une photo de profil.
- **Photos :** choisir volontairement une photo de profil.
- **Notifications :** recevoir des informations de commande et communications activées par l’utilisateur.
- **Microphone :** non utilisé et explicitement désactivé dans la configuration caméra Android.
- **Non observées :** localisation, contacts, tracking publicitaire, Bluetooth et accès brut au stockage.
