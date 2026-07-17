import { getProduct } from "@/lib/products";

type VariantImageInput = {
  slug: string;
  color?: string | null;
  fallback?: string | null;
  colors?: unknown;
  images?: unknown;
};

function normalized(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLocaleLowerCase("fr").normalize("NFKC")
    : "";
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

/**
 * Resolve the image belonging to the selected product color.
 * Static catalog mappings are authoritative. Database products fall back to
 * the matching color/image index used by the product gallery.
 */
export function resolveProductVariantImage({
  slug,
  color,
  fallback,
  colors,
  images,
}: VariantImageInput) {
  const selectedColor = normalized(color);
  const catalogProduct = getProduct(slug);

  if (selectedColor && catalogProduct?.colorImages) {
    const matchingEntry = Object.entries(catalogProduct.colorImages).find(
      ([name]) => normalized(name) === selectedColor,
    );
    if (matchingEntry?.[1]) return matchingEntry[1];
  }

  const productColors = stringArray(colors);
  const productImages = stringArray(images);
  if (selectedColor && productColors.length && productImages.length) {
    const colorIndex = productColors.findIndex((name) => normalized(name) === selectedColor);
    if (colorIndex >= 0 && productImages[colorIndex]) return productImages[colorIndex];
  }

  return fallback || catalogProduct?.image || productImages[0] || "/images/no-image.svg";
}
