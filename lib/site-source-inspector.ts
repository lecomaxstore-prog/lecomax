export type SourceSelection = { path: string; anchor: string; line?: number; tag?: string; label?: string; href?: string; exact?: boolean };

/** Attach only inside the same-origin learning preview, never the normal storefront. */
export function attachSourceInspector(doc: Document, fallback: string, onSelect: (selection: SourceSelection) => void) {
  const style = doc.createElement("style");
  style.textContent = "* { cursor: crosshair !important; } [data-code-hover] { outline: 3px solid #059669 !important; outline-offset: -3px; } html[data-learning-hide-notices] [data-source-file='components/CookieBanner.tsx'], html[data-learning-hide-notices] [data-source-file='components/PushPrompt.tsx'], html[data-learning-hide-notices] [data-source-file='components/ChatWidget.tsx'], html[data-learning-hide-notices] [data-source-file='components/BackToTop.tsx'], html[data-learning-hide-notices] .eco-chat-launcher { display: none !important; }";
  doc.head.appendChild(style);
  let highlighted: Element | null = null;
  const region = (event: Event) => {
    const target = event.target as Element | null;
    // SVG strokes belong to their visible icon/control, not a useful first lesson.
    const visible = target?.closest?.("svg") ?? target;
    return visible?.closest?.("[data-source-file]") ?? visible?.closest?.("main") ?? null;
  };
  const hover = (event: Event) => {
    highlighted?.removeAttribute("data-code-hover");
    highlighted = region(event);
    highlighted?.setAttribute("data-code-hover", "");
  };
  const click = (event: Event) => {
    event.preventDefault(); event.stopImmediatePropagation();
    const element = region(event);
    const path = element?.getAttribute("data-source-file");
    const line = Number(element?.getAttribute("data-source-line")) || undefined;
    const link = element?.closest("a");
    const target = event.target as Element | null;
    onSelect({ path: path || fallback, anchor: path ? `data-source-file="${path}"` : "return (", line,
      tag: element?.tagName.toLowerCase(),
      label: (element?.getAttribute("aria-label") || element?.getAttribute("alt") || element?.textContent || element?.tagName || "").trim().replace(/\s+/g, " ").slice(0, 80),
      href: link?.getAttribute("href") || undefined, exact: !!line && (target === element || target?.closest?.("svg") === element),
    });
  };
  // Capture before React handlers so selecting a cart button cannot add an item.
  doc.addEventListener("click", click, true);
  doc.addEventListener("submit", click, true);
  doc.addEventListener("pointerover", hover, true);
  return () => {
    doc.removeEventListener("click", click, true);
    doc.removeEventListener("submit", click, true);
    doc.removeEventListener("pointerover", hover, true);
    highlighted?.removeAttribute("data-code-hover"); style.remove();
    doc.documentElement.removeAttribute("data-learning-hide-notices");
  };
}
