import { PropsWithChildren } from "react";
import { Platform, ScrollView, type StyleProp, type ViewStyle } from "react-native";

type HorizontalRailProps = PropsWithChildren<{
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  decelerationRate?: "fast" | "normal" | number;
  disableIntervalMomentum?: boolean;
  snapToAlignment?: "start" | "center" | "end";
  snapToInterval?: number;
  style?: StyleProp<ViewStyle>;
}>;

const webRailStyle = Platform.OS === "web"
  ? ({
      overflowX: "auto",
      overflowY: "hidden",
      touchAction: "pan-y pan-x",
      WebkitOverflowScrolling: "touch",
    } as unknown as StyleProp<ViewStyle>)
  : undefined;

export function HorizontalRail({
  children,
  className = "",
  contentContainerStyle,
  decelerationRate = "fast",
  disableIntervalMomentum = false,
  snapToAlignment,
  snapToInterval,
  style,
}: HorizontalRailProps) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      directionalLockEnabled={false}
      showsHorizontalScrollIndicator={false}
      alwaysBounceHorizontal={false}
      decelerationRate={decelerationRate}
      disableIntervalMomentum={disableIntervalMomentum}
      snapToAlignment={snapToAlignment}
      snapToInterval={snapToInterval}
      scrollEventThrottle={16}
      contentContainerStyle={contentContainerStyle}
      style={[webRailStyle, style]}
      className={`cursor-grab select-none active:cursor-grabbing ${className}`}
    >
      {children}
    </ScrollView>
  );
}
