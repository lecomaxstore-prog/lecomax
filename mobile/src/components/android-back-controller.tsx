import {
  router,
  useFocusEffect,
  useGlobalSearchParams,
  usePathname,
} from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Alert, BackHandler, Keyboard, Platform } from "react-native";
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
  const pathnameRef = useRef(pathname);
  const paramsRef = useRef(params);
  const routeHistoryRef = useRef<string[]>([pathname]);
  const pendingBackTargetRef = useRef<string | null>(null);
  const exitDialogVisible = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
    paramsRef.current = params;

    if (pendingBackTargetRef.current === pathname) {
      pendingBackTargetRef.current = null;
      return;
    }

    const history = routeHistoryRef.current;
    if (history.at(-1) !== pathname) history.push(pathname);
  }, [params, pathname]);

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

        const history = routeHistoryRef.current;
        const previousPath = history.length > 1
          ? history[history.length - 2]
          : null;

        if (router.canGoBack()) {
          if (previousPath) {
            history.pop();
            pendingBackTargetRef.current = previousPath;
          }
          router.back();
          return true;
        }

        // Tab switches and restored sessions do not always create a native
        // stack entry. Keep an app-level route trail so Android Back still
        // returns to the last screen the customer actually visited.
        if (previousPath) {
          history.pop();
          pendingBackTargetRef.current = previousPath;
          router.replace(previousPath as never);
          return true;
        }

        const currentPath = pathnameRef.current;
        if (isHomepagePath(currentPath)) {
          if (exitDialogVisible.current) return true;
          exitDialogVisible.current = true;
          Alert.alert(
            "Exit L'ecomax?",
            "Are you sure you want to exit L'ecomax?",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  exitDialogVisible.current = false;
                },
              },
              {
                text: "Exit",
                style: "destructive",
                onPress: () => {
                  exitDialogVisible.current = false;
                  BackHandler.exitApp();
                },
              },
            ],
            {
              cancelable: true,
              onDismiss: () => {
                exitDialogVisible.current = false;
              },
            },
          );
          return true;
        }

        // Deep links and restored screens may legitimately have no in-memory
        // stack. Route them to their safest logical parent instead of exiting.
        router.replace(
          safeParentPath(currentPath, paramsRef.current) as never,
        );
        return true;
      },
    );

    return () => subscription.remove();
  }, []);

  return null;
}
