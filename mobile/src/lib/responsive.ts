export const TABLET_BREAKPOINT = 600;
export const TABLET_CONTENT_MAX_WIDTH = 960;
export const TABLET_GUTTER = 16;

export function isTabletWidth(windowWidth: number) {
  return Number.isFinite(windowWidth) && windowWidth >= TABLET_BREAKPOINT;
}

export function responsiveContentWidth(windowWidth: number) {
  if (!Number.isFinite(windowWidth) || windowWidth <= 0) return 320;
  if (!isTabletWidth(windowWidth)) return windowWidth;
  return Math.min(
    Math.max(320, windowWidth - TABLET_GUTTER * 2),
    TABLET_CONTENT_MAX_WIDTH,
  );
}

export function productGridColumns(contentWidth: number) {
  if (contentWidth >= 900) return 4 as const;
  if (contentWidth >= 620) return 3 as const;
  return 2 as const;
}

export function productCardWidth(columns: 2 | 3 | 4) {
  if (columns === 4) return "23.6%" as const;
  if (columns === 3) return "31.8%" as const;
  return "48.6%" as const;
}
