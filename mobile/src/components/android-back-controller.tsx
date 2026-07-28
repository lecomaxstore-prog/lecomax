import {
  router,
  useFocusEffect,
  useGlobalSearchParams,
  usePathname,
} from "expo-router";
import { useCallback, useEffect } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import {
  isHomepagePath,
  safeParentPath,
  type NavigationParams,
} from "@/lib/navigation-policy";

let focusedInterceptor: (() => boolean) | null = null;

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
        if (focusedInterceptor?.()) return true;

        if (router.canGoBack()) {
          // Consume the native event ourselves. Returning false here can fall
          // through to Android and close the activity on devices where the
          // navigation container does not receive a second back callback.
          router.back();
          return true;
        }

        if (isHomepagePath(pathname)) {
          // Keep the app open at its root. Android must never receive an
          // unhandled Back event, otherwise it closes the application.
          ToastAndroid.show("Vous êtes déjà sur l’accueil", ToastAndroid.SHORT);
          return true;
        }

        router.replace(safeParentPath(pathname, params) as never);
        return true;
      },
    );
    return () => subscription.remove();
  }, [params, pathname]);

  return null;
}
