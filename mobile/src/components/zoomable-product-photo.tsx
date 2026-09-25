import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AnimatedPressable } from "./animated-pressable";
import { ProductPhoto } from "./product-photo";
import { useLocale } from "@/i18n";

type Position = { scale: number; x: number; y: number };
const initial: Position = { scale: 1, x: 0, y: 0 };

/** Mounted per photo: changing images also resets zoom and pan. */
export function ZoomableProductPhoto({ uri, name }: { uri: string; name: string }) {
  const language = useLocale();
  const [position, setPosition] = useState(initial);
  const current = useRef(initial);
  const bounds = useRef({ width: 0, height: 0 });
  const start = useRef(initial);
  const distance = useRef(0);
  const pinched = useRef(false);
  const lastTap = useRef(0);
  const update = (next: Position) => {
    const scale = Math.min(4, Math.max(1, next.scale));
    const maxX = bounds.current.width * (scale - 1) / 2;
    const maxY = bounds.current.height * (scale - 1) / 2;
    current.current = { scale, x: Math.min(maxX, Math.max(-maxX, next.x)), y: Math.min(maxY, Math.max(-maxY, next.y)) };
    setPosition(current.current);
  };
  // PanResponder registers these callbacks; refs are read only during gestures.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      start.current = current.current;
      distance.current = 0;
      pinched.current = false;
    },
    onPanResponderMove: (event, gesture) => {
      const touches = event.nativeEvent.touches;
      if (touches.length >= 2) {
        pinched.current = true;
        const nextDistance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
        if (!distance.current) {
          distance.current = nextDistance;
          start.current = current.current;
        }
        if (distance.current > 0) update({ ...start.current, scale: start.current.scale * nextDistance / distance.current });
      } else if (!pinched.current) {
        update({ ...current.current, x: start.current.x + gesture.dx, y: start.current.y + gesture.dy });
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (!pinched.current && Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
        const now = Date.now();
        if (now - lastTap.current < 300) {
          update({ ...initial, scale: current.current.scale > 1 ? 1 : 2 });
          lastTap.current = 0;
        } else lastTap.current = now;
      }
    },
    onPanResponderTerminationRequest: () => false,
  }));

  return <View style={styles.container}>
    <View style={styles.stage} onLayout={event => {
      bounds.current = event.nativeEvent.layout;
      update(current.current);
    }} {...responder.panHandlers}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX: position.x }, { translateY: position.y }, { scale: position.scale }] }]}>
        <ProductPhoto uri={uri} accessibilityLabel={name} contentFit="contain" allowDownscaling={false} cachePolicy="disk" transition={0} style={StyleSheet.absoluteFill} />
      </View>
    </View>
    <View style={styles.controls}>
      <AnimatedPressable accessibilityRole="button" accessibilityLabel={language === "fr" ? "Réduire" : "Zoom out"} disabled={position.scale <= 1} onPress={() => update({ ...current.current, scale: current.current.scale - 0.5 })} style={[styles.button, position.scale <= 1 && styles.disabled]}>
        <Ionicons name="remove" size={20} color="#234735" />
      </AnimatedPressable>
      <AnimatedPressable accessibilityRole="button" accessibilityLabel={language === "fr" ? "Réinitialiser le zoom" : "Reset zoom"} onPress={() => update(initial)} style={styles.button}>
        <Text style={styles.label}>{position.scale.toFixed(1)}×</Text>
      </AnimatedPressable>
      <AnimatedPressable accessibilityRole="button" accessibilityLabel={language === "fr" ? "Agrandir" : "Zoom in"} disabled={position.scale >= 4} onPress={() => update({ ...current.current, scale: current.current.scale + 0.5 })} style={[styles.button, position.scale >= 4 && styles.disabled]}>
        <Ionicons name="add" size={20} color="#234735" />
      </AnimatedPressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  stage: { flex: 1, overflow: "hidden" },
  controls: { alignSelf: "center", flexDirection: "row", justifyContent: "center", marginTop: 8, marginBottom: 4, padding: 3, borderRadius: 25, borderWidth: 1, borderColor: "#E5EAE2", backgroundColor: "#F6F8F3" },
  button: { minWidth: 44, height: 44, paddingHorizontal: 10, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, fontWeight: "600", fontVariant: ["tabular-nums"], color: "#234735" },
  disabled: { opacity: 0.35 },
});
