import { Image, type ImageProps } from "expo-image";
import { useProductImage } from "@/hooks/use-product-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ProductLoadingMark } from "@/components/product-loading";

/** Keeps the gallery and zoom view on the same original when its remote URL fails. */
export function ProductPhoto({ uri, premiumLoading = false, ...props }: Omit<ImageProps, "source" | "onError"> & { uri?: string; premiumLoading?: boolean }) {
  const { source, onError } = useProductImage({ id: uri ?? "", images: uri ? [uri] : [] });
  const [settledUri, setSettledUri] = useState<string>();
  if (!premiumLoading) return <Image {...props} source={source} onError={onError} />;
  return (
    <View style={props.style}>
      {settledUri !== uri ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#F6F7F4", alignItems: "center", justifyContent: "center" }]}><ProductLoadingMark /></View> : null}
      <Image {...props} style={StyleSheet.absoluteFill} source={source} onError={() => { setSettledUri(uri); onError(); }} onLoad={(event) => { setSettledUri(uri); props.onLoad?.(event); }} />
    </View>
  );
}
