# App Store — App Privacy (préparation)

Le responsable produit/backend doit répondre dans App Store Connect selon les données collectées par Lecomax et ses partenaires. Examiner au minimum : coordonnées, adresse physique, identifiant utilisateur, achats, informations de paiement reçues après PayPal, contenu utilisateur, historique de recherche/navigation, identifiants appareil/token push et diagnostics.

Pour chaque type, confirmer : collecte effective, lien avec l’identité, suivi, finalité (fonctionnalité, personnalisation, analytics, marketing, support) et tiers destinataires. Le code mobile ne contient pas de SDK publicitaire ou de tracking observé, mais cela ne prouve pas l’absence de traitement serveur.

- [ ] Audit backend et fournisseurs terminé.
- [ ] Les réponses couvrent Supabase, Expo Notifications, PayPal, hébergement, livraison et communications.
- [ ] Aucun usage « tracking » n’est déclaré absent sans confirmation métier.
- [ ] La politique publique correspond aux réponses.
- [ ] La suppression de compte et des données a été testée.
