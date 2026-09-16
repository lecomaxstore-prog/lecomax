import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { palette } from "@/constants/theme";
import { useKeyboardViewport } from "@/hooks/use-keyboard-viewport";
import {
  isTabletWidth,
  responsiveContentWidth,
  TABLET_CONTENT_MAX_WIDTH,
} from "@/lib/responsive";

export const APP_MAX_WIDTH = TABLET_CONTENT_MAX_WIDTH;

type AppViewportValue = {
  contentWidth: number;
  windowWidth: number;
  windowHeight: number;
  horizontalInset: number;
  isConstrained: boolean;
  isTablet: boolean;
  keyboardVisible: boolean;
};

const AppViewportContext = createContext<AppViewportValue | null>(null);

export function AppViewport({ children }: PropsWithChildren) {
  const keyboard = useKeyboardViewport();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const contentWidth = responsiveContentWidth(windowWidth);
  const horizontalInset = Math.max((windowWidth - contentWidth) / 2, 0);
  const isTablet = isTabletWidth(windowWidth);
  const value = useMemo(
    () => ({
      contentWidth,
      windowWidth,
      windowHeight,
      horizontalInset,
      isConstrained: windowWidth > contentWidth,
      isTablet,
      keyboardVisible: keyboard.visible,
    }),
    [contentWidth, horizontalInset, isTablet, windowHeight, windowWidth, keyboard.visible],
  );

  return (
    <AppViewportContext.Provider value={value}>
      <View style={[styles.background, Platform.OS === "web" && keyboard.visible && {
        position: "absolute", top: keyboard.top, left: 0, height: keyboard.height,
      }]}>
        <View
          style={[
            styles.viewport,
            { width: contentWidth },
            value.isConstrained && styles.viewportConstrained,
          ]}
        >
          {children}
        </View>
      </View>
    </AppViewportContext.Provider>
  );
}

export function useAppViewport() {
  const value = useContext(AppViewportContext);
  if (!value) {
    throw new Error("useAppViewport must be used inside AppViewport");
  }
  return value;
}

export function AppViewportOverlay({
  children,
  align = "center",
  style,
}: PropsWithChildren<{
  align?: "center" | "bottom";
  style?: StyleProp<ViewStyle>;
}>) {
  const { contentWidth } = useAppViewport();
  return (
    <View
      style={[
        styles.overlay,
        align === "bottom" && styles.overlayBottom,
        style,
      ]}
    >
      <View
        style={[
          styles.overlayContent,
          align === "bottom" && styles.overlayContentBottom,
          { width: contentWidth },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#F1F3F1",
  },
  viewport: {
    flex: 1,
    maxWidth: APP_MAX_WIDTH,
    overflow: "hidden",
    backgroundColor: palette.white,
  },
  viewportConstrained: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "#DDE1DE",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  overlay: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,17,17,0.44)",
  },
  overlayBottom: {
    justifyContent: "flex-end",
  },
  overlayContent: {
    maxWidth: APP_MAX_WIDTH,
  },
  overlayContentBottom: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
