// GeoJSON coordinates are longitude, latitude. Handles dateline crossings locally.
export function inRing(lon: number, lat: number, ring: number[][]) {
  let inside = false;
  const wrap = (x: number) => ((x - lon + 540) % 360) - 180;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = wrap(ring[i]![0]!),
      xj = wrap(ring[j]![0]!),
      yi = ring[i]![1]!,
      yj = ring[j]![1]!;
    if (Math.abs(xi - xj) > 180) continue;
    if (yi > lat !== yj > lat && 0 < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function inCountry(lon: number, lat: number, polygons: number[][][][]) {
  return polygons.some(
    (p) => inRing(lon, lat, p[0]!) && !p.slice(1).some((r) => inRing(lon, lat, r)),
  );
}
