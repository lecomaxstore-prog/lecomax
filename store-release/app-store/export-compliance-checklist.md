# App Store — conformité export

Le code utilise HTTPS/TLS pour le réseau et Expo SecureStore pour des données locales sensibles. La réponse App Store Connect dépend des règles d’export applicables, du territoire et des bibliothèques réellement intégrées ; aucune réponse légale n’est inventée ici.

- [ ] Vérifier si l’application utilise uniquement le chiffrement standard fourni par le système/HTTPS.
- [ ] Examiner Supabase, PayPal, Expo Updates/Notifications et toute bibliothèque native.
- [ ] Déterminer avec un conseiller compétent si une exemption s’applique.
- [ ] Fournir la documentation requise dans App Store Connect si nécessaire.
- [ ] Aligner, si confirmé, la déclaration `ITSAppUsesNonExemptEncryption` dans la configuration iOS ; ne pas la fixer avant validation.
