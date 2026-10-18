// Framebuffer pixels remain independent of Android density and rotation.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function mapPoint(x, y, rect, width, height) {
  if (!width || !height || !rect.width || !rect.height) return null;
  if (x < rect.left || y < rect.top || x > rect.left + rect.width || y > rect.top + rect.height) return null;
  return { x: clamp(Math.floor((x - rect.left) * width / rect.width), 0, width - 1),
    y: clamp(Math.floor((y - rect.top) * height / rect.height), 0, height - 1) };
}
export function relativePoint(point, dx, dy, sensitivity, width, height) {
  return { x: clamp(point.x + dx * sensitivity, 0, Math.max(0, width - 1)),
    y: clamp(point.y + dy * sensitivity, 0, Math.max(0, height - 1)) };
}
// noVNC 1.7.0 has no public pointer API. Isolate the pinned internal dependency.
export function pointer(rfb, point, mask) {
  if (!rfb || rfb._rfbConnectionState !== 'connected' || rfb.viewOnly) return;
  const x = clamp(Math.round(point.x), 0, rfb._fbWidth - 1);
  const y = clamp(Math.round(point.y), 0, rfb._fbHeight - 1);
  rfb.constructor.messages.pointerEvent(rfb._sock, x, y, mask);
}
