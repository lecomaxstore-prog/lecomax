type ColorImageGalleries = Record<string, string[]>;

function uniqueImages(images: Array<string | undefined>) {
  return [...new Set(images.filter((image): image is string => Boolean(image?.trim())))];
}

/**
 * Keep the complete product gallery visible while promoting the currently
 * selected variant's imagery to the front of the strip.
 */
export function resolveProductGalleryImages({
  images,
  selectedColor,
  colors,
  colorImages,
  colorImageGalleries,
}: {
  images: string[];
  selectedColor?: string;
  colors?: string[];
  colorImages?: Record<string, string>;
  colorImageGalleries?: ColorImageGalleries;
}) {
  const colorIndex = selectedColor && colors ? colors.indexOf(selectedColor) : -1;
  const selectedGallery = selectedColor ? colorImageGalleries?.[selectedColor] : undefined;
  const selectedPrimary = selectedColor ? colorImages?.[selectedColor] : undefined;
  const positionalPrimary = colorIndex >= 0 ? images[colorIndex] : undefined;
  const promotedImages = selectedGallery?.length
    ? selectedGallery
    : [selectedPrimary ?? positionalPrimary];

  const allVariantImages = Object.values(colorImageGalleries ?? {}).flat();
  const resolved = uniqueImages([...promotedImages, ...images, ...allVariantImages]);

  return resolved.length > 0 ? resolved : ["/images/no-image.svg"];
}
