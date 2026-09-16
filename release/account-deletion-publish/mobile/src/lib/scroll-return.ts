/** One instance per mounted screen/list, never shared by different route entries. */
export function createScrollReturn() {
  let offset = 0;
  let focused = false;
  let restoring = false;

  return {
    focus() {
      focused = true;
      restoring = true;
    },
    blur() {
      focused = false;
    },
    restore() {
      return focused && restoring ? offset : undefined;
    },
    record(next: number) {
      if (!focused || !Number.isFinite(next)) return;
      next = Math.max(0, next);
      // A reattached native view can report zero before its list has laid out.
      // Keep the departure position until the requested offset is reached.
      if (restoring && Math.abs(next - offset) > 2) return;
      restoring = false;
      offset = next;
    },
    beginDrag() {
      // User scrolling always takes priority over a pending restoration.
      restoring = false;
    },
  };
}
