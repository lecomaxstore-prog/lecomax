export const MOBILE_AUDIENCES = [
  "all", "android", "ios", "users", "new_customers", "active_buyers", "vip", "lapsed", "no_orders",
] as const;
export type MobileAudience = (typeof MOBILE_AUDIENCES)[number];

export const MOBILE_NOTIFICATION_CATEGORIES = [
  "general", "promotions", "new_products", "loyalty", "price_drops", "back_in_stock", "service",
] as const;
export type MobileNotificationCategory = (typeof MOBILE_NOTIFICATION_CATEGORIES)[number];

export type MobileNotificationPreferences = {
  marketing_enabled: boolean;
  promotions: boolean;
  new_products: boolean;
  loyalty: boolean;
  price_drops: boolean;
  back_in_stock: boolean;
};

export const DEFAULT_MOBILE_NOTIFICATION_PREFERENCES: MobileNotificationPreferences = {
  marketing_enabled: true,
  promotions: true,
  new_products: true,
  loyalty: true,
  price_drops: true,
  back_in_stock: true,
};

export function preferenceAllowsCategory(
  category: MobileNotificationCategory,
  preferences?: Partial<MobileNotificationPreferences> | null,
) {
  if (category === "service") return true;
  const value = { ...DEFAULT_MOBILE_NOTIFICATION_PREFERENCES, ...(preferences ?? {}) };
  if (!value.marketing_enabled) return false;
  if (category === "general") return true;
  return value[category];
}

export function isMobileAudience(value: unknown): value is MobileAudience {
  return typeof value === "string" && MOBILE_AUDIENCES.includes(value as MobileAudience);
}

export function isMobileNotificationCategory(value: unknown): value is MobileNotificationCategory {
  return typeof value === "string" && MOBILE_NOTIFICATION_CATEGORIES.includes(value as MobileNotificationCategory);
}
