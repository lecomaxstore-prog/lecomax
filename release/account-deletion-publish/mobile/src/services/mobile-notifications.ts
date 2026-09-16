import { Platform } from "react-native";
import { z } from "zod";
import { apiRequest, apiRequestValidated } from "@/lib/api-client";

const notificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(240),
  deepLink: z.string().min(1).max(500),
  imageUrl: z.string().url().nullable(),
  publishedAt: z.string(),
  read: z.boolean(),
});

const inboxSchema = z.object({
  items: z.array(notificationSchema).max(50),
  unreadCount: z.number().int().nonnegative(),
});

export const notificationPreferencesSchema = z.object({
  marketing_enabled: z.boolean(),
  promotions: z.boolean(),
  new_products: z.boolean(),
  loyalty: z.boolean(),
  price_drops: z.boolean(),
  back_in_stock: z.boolean(),
});
const preferencesResponseSchema = z.object({ preferences: notificationPreferencesSchema });

export type MobileNotification = z.infer<typeof notificationSchema>;
export type MobileNotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export function getMobileNotificationInbox() {
  return apiRequestValidated(
    `/api/mobile/notifications?platform=${Platform.OS}`,
    inboxSchema,
    { authenticated: false },
  );
}

export function markMobileNotificationsRead(ids: string[]) {
  return apiRequest<{ ok: true }>("/api/mobile/notifications", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ ids }),
  });
}

export function getMobileNotificationPreferences() {
  return apiRequestValidated("/api/mobile/notification-preferences", preferencesResponseSchema, { authenticated: true });
}

export function updateMobileNotificationPreferences(preferences: MobileNotificationPreferences) {
  return apiRequestValidated("/api/mobile/notification-preferences", preferencesResponseSchema, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(preferences),
  });
}
