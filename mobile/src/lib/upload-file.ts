import { File } from "expo-file-system";

/** Expo fetch requires file bytes; React Native's old { uri } parts are rejected. */
export function uploadFile(asset: { uri: string; file?: globalThis.File }) {
  return asset.file ?? new File(asset.uri);
}
