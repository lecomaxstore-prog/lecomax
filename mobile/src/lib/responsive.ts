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

/** Width the tablet navigation rail takes out of the row (94px + 1px border). */
export const TABLET_NAV_RAIL = 95;

export function productGridColumns(rowWidth: number) {
  if (rowWidth >= 828) return 4 as const;
  if (rowWidth >= 626) return 3 as const;
  return 2 as const;
}

export function productCardWidth(columns: 2 | 3 | 4) {
  if (columns === 4) return "23.6%" as const;
  if (columns === 3) return "31.8%" as const;
  return "48.6%" as const;
}

/** Outer padding of a product grid, and the space between two cards. */
export const GRID_EDGE = 16;
export const GRID_GUTTER = 12;

/**
 * Exact card width in pixels for a grid row.
 *
 * Percentage widths cannot be used together with a gap: two cards at 48.6%
 * plus a 10px gap only fit when the row is at least 357px wide, so on any
 * phone below ~389px (iPhone SE/13 mini, most 360dp Android) the second card
 * wrapped onto its own line and left half the row empty. Measuring the row
 * instead makes every card fit by construction, at any column count.
 */
export function productCardPixelWidth(contentWidth: number, columns: 2 | 3 | 4) {
  const row = Math.max(0, contentWidth - GRID_EDGE * 2);
  return Math.floor((row - GRID_GUTTER * (columns - 1)) / columns);
}

/** Largest count that fills whole rows, so no card is ever left alone. */
export function completeRowCount(total: number, columns: 2 | 3 | 4) {
  if (total < columns) return total;
  return Math.floor(total / columns) * columns;
}

/** `minimum`, rounded up to a whole number of rows for the current columns. */
export function rowAlignedCount(minimum: number, columns: 2 | 3 | 4) {
  return Math.ceil(minimum / columns) * columns;
}
