import {
  router,
  useFocusEffect,
  useGlobalSearchParams,
  usePathname,
} from "expo-router";
import { useCallback, useEffect } from "react";
import { BackHandler, Keyboard, Platform } from "react-native";
import {
  isHomepagePath,
  safeParentPath,
  type NavigationParams,
} from "@/lib/navigation-policy";

let focusedInterceptor: (() => boolean) | null = null;

/**
 * Gives the focused screen first refusal of Android Back. Use this only for
 * transient UI that is not already handled by a native Modal.
 */
export function useAndroidBackInterceptor(
  handler: () => boolean,
  enabled = true,
) {
  useFocusEffect(
    useCallback(() => {
      if (!enabled || Platform.OS !== "android") return;
      focusedInterceptor = handler;
      return () => {
        if (focusedInterceptor === handler) focusedInterceptor = null;
      };
    }, [enabled, handler]),
  );
}

export function AndroidBackController() {
  const pathname = usePathname();
  const params = useGlobalSearchParams() as NavigationParams;
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (Keyboard.isVisible()) {
          Keyboard.dismiss();
          return true;
        }

        // Native React Native Modals receive onRequestClose before this root
        // handler. Inline sheets and focused fields register an interceptor.
        if (focusedInterceptor?.()) return true;

        // The navigator owns stack entries, route parameters and tab history.
        // A second pathname-only history can replay pages after a normal Back.
        if (router.canGoBack()) {
          router.back();
          return true;
        }

        // At Home there is no previous screen. Consume Back to keep the app open.
        if (isHomepagePath(pathname)) return true;
        // Deep links and restored screens may legitimately have no in-memory
        // stack. Route them to their safest logical parent instead of exiting.
        router.replace(
          safeParentPath(pathname, params) as never,
        );
        return true;
      },
    );

    return () => subscription.remove();
  }, [params, pathname]);

  return null;
}
