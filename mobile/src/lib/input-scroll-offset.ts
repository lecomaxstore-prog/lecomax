/** Scroll only as far as necessary to reveal a field and a little context. */
export function inputScrollOffset(offset: number, inputTop: number, inputHeight: number, viewportTop: number, viewportBottom: number) {
  const padding = 16;
  if (inputTop + inputHeight > viewportBottom - padding) {
    return Math.max(0, offset + inputTop + inputHeight - viewportBottom + padding);
  }
  if (inputTop < viewportTop + padding) {
    return Math.max(0, offset + inputTop - viewportTop - padding);
  }
  return offset;
}
