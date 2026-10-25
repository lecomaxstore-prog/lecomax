/** Short, factual copy for social cards; search metadata keeps its own wording. */
export function productShareCopy(product: { name: string; price: number; stock?: number; preorderEnabled?: boolean }) {
  const name = product.name.split(/\s+[–—]\s+/)[0].trim();
  const title = name.length > 72 ? `${name.slice(0, 69).trim()}…` : name;
  const price = `${Number.isInteger(product.price) ? product.price : product.price.toFixed(2)} MAD`;
  const availability = typeof product.stock === "number" && product.stock > 0 ? "Disponible" : product.preorderEnabled ? "En précommande" : product.stock === 0 ? "Actuellement épuisé" : "Disponibilité sur la fiche";
  return { title: `${title} | L’ECOMAX`, name: title, description: `${price} · ${availability}. Découvrez les photos, les détails et les options sur L’ECOMAX.` };
}
