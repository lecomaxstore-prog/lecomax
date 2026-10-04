export type AdminTool = { label: string; description: string; href: string; permission: string | string[] | null };
export type AdminWorkspace = { title: string; description: string; tools: AdminTool[] };
// null means owner-only, matching the admin route guards.
export const ADMIN_WORKSPACES: AdminWorkspace[] = [
  { title: 'Commandes & livraison', description: 'Suivre une vente, préparer un colis et gérer un retour.', tools: [
    { label: 'Commandes', description: 'Confirmer, préparer et expédier', href: '/admin/orders', permission: 'orders.view' },
    { label: 'Livraison', description: 'Zones, tarifs et délais', href: '/admin/shipping', permission: 'shipping.edit' },
    { label: 'Retours', description: 'Traiter les demandes après une vente', href: '/admin/returns', permission: 'returns.edit' },
    { label: 'Paniers abandonnés', description: 'Retrouver les commandes non terminées', href: '/admin/abandoned-carts', permission: 'carts.view' },
  ] },
  { title: 'Catalogue & stock', description: 'Présenter vos produits et garder le stock à jour.', tools: [
    { label: 'Ajouter un produit', description: 'Créer une nouvelle fiche produit', href: '/admin/products?new=1', permission: ['products.view', 'products.create'] },
    { label: 'Produits', description: 'Consulter et organiser le catalogue', href: '/admin/products', permission: 'products.view' },
    { label: 'Stock', description: 'Réapprovisionner et vérifier les alertes', href: '/admin/stock', permission: 'stock.edit' },
    { label: 'Catégories', description: 'Organiser les rayons de la boutique', href: '/admin/categories', permission: 'categories.edit' },
    { label: 'Médiathèque', description: 'Gérer les photos et les fichiers', href: '/admin/media', permission: 'media.manage' },
  ] },
  { title: 'Clients & assistance', description: 'Répondre aux clients et améliorer leur expérience.', tools: [
    { label: 'Clients', description: 'Retrouver les fiches clients', href: '/admin/customers', permission: 'customers.view' },
    { label: 'Messages', description: 'Répondre aux messages de la boutique', href: '/admin/messages', permission: 'messages.view' },
    { label: 'Assistance mobile', description: 'Suivre les conversations de l’application', href: '/admin/support', permission: null },
    { label: 'Réponses du chatbot', description: 'Mettre à jour sa base de connaissance', href: '/admin/chat-kb', permission: null },
    { label: 'Avis clients', description: 'Lire et modérer les avis', href: '/admin/reviews', permission: 'reviews.edit' },
  ] },
  { title: 'Boutique & marketing', description: 'Actualiser la vitrine et préparer vos offres.', tools: [
    { label: 'Bannières', description: 'Mettre en avant vos collections', href: '/admin/banners', permission: 'banners.edit' },
    { label: 'Promotions', description: 'Préparer les offres et les réductions', href: '/admin/promotions', permission: 'promotions.edit' },
    { label: 'Codes promo', description: 'Gérer les coupons', href: '/admin/coupons', permission: 'promotions.edit' },
    { label: 'Notifications', description: 'Préparer les notifications push', href: '/admin/push', permission: 'push.send' },
    { label: 'Newsletter', description: 'Gérer les inscriptions et campagnes', href: '/admin/newsletter', permission: 'newsletter.edit' },
  ] },
  { title: 'Équipe & configuration', description: 'Retrouver les réglages et les changements de la boutique.', tools: [
    { label: 'Paramètres', description: 'Configuration générale de la boutique', href: '/admin/settings', permission: 'settings.edit' },
    { label: 'Équipe', description: 'Gérer les membres et leurs accès', href: '/admin/staff', permission: 'staff.manage' },
    { label: 'Rôles', description: 'Définir les permissions de chaque rôle', href: '/admin/roles', permission: 'roles.manage' },
    { label: 'Approbations', description: 'Examiner les demandes de changement', href: '/admin/approvals', permission: null },
    { label: 'Historique', description: 'Voir qui a modifié les prix, stocks et réglages', href: '/admin/activity', permission: null },
  ] },
  { title: 'Comprendre & progresser', description: 'Analyser la boutique et apprendre à la construire.', tools: [
    { label: 'Analytiques', description: 'Explorer les résultats de la boutique', href: '/admin/analytics', permission: 'analytics.view' },
    { label: 'Application mobile', description: 'Configuration et gestion de l’application', href: '/admin/mobile-app', permission: 'settings.edit' },
    { label: 'Versions Android', description: 'Gérer les versions publiées', href: '/admin/app-releases', permission: 'settings.edit' },
    { label: 'Apprendre avec mon site', description: 'Leçons guidées, code et exercices', href: '/admin/how-it-was-built', permission: null },
  ] },
];

export function visibleAdminWorkspaces(permissions: string[] | null | undefined, query = ''): AdminWorkspace[] {
  if (permissions === undefined) return [];
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return ADMIN_WORKSPACES.map(workspace => ({ ...workspace, tools: workspace.tools.filter(tool => {
    const allowed = permissions === null || (tool.permission !== null && (Array.isArray(tool.permission) ? tool.permission.every(permission => permissions.includes(permission)) : permissions.includes(tool.permission)));
    const text = normalize(`${workspace.title} ${tool.label} ${tool.description}`);
    return allowed && terms.every(term => text.includes(term));
  }) })).filter(workspace => workspace.tools.length > 0);
}
