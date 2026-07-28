import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { getMobileNotificationInbox } from "@/services/mobile-notifications";
import { openMobileNotificationLink } from "@/lib/mobile-notification-navigation";
import { useNotificationStore } from "@/stores/notifications";
import { registerForPushNotifications } from "@/services/notifications";
import { supabase } from "@/lib/supabase";

export function MobileNotificationLifecycle() {
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  useEffect(() => {
    void getMobileNotificationInbox()
      .then((inbox) => setUnreadCount(inbox.unreadCount))
      .catch(() => {});

    // Expo Notifications response listeners are native-only. The web shim can
    // intentionally omit these methods, so never call them in a browser.
    if (Platform.OS === "web") return;

    void registerForPushNotifications(undefined, { requestPermission: false }).catch(() => {});
    const auth = supabase.auth.onAuthStateChange(() => {
      void registerForPushNotifications(undefined, { requestPermission: false }).catch(() => {});
    });
    const tokenChanges = Notifications.addPushTokenListener(() => {
      void registerForPushNotifications(undefined, { requestPermission: false }).catch(() => {});
    });

    const received = Notifications.addNotificationReceivedListener(() => {
      useNotificationStore.getState().incrementUnreadCount();
    });
    const responses = Notifications.addNotificationResponseReceivedListener((response) => {
      openMobileNotificationLink(response.notification.request.content.data?.url);
    });
    const getLastResponse = Notifications.getLastNotificationResponseAsync;
    if (typeof getLastResponse === "function") {
      void getLastResponse()
        .then((response) => {
          if (response) openMobileNotificationLink(response.notification.request.content.data?.url);
        })
        .catch(() => {});
    }
    return () => {
      received.remove();
      responses.remove();
      tokenChanges.remove();
      auth.data.subscription.unsubscribe();
    };
  }, [setUnreadCount]);

  return null;
}
