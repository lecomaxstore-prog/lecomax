# Google Play — Data safety (préparation)

Ne recopiez pas ces éléments comme réponses définitives sans audit backend. Dans Play Console, déclarer les données collectées ou partagées par l’application **et ses SDK**, leur caractère obligatoire/facultatif, leur finalité, le chiffrement en transit et la suppression.

Catégories à examiner : informations personnelles (nom, e-mail, téléphone, adresse), informations financières/achats, activité dans l’app (favoris, panier, recherche, produits consultés), contenu utilisateur (avis/photo), identifiants utilisateur, identifiants appareil/token push et diagnostics/journaux serveur.

- [ ] Cartographier chaque champ API/base de données vers la taxonomie Play Console.
- [ ] Confirmer tous les sous-traitants et si le transfert constitue un « partage » selon Google.
- [ ] Confirmer HTTPS/chiffrement en transit pour chaque endpoint et fournisseur.
- [ ] Confirmer la suppression de compte depuis l’app et fournir l’URL web demandée par Google.
- [ ] Distinguer notifications transactionnelles et marketing.
- [ ] Vérifier si analytics, publicité ou suivi existent côté site/backend malgré leur absence apparente dans les dépendances mobiles.
- [ ] Faire correspondre exactement la fiche Data safety et la politique publiée.
