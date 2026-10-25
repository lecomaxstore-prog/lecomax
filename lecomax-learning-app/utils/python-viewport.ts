export function pythonViewportLayout(layoutHeight: number, visualHeight: number, offsetTop: number) {
  return { keyboard: layoutHeight - visualHeight > 140, height: Math.max(160, visualHeight), top: Math.max(0, offsetTop) };
}
