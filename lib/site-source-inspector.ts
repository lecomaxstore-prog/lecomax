export type SourceSelection = { path: string; anchor: string; line?: number; tag?: string; label?: string; href?: string; exact?: boolean; fileOnly?: boolean; imagePath?: string };

export function visibleImagePath(value: string, base: string): string | undefined {
  try {
    let url = new URL(value, base);
    if (url.pathname === "/_next/image") url = new URL(url.searchParams.get("url") || "", base);
    if (!["http:", "https:"].includes(url.protocol)) return;
    // Exclude signed query tokens and credentials; show only the visible resource path.
    return url.pathname.slice(0, 500);
  } catch { return; }
}

/** Attach only inside the same-origin learning preview, never the normal storefront. */
export function attachSourceInspector(doc: Document, fallback: string, onSelect: (selection: SourceSelection) => void, onOpenLink?: (href: string) => boolean) {
  const style = doc.createElement("style");
  style.textContent = "* { cursor: crosshair !important; } [data-code-hover] { outline: 3px solid #059669 !important; outline-offset: -3px; } html[data-learning-hide-notices] [data-source-file='components/CookieBanner.tsx'], html[data-learning-hide-notices] [data-source-file='components/PushPrompt.tsx'], html[data-learning-hide-notices] [data-source-file='components/ChatWidget.tsx'], html[data-learning-hide-notices] [data-source-file='components/BackToTop.tsx'], html[data-learning-hide-notices] .eco-chat-launcher { display: none !important; }";
  doc.head.appendChild(style);
  let highlighted: Element | null = null;
  let pending: ReturnType<typeof setTimeout> | undefined;
  let pendingLink: Element | null = null;
  let openedLink: Element | null = null;
  const cancelPending = () => {
    clearTimeout(pending);
    pending = undefined;
    pendingLink = null;
  };
  const region = (event: Event) => {
    const target = event.target as Element | null;
    // Explain the actionable control when its icon or nested text is tapped.
    const visible = target?.closest?.("button, a, input, select, textarea") ?? target?.closest?.("svg") ?? target;
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
    const target = event.target as Element | null;
    const link = target?.closest?.("a[href]");
    const img = target?.closest?.("img");
    const selection: SourceSelection = { path: path || fallback, anchor: path ? `data-source-file="${path}"` : "return (", line,
      tag: element?.tagName.toLowerCase(),
      label: (element?.getAttribute("aria-label") || element?.getAttribute("alt") || element?.textContent || element?.tagName || "").trim().replace(/\s+/g, " ").slice(0, 80),
      href: link?.getAttribute("href") || undefined, exact: !!line && (target === element || target?.closest?.("svg") === element),
      imagePath: img ? visibleImagePath(img.getAttribute("src") || "", doc.baseURI) : undefined,
    };
    // Delay pointer selection on links so the first tap does not open a modal
    // before the second tap arrives. Keyboard and shortcut clicks stay immediate.
    const pointerClick = event.type === "click" && ((event as MouseEvent).detail > 0 || (event as PointerEvent).pointerType === "touch");
    if (onOpenLink && link && pointerClick) {
      if (pendingLink === link) {
        cancelPending();
        openedLink = link;
        if (!onOpenLink(selection.href!)) onSelect(selection);
        return;
      }
      cancelPending();
      openedLink = null;
      pendingLink = link;
      pending = setTimeout(() => { cancelPending(); onSelect(selection); }, 400);
      return;
    }
    cancelPending();
    onSelect(selection);
  };
  const doubleClick = (event: Event) => {
    event.preventDefault(); event.stopImmediatePropagation();
    const link = (event.target as Element | null)?.closest?.("a[href]");
    if (!onOpenLink || !link || openedLink === link) return;
    cancelPending();
    openedLink = link;
    onOpenLink(link.getAttribute("href") || "");
  };
  // Capture before React handlers so selecting a cart button cannot add an item.
  doc.addEventListener("click", click, true);
  doc.addEventListener("dblclick", doubleClick, true);
  doc.addEventListener("submit", click, true);
  doc.addEventListener("pointerover", hover, true);
  return () => {
    doc.removeEventListener("click", click, true);
    doc.removeEventListener("dblclick", doubleClick, true);
    doc.removeEventListener("submit", click, true);
    doc.removeEventListener("pointerover", hover, true);
    cancelPending();
    highlighted?.removeAttribute("data-code-hover"); style.remove();
    doc.documentElement.removeAttribute("data-learning-hide-notices");
  };
}
