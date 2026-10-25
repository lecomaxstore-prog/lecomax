import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
export function GentleReveal({ children }: { children: React.ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let active = true;
    const reveal = (reduce: boolean) => {
      if (!active) return;
      opacity.stopAnimation();
      if (reduce) {
        opacity.setValue(1);
        return;
      }
      opacity.setValue(0.7);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    };
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(reveal)
      .catch(() => opacity.setValue(1));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', reveal);
    return () => {
      active = false;
      sub.remove();
      opacity.stopAnimation();
    };
  }, [opacity]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
