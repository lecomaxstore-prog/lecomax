import { Image, type ImageProps } from "expo-image";
import { useProductImage } from "@/hooks/use-product-image";

/** Keeps the gallery and zoom view on the same original when its remote URL fails. */
export function ProductPhoto({ uri, ...props }: Omit<ImageProps, "source" | "onError"> & { uri?: string }) {
  const { source, onError } = useProductImage({ id: uri ?? "", images: uri ? [uri] : [] });
  return <Image {...props} source={source} onError={onError} />;
}
