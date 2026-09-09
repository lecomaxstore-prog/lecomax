import { msg } from "@/i18n";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiRequest } from "@/lib/api-client";
import {
  secureGetItem,
  secureRemoveItem,
  secureSetItem,
} from "@/lib/secure-storage";

const PUSH_TOKEN_KEY = "lecomax.push-token";
const INSTALLATION_ID_KEY = "lecomax.installation-id";
const PUSH_DISABLED_KEY = "lecomax.push-disabled";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function getInstallationId() {
  const existing = await secureGetItem(INSTALLATION_ID_KEY);
  if (existing) return existing;
  const generated = `install_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  await secureSetItem(INSTALLATION_ID_KEY, generated);
  return generated;
}

async function configureAndroidChannels() {
  if (Platform.OS !== "android") return;
  await Promise.all([
    Notifications.setNotificationChannelAsync("orders", {
      name: msg("notifications.ordersAndAccount"),
      description: msg("notifications.orderTrackingAndImportantAccountInformation"),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#3ECF4C",
      sound: "default",
    }),
    Notifications.setNotificationChannelAsync("marketing", {
      name: msg("notifications.offersAndNewArrivals"),
      description: msg("notifications.promotionsNewProductsAndLEcomaxBenefits"),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180],
      lightColor: "#3ECF4C",
      sound: "default",
    }),
  ]);
}

export async function registerForPushNotifications(
  _userId?: string,
  options: { requestPermission?: boolean } = {},
) {
  if (!Device.isDevice || Platform.OS === "web") return null;
  if (options.requestPermission === false && await secureGetItem(PUSH_DISABLED_KEY) === "true") return null;
  await configureAndroidChannels();
  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === "granted"
      ? current
      : options.requestPermission === false
        ? current
        : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error(msg("notifications.theEasProjectIsNotConfiguredForNotifications"));
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const installationId = await getInstallationId();
  await apiRequest<{ ok: true }>("/api/mobile/push-subscribe", {
    method: "POST",
    body: JSON.stringify({ token, platform: Platform.OS, installationId }),
  });
  await secureSetItem(PUSH_TOKEN_KEY, token);
  await secureRemoveItem(PUSH_DISABLED_KEY);
  return token;
}

export async function getPushNotificationState() {
  if (!Device.isDevice || Platform.OS === "web") {
    return { supported: false, enabled: false, status: "unsupported" as const };
  }
  const permission = await Notifications.getPermissionsAsync();
  const token = await secureGetItem(PUSH_TOKEN_KEY);
  const disabled = await secureGetItem(PUSH_DISABLED_KEY) === "true";
  return {
    supported: true,
    enabled: permission.status === "granted" && Boolean(token) && !disabled,
    status: permission.status,
  };
}

export async function disablePushNotifications() {
  const token = await secureGetItem(PUSH_TOKEN_KEY);
  const installationId = await getInstallationId();
  if (token) {
    await apiRequest<{ ok: true }>("/api/mobile/push-subscribe", {
      method: "DELETE",
      body: JSON.stringify({ token, installationId }),
    });
  }
  await secureRemoveItem(PUSH_TOKEN_KEY);
  await secureSetItem(PUSH_DISABLED_KEY, "true");
}
