"use client";

import { useEffect } from "react";

export default function SiteProtection() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // Disable inspect/devtools keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") { e.preventDefault(); return; }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") { e.preventDefault(); return; }
      // Ctrl+Shift+C (Inspect element)
      if (e.ctrlKey && e.shiftKey && e.key === "C") { e.preventDefault(); return; }
      // Ctrl+U (View source)
      if (e.ctrlKey && e.key === "u") { e.preventDefault(); return; }
      // Ctrl+S (Save page)
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); return; }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
