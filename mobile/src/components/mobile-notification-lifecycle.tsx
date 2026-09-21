import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { getMobileNotificationInbox } from "@/services/mobile-notifications";
import { openMobileNotificationLink } from "@/lib/mobile-notification-navigation";
import { useNotificationStore } from "@/stores/notifications";
import { registerForPushNotifications } from "@/services/notifications";
import { supabase } from "@/lib/supabase";

export function MobileNotificationLifecycle() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["mobile-notifications"] });
      void getMobileNotificationInbox().then(inbox => setUnreadCount(inbox.unreadCount)).catch(() => {});
    };
    let disposed = false;
    let registering = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const register = (attempt = 0) => {
      if (disposed || registering) return;
      clearTimeout(retryTimer);
      registering = true;
      void registerForPushNotifications(undefined, { requestPermission: false })
        .then(() => {
          if (!disposed) void queryClient.invalidateQueries({ queryKey: ["push-permission"] });
        })
        .catch(() => {
          // Recover from a temporary offline launch without prompting again.
          if (!disposed && attempt < 2) retryTimer = setTimeout(() => register(attempt + 1), 15_000 * (attempt + 1));
        })
        .finally(() => { registering = false; });
    };
    refresh();
    register();
    const foreground = AppState.addEventListener("change", state => {
      if (state === "active") { refresh(); register(); }
    });
    const auth = supabase.auth.onAuthStateChange(() => {
      // Run after the Supabase auth callback releases its session lock.
      setTimeout(() => {
        queryClient.removeQueries({ queryKey: ["mobile-notifications"] });
        queryClient.removeQueries({ queryKey: ["mobile-notification-preferences"] });
        refresh(); register();
      }, 0);
    });
    if (Platform.OS === "web") {
      const message = (event: MessageEvent) => { if (event.data?.type === "LECOMAX_NOTIFICATION") refresh(); };
      if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", message);
      return () => {
        disposed = true; clearTimeout(retryTimer);
        foreground.remove(); auth.data.subscription.unsubscribe();
        if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("message", message);
      };
    }
    const tokenChanges = Notifications.addPushTokenListener(() => {
      register();
    });

    const received = Notifications.addNotificationReceivedListener(() => {
      refresh();
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
      disposed = true; clearTimeout(retryTimer);
      foreground.remove();
      received.remove();
      responses.remove();
      tokenChanges.remove();
      auth.data.subscription.unsubscribe();
    };
  }, [setUnreadCount, queryClient]);

  return null;
}
