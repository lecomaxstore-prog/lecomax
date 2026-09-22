import type { CourseLanguage } from "./types";

export const translate = (lang: CourseLanguage, fr: string, en: string, ar: string) => ({ fr, en, ar })[lang];

export const JOURNEY = [
  { icon: "🌱", modules: [0, 40, 1, 2], title: ["Prendre tes repères", "Find your feet", "ابدأ بثقة"], project: ["Lire le code et sauvegarder ton premier projet", "Read code and save your first project", "اقرأ الكود واحفظ مشروعك الأول"] },
  { icon: "🎨", modules: [3, 4, 5, 28, 29, 43], title: ["Dessiner ta boutique", "Design your shop", "صمّم متجرك"], project: ["Construire une fiche produit adaptée au téléphone", "Build a product page that fits a phone", "أنشئ صفحة منتج مناسبة للهاتف"] },
  { icon: "⚡", modules: [6, 7, 8, 9, 10], title: ["Donner vie aux boutons", "Make buttons work", "اجعل الأزرار تعمل"], project: ["Calculer le prix et modifier un panier", "Calculate prices and update a cart", "احسب الأسعار وعدّل السلة"] },
  { icon: "🧩", modules: [11, 12, 13, 41, 14], title: ["Assembler ton site", "Assemble your website", "ركّب موقعك"], project: ["Relier accueil, catalogue et pages produit", "Connect home, catalog and product pages", "اربط الرئيسية والكتالوج والمنتجات"] },
  { icon: "🗄️", modules: [15, 16, 42, 18], title: ["Mémoriser et protéger", "Store and protect data", "احفظ البيانات واحمها"], project: ["Enregistrer les produits et sécuriser les comptes", "Save products and secure accounts", "احفظ المنتجات وأمّن الحسابات"] },
  { icon: "🛒", modules: [17, 21, 22, 23, 24], title: ["Faire fonctionner la boutique", "Run the shop", "شغّل المتجر"], project: ["Tester commande, paiement et confirmation", "Test an order, payment and confirmation", "اختبر الطلب والدفع والتأكيد"] },
  { icon: "🚀", modules: [19, 20, 26, 27], title: ["Tester et publier", "Test and launch", "اختبر وانشر"], project: ["Publier une boutique de démonstration vérifiée", "Launch a tested demonstration shop", "انشر متجرًا تجريبيًا مختبرًا"] },
  { icon: "🌍", modules: [25, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 44, 45, 46, 47], title: ["Développer ton activité", "Grow your business", "طوّر تجارتك"], project: ["Préparer produits, clients, livraison et projet final", "Plan products, customers, shipping and your final project", "خطّط للمنتجات والعملاء والشحن والمشروع النهائي"] },
] as const;

export const localized = (lang: CourseLanguage, values: readonly [string, string, string]) => values[lang === "fr" ? 0 : lang === "en" ? 1 : 2];
