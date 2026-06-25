export const PERMISSION_CATEGORIES = [
  {
    id: "catalogue",
    label: "Catalogue",
    color: "#f59e0b",
    permissions: [
      { slug: "products.view",    label: "Voir les produits" },
      { slug: "products.create",  label: "Créer des produits" },
      { slug: "products.edit",    label: "Modifier les produits" },
      { slug: "products.delete",  label: "Supprimer des produits" },
      { slug: "categories.edit",  label: "Gérer les catégories" },
      { slug: "stock.edit",       label: "Gérer le stock" },
      { slug: "media.manage",     label: "Médiathèque" },
      { slug: "pages.edit",       label: "Pages contenu" },
      { slug: "banners.edit",     label: "Bannières & visuels" },
      { slug: "studio.access",    label: "Studio créatif" },
      { slug: "size-guide.edit",  label: "Guide des tailles" },
    ],
  },
  {
    id: "ventes",
    label: "Ventes",
    color: "#22c55e",
    permissions: [
      { slug: "orders.view",      label: "Voir les commandes" },
      { slug: "orders.edit",      label: "Modifier les commandes" },
      { slug: "customers.view",   label: "Voir les clients" },
      { slug: "analytics.view",   label: "Analytiques & rapports" },
      { slug: "recordings.view",  label: "Enregistrements sessions" },
      { slug: "loyalty.edit",     label: "Programme fidélité" },
      { slug: "carts.view",       label: "Paniers abandonnés" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    color: "#8b5cf6",
    permissions: [
      { slug: "promotions.edit",   label: "Promotions & codes promo" },
      { slug: "newsletter.edit",   label: "Newsletter" },
      { slug: "push.send",         label: "Notifications push" },
      { slug: "ads.edit",          label: "Publicités" },
      { slug: "broadcast.send",    label: "Broadcast SMS/Email" },
      { slug: "announcement.edit", label: "Annonces site" },
    ],
  },
  {
    id: "sav",
    label: "SAV & Support",
    color: "#3b82f6",
    permissions: [
      { slug: "messages.view",    label: "Voir les messages" },
      { slug: "messages.reply",   label: "Répondre aux messages" },
      { slug: "reviews.edit",     label: "Gérer les avis clients" },
      { slug: "returns.edit",     label: "Gérer les retours" },
    ],
  },
  {
    id: "logistique",
    label: "Logistique",
    color: "#6b7280",
    permissions: [
      { slug: "shipping.edit",    label: "Zones de livraison" },
    ],
  },
  {
    id: "config",
    label: "Configuration",
    color: "#ef4444",
    permissions: [
      { slug: "settings.edit",    label: "Paramètres du site" },
      { slug: "staff.manage",     label: "Gérer l'équipe" },
      { slug: "roles.manage",     label: "Gérer les rôles" },
    ],
  },
];

export const ALL_PERMISSION_SLUGS = PERMISSION_CATEGORIES.flatMap(c =>
  c.permissions.map(p => p.slug)
);

export function getPermissionLabel(slug: string): string {
  for (const cat of PERMISSION_CATEGORIES) {
    const p = cat.permissions.find(p => p.slug === slug);
    if (p) return p.label;
  }
  return slug;
}
