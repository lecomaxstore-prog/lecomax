import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type PressableProps,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { NotificationBadge } from "@/components/notification-badge";
import { palette, typography, ui } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const MOTION_DURATION = 180;

type HeaderActionButtonProps = Pick<
  PressableProps,
  "accessibilityLabel" | "disabled" | "onPress"
> & {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  badge?: number;
  shape?: "circle" | "rounded";
  tone?: "default" | "soft" | "contrast" | "ghost";
  text?: string;
  expandedWidth?: number;
};

export const HeaderActionButton = memo(function HeaderActionButton({
  accessibilityLabel,
  active = false,
  activeIcon,
  badge = 0,
  disabled,
  icon,
  onPress,
  shape = "circle",
  tone = "default",
  text,
  expandedWidth = 88,
}: HeaderActionButtonProps) {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const interaction = useSharedValue(0);
  const pressed = useSharedValue(0);
  const focused = useSharedValue(0);
  const size = 44;
  const showText = Boolean(text) && width >= 350;
  const dark = colorScheme === "dark";
  const soft = tone === "soft";
  const contrast = tone === "contrast";
  const ghost = tone === "ghost";

  const animatedStyle = useAnimatedStyle(() => {
    const baseColor = ghost
      ? "transparent"
      : contrast
        ? dark
          ? palette.white
          : palette.ink
        : active
          ? dark
            ? palette.white
            : palette.ink
          : dark
            ? "#171817"
            : soft
              ? "#F3F6F3"
              : palette.white;
    const hoverColor = ghost
      ? "transparent"
      : contrast
        ? dark
          ? "#E6E8E6"
          : "#242624"
        : active
          ? dark
            ? "#E6E8E6"
            : "#262826"
          : dark
            ? "#292B29"
            : soft
              ? "#E8EDE9"
              : "#EEF1EE";
    const baseBorder = ghost
      ? "transparent"
      : contrast
        ? dark
          ? palette.white
          : palette.ink
        : active
          ? dark
            ? palette.white
            : palette.ink
          : dark
            ? "#3A3D3A"
            : soft
              ? "#E5EAE6"
              : "#DDE2DE";
    const hoverBorder = ghost
      ? "transparent"
      : active
        ? dark
          ? "#E6E8E6"
          : "#262826"
        : dark
          ? "#626862"
          : "#BEC6C0";

    return {
      backgroundColor: interpolateColor(
        interaction.value,
        [0, 1],
        [baseColor, hoverColor],
      ),
      borderColor: focused.value
        ? palette.greenDark
        : interpolateColor(
            interaction.value,
            [0, 1],
            [baseBorder, hoverBorder],
          ),
      shadowOpacity:
        soft || ghost
          ? 0
          : interpolate(
              interaction.value,
              [0, 1],
              [dark ? 0.2 : 0.09, dark ? 0.3 : 0.17],
            ),
      transform: [
        {
          translateY: ghost
            ? 0
            : interpolate(interaction.value, [0, 1], [0, -1.5]),
        },
        { scale: interpolate(pressed.value, [0, 1], [1, 0.96]) },
      ],
    };
  });

  const animate = (value: SharedValue<number>, next: number) => {
    value.set(withTiming(next, { duration: MOTION_DURATION }));
  };

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), selected: active }}
      disabled={disabled}
      hitSlop={2}
      onBlur={() => animate(focused, 0)}
      onFocus={() => animate(focused, 1)}
      onHoverIn={() => animate(interaction, 1)}
      onHoverOut={() => animate(interaction, 0)}
      onPress={onPress}
      onPressIn={() => animate(pressed, 1)}
      onPressOut={() => animate(pressed, 0)}
      style={[
        styles.button,
        shape === "rounded" && styles.roundedButton,
        { width: showText ? expandedWidth : size, height: size },
        (soft || ghost) && styles.flatButton,
        animatedStyle,
      ]}
    >
      <Ionicons
        color={
          ghost
            ? active
              ? palette.greenDark
              : dark
                ? palette.white
                : palette.ink
            : contrast
              ? dark
                ? palette.ink
                : palette.white
              : active
                ? dark
                  ? palette.ink
                  : palette.white
                : dark
                  ? palette.white
                  : palette.ink
        }
        name={active && activeIcon ? activeIcon : icon}
        size={21}
      />
      {showText ? (
        <Text
          allowFontScaling={false}
          style={[
            styles.buttonText,
            {
              color: ghost
                ? active
                  ? palette.greenDark
                  : dark
                    ? palette.white
                    : palette.ink
                : contrast
                  ? dark
                    ? palette.ink
                    : palette.white
                  : active
                    ? dark
                      ? palette.ink
                      : palette.white
                    : dark
                      ? palette.white
                      : palette.ink,
            },
          ]}
        >
          {text}
        </Text>
      ) : null}
      {ghost ? (
        <View pointerEvents="none" style={styles.inlineBadge}>
          <NotificationBadge count={badge} />
        </View>
      ) : (
        <NotificationBadge count={badge} />
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  button: {
    position: "relative",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    borderWidth: ui.border.width,
    borderRadius: ui.radius.pill,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  roundedButton: {
    borderRadius: 12,
  },
  flatButton: { elevation: 0 },
  inlineBadge: { position: "absolute", top: 7, right: 5 },
  buttonText: {
    fontFamily: typography.bold,
    fontSize: 11,
    letterSpacing: -0.1,
  },
});
