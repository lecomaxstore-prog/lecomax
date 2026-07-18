type ShoppingProfile = {
  version: 1;
  updatedAt: number;
  categories: Record<string, number>;
  products: Record<string, number>;
};

type PersonalizableProduct = {
  slug: string;
  category?: string | null;
};

const PROFILE_KEY = "lecomax_shop_profile_v1";
const MAX_PRODUCTS = 40;
const DAILY_DECAY = 0.94;

function canPersonalize() {
  try {
    const raw = localStorage.getItem("lecomax_cookie_consent");
    if (!raw) return false;
    const consent = JSON.parse(raw);
    return consent?.preferences === true || consent?.data_collection === true;
  } catch {
    return false;
  }
}

function emptyProfile(): ShoppingProfile {
  return { version: 1, updatedAt: Date.now(), categories: {}, products: {} };
}

function readProfile(): ShoppingProfile {
  if (!canPersonalize()) return emptyProfile();
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") as ShoppingProfile | null;
    if (!parsed || parsed.version !== 1) return emptyProfile();
    const days = Math.max(0, (Date.now() - parsed.updatedAt) / 86_400_000);
    const decay = Math.pow(DAILY_DECAY, days);
    return {
      version: 1,
      updatedAt: Date.now(),
      categories: Object.fromEntries(Object.entries(parsed.categories || {}).map(([key, value]) => [key, Number(value) * decay])),
      products: Object.fromEntries(Object.entries(parsed.products || {}).map(([key, value]) => [key, Number(value) * decay])),
    };
  } catch {
    return emptyProfile();
  }
}

function saveProfile(profile: ShoppingProfile) {
  try {
    const products = Object.fromEntries(
      Object.entries(profile.products)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_PRODUCTS),
    );
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, products, updatedAt: Date.now() }));
  } catch {
    // Personalization must never interfere with shopping.
  }
}

export function recordCategorySignal(category: string | null | undefined, weight = 1) {
  if (typeof window === "undefined" || !category || !canPersonalize()) return;
  const key = category.trim().toLocaleLowerCase("fr");
  if (!key) return;
  const profile = readProfile();
  profile.categories[key] = Math.min(30, (profile.categories[key] || 0) + weight);
  saveProfile(profile);
}

export function recordProductSignal(product: PersonalizableProduct, weight = 1) {
  if (typeof window === "undefined" || !product.slug || !canPersonalize()) return;
  const profile = readProfile();
  profile.products[product.slug] = Math.min(40, (profile.products[product.slug] || 0) + weight);
  if (product.category) {
    const category = product.category.trim().toLocaleLowerCase("fr");
    profile.categories[category] = Math.min(30, (profile.categories[category] || 0) + weight * 0.65);
  }
  saveProfile(profile);
}

export function personalizeProducts<T extends PersonalizableProduct>(products: T[]): T[] {
  if (typeof window === "undefined" || !canPersonalize()) return products;
  const profile = readProfile();
  const hasSignals = Object.keys(profile.products).length > 0 || Object.keys(profile.categories).length > 0;
  if (!hasSignals) return products;

  return products
    .map((product, index) => {
      const category = product.category?.trim().toLocaleLowerCase("fr") || "";
      const preference = (profile.products[product.slug] || 0) * 1.4 + (profile.categories[category] || 0);
      return { product, index, score: preference - index * 0.12 };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ product }) => product);
}
