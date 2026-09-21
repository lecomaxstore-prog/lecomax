import { useCallback, useEffect, useRef } from "react";
import { Keyboard, Platform, ScrollView, TextInput, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { inputScrollOffset } from "@/lib/input-scroll-offset";

export function useFormKeyboardScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const inputs = useRef(new Map<string, TextInput>());
  const focused = useRef<string | undefined>(undefined);
  const offset = useRef(0);
  const frame = useRef<number | undefined>(undefined);
  const reveal = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const name = focused.current;
      const input = name ? inputs.current.get(name) : undefined;
      if (!input) return;
      scrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, top, _width, height) => {
        input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
          if (focused.current !== name || !height || !inputHeight) return;
          const bottom = Platform.OS === "web"
            ? (window.visualViewport?.height ?? window.innerHeight) + (window.visualViewport?.offsetTop ?? 0)
            : Keyboard.metrics()?.screenY ?? Number.POSITIVE_INFINITY;
          const next = inputScrollOffset(offset.current, inputTop, inputHeight, top, Math.min(top + height, bottom));
          if (Math.abs(next - offset.current) > 1) scrollRef.current?.scrollTo({ y: next, animated: false });
        });
      });
    });
  }, []);

  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", reveal);
    const changed = Keyboard.addListener("keyboardDidChangeFrame", reveal);
    const viewport = Platform.OS === "web" ? window.visualViewport : undefined;
    viewport?.addEventListener("resize", reveal);
    return () => {
      shown.remove(); changed.remove();
      viewport?.removeEventListener("resize", reveal);
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [reveal]);

  return {
    scrollRef,
    reveal,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => { offset.current = event.nativeEvent.contentOffset.y; },
    register: (name: string, input: TextInput | null) => { if (input) inputs.current.set(name, input); else inputs.current.delete(name); },
    focus: (name: string) => { focused.current = name; reveal(); },
    blur: (name: string) => { if (focused.current === name) focused.current = undefined; },
  };
}
