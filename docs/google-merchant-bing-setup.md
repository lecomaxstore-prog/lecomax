# Google Merchant Center et Bing — mise en service

La partie technique du site est automatique. Aucun identifiant de compte, token de vérification ou donnée légale n’est stocké dans ce document.

## Google Merchant Center

### Source produit à enregistrer

- URL publique : `https://lecomax.com/merchant-feed.xml`
- Format : RSS 2.0 / Google Merchant XML
- Pays cible : Maroc (`MA`)
- Devise : dirham marocain (`MAD`)
- Fréquence recommandée : récupération planifiée quotidienne

Le flux sélectionne tous les produits actifs depuis la base partagée. Un produit futur devient donc éligible automatiquement après sa création/activation dans l’administration. Les modifications de prix, stock, images ou disponibilité invalident également le cache du flux.

### Étapes nécessitant le compte du propriétaire

1. Se connecter à Google Merchant Center avec le compte professionnel propriétaire.
2. Ajouter puis vérifier/revendiquer `https://lecomax.com`. Le site contient déjà une balise Google Search Console ; l’utilisateur Merchant doit être propriétaire de la même propriété Search Console.
3. Compléter l’identité légale, le service client, la politique de retour, la livraison et les paramètres fiscaux demandés. Ne rien saisir qui ne corresponde pas aux conditions réellement proposées.
4. Dans **Produits et boutique → Sources de données**, ajouter une source par URL et utiliser `https://lecomax.com/merchant-feed.xml`.
5. Programmer une récupération quotidienne et activer les mises à jour automatiques de prix, disponibilité et état.
6. Activer les fiches gratuites, puis examiner les diagnostics produit avant toute campagne payante.

Les produits sans GTIN/MPN réel sont déclarés sans identifiant unique. Ne jamais inventer un code-barres. Si de vrais identifiants fabricant sont ajoutés à la base plus tard, le modèle de données et le flux devront les exposer.

## Bing Webmaster Tools

### Étapes nécessitant le compte Microsoft du propriétaire

1. Ouvrir Bing Webmaster Tools et importer la propriété vérifiée depuis Google Search Console (méthode recommandée), ou ajouter `https://lecomax.com` manuellement.
2. Si Bing fournit une valeur `msvalidate.01`, enregistrer uniquement sa valeur dans la variable de déploiement `BING_SITE_VERIFICATION`, puis redéployer.
3. Soumettre `https://lecomax.com/sitemap.xml` dans **Sitemaps**.
4. Utiliser **URL Inspection** pour la page d’accueil et quelques pages produit, puis demander l’indexation si Bing les signale comme inconnues.
5. Attendre la collecte initiale des données et corriger les problèmes signalés par Site Scan.

### Automatisation déjà active

- `robots.txt` autorise Bingbot sur toutes les pages publiques.
- Le sitemap contient les produits actifs et leur date de modification.
- Une clé IndexNow vérifiable est disponible à la racine du domaine.
- Chaque création, modification, changement de stock, désactivation ou suppression de produit notifie automatiquement IndexNow et rafraîchit le sitemap, le flux et les pages de catalogue.

IndexNow confirme seulement la réception d’une URL ; Bing conserve la décision finale de crawl, d’indexation et de classement.
