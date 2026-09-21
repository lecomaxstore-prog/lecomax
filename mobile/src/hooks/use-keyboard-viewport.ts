import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboardViewport() {
  const [state, setState] = useState({ visible: false, height: 0, top: 0 });

  useEffect(() => {
    if (Platform.OS !== "web") {
      const show = Keyboard.addListener("keyboardDidShow", () =>
        setState({ visible: true, height: 0, top: 0 }),
      );
      const hide = Keyboard.addListener("keyboardDidHide", () =>
        setState({ visible: false, height: 0, top: 0 }),
      );
      return () => { show.remove(); hide.remove(); };
    }
    const viewport = window.visualViewport;
    if (!viewport) return;
    let frame = 0;
    let fullHeight = window.innerHeight;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        const editing = active instanceof HTMLElement &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
        // Pinch zoom must keep its normal browser behavior.
        const visible = editing && Math.abs(viewport.scale - 1) < 0.05 &&
          Math.max(fullHeight, window.innerHeight) - viewport.height > 100;
        if (!editing) fullHeight = window.innerHeight;
        const height = visible ? viewport.height : 0;
        const top = visible ? viewport.offsetTop : 0;
        setState((previous) => previous.visible === visible && previous.height === height && previous.top === top
          ? previous
          : { visible, height, top });
      });
    };
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);

  return state;
}
