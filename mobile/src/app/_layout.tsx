import "@/global.css";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Inter_900Black } from "@expo-google-fonts/inter/900Black";
import { useFonts } from "expo-font";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "@/providers/app-provider";
import { AppGate } from "@/components/app-gate";
import { AppViewport } from "@/components/app-viewport";
import { OnboardingGate } from "@/components/onboarding-gate";
import { AppUpdateGate } from "@/components/app-update-gate";
import { OtaUpdateGate } from "@/components/ota-update-gate";
import { AndroidBackController } from "@/components/android-back-controller";
import { LaunchIntro } from "@/components/launch-intro";
import { MobileNotificationLifecycle } from "@/components/mobile-notification-lifecycle";

void SplashScreen.preventAutoHideAsync();

function WebMouseScrollBridge() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const findHorizontalScroller = (
      target: EventTarget | null,
      allowFallback = true,
    ) => {
      let element = target instanceof HTMLElement ? target : null;
      while (element) {
        if (element.scrollWidth > element.clientWidth + 1) return element;
        element = element.parentElement;
      }
      if (!allowFallback) return null;
      return (
        Array.from(document.querySelectorAll<HTMLElement>("*"))
          .filter(
            (candidate) => candidate.scrollWidth > candidate.clientWidth + 1,
          )
          .sort(
            (left, right) =>
              right.scrollWidth -
              right.clientWidth -
              (left.scrollWidth - left.clientWidth),
          )[0] ?? null
      );
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;

      const accountScroller = document.getElementById("account-scroll");
      const verticalWheel =
        !event.shiftKey && Math.abs(event.deltaY) >= Math.abs(event.deltaX);
      if (
        verticalWheel &&
        accountScroller &&
        event.target instanceof Node &&
        accountScroller.contains(event.target)
      ) {
        const previous = accountScroller.scrollTop;
        accountScroller.scrollTop += event.deltaY;
        if (accountScroller.scrollTop !== previous) {
          event.preventDefault();
          return;
        }
      }

      const horizontalDelta = event.shiftKey
        ? event.deltaY
        : Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : 0;

      if (horizontalDelta) {
        const horizontalScroller = findHorizontalScroller(event.target);
        if (horizontalScroller) {
          const previous = horizontalScroller.scrollLeft;
          horizontalScroller.scrollLeft += horizontalDelta;
          if (horizontalScroller.scrollLeft !== previous)
            event.preventDefault();
        }
        return;
      }

      let element = event.target instanceof HTMLElement ? event.target : null;
      while (element) {
        const style = window.getComputedStyle(element);
        const canScrollVertically =
          element.scrollHeight > element.clientHeight + 1 &&
          (style.overflowY === "auto" || style.overflowY === "scroll");

        if (canScrollVertically) {
          const previous = element.scrollTop;
          element.scrollTop += event.deltaY;
          if (element.scrollTop !== previous) {
            event.preventDefault();
            return;
          }
        }
        element = element.parentElement;
      }

      // Expo Router clips the document viewport on web. If a nested target does
      // not expose its overflow style, scroll the element with the largest range.
      const fallback = Array.from(document.querySelectorAll<HTMLElement>("*"))
        .filter(
          (candidate) => candidate.scrollHeight > candidate.clientHeight + 1,
        )
        .sort(
          (left, right) =>
            right.scrollHeight -
            right.clientHeight -
            (left.scrollHeight - left.clientHeight),
        )[0];

      if (fallback) {
        const previous = fallback.scrollTop;
        fallback.scrollTop += event.deltaY;
        if (fallback.scrollTop !== previous) event.preventDefault();
      }
    };

    let draggedScroller: HTMLElement | null = null;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let suppressClick = false;

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      draggedScroller = findHorizontalScroller(event.target, false);
      if (!draggedScroller) return;
      dragStartX = event.clientX;
      dragStartScroll = draggedScroller.scrollLeft;
      suppressClick = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!draggedScroller) return;
      const distance = event.clientX - dragStartX;
      if (Math.abs(distance) < 4) return;
      suppressClick = true;
      draggedScroller.scrollLeft = dragStartScroll - distance;
      event.preventDefault();
    };

    const onMouseUp = () => {
      draggedScroller = null;
    };

    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };

    document.addEventListener("wheel", onWheel, {
      capture: true,
      passive: false,
    });
    document.addEventListener("mousedown", onMouseDown, { capture: true });
    document.addEventListener("mousemove", onMouseMove, {
      capture: true,
      passive: false,
    });
    document.addEventListener("mouseup", onMouseUp, { capture: true });
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("wheel", onWheel, { capture: true });
      document.removeEventListener("mousedown", onMouseDown, { capture: true });
      document.removeEventListener("mousemove", onMouseMove, { capture: true });
      document.removeEventListener("mouseup", onMouseUp, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center bg-canvas px-8 dark:bg-ink">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-lime">
        <Text className="text-3xl">!</Text>
      </View>
      <Text className="mt-6 text-center text-2xl font-black text-ink dark:text-white">
        Un imprévu est survenu
      </Text>
      <Text className="mt-3 text-center leading-6 text-muted">
        {error.message || "Lecomax n’a pas pu charger cet écran."}
      </Text>
      <Pressable
        accessibilityLabel="Réessayer"
        accessibilityRole="button"
        onPress={retry}
        className="mt-7 rounded-full bg-ink px-8 py-4 dark:bg-lime"
      >
        <Text className="font-black text-white dark:text-ink">Réessayer</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppViewport>
            <LaunchIntro>
              <AppGate>
                <OnboardingGate>
                  <WebMouseScrollBridge />
                  <MobileNotificationLifecycle />
                  <AndroidBackController />
                  <AppUpdateGate />
                  <OtaUpdateGate />
                  <StatusBar style="dark" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: "slide_from_right",
                      contentStyle: { backgroundColor: "#F5F5F5" },
                    }}
                  >
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="product/[slug]"
                      options={{ animation: "fade_from_bottom" }}
                    />
                    <Stack.Screen name="info/[topic]" />
                    <Stack.Screen
                      name="checkout"
                      options={{
                        presentation: "modal",
                        animation: "slide_from_bottom",
                      }}
                    />
                    <Stack.Screen
                      name="order-confirmation"
                      options={{ animation: "fade" }}
                    />
                    <Stack.Screen
                      name="scanner"
                      options={{ presentation: "fullScreenModal" }}
                    />
                    <Stack.Screen name="notifications" />
                    <Stack.Screen name="orders" />
                    <Stack.Screen name="addresses" />
                    <Stack.Screen name="profile" />
                    <Stack.Screen
                      name="auth"
                      options={{ presentation: "modal" }}
                    />
                  </Stack>
                </OnboardingGate>
              </AppGate>
            </LaunchIntro>
          </AppViewport>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
