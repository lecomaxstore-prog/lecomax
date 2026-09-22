export function uploadFile(asset: { uri: string; file?: File }) {
  if (!asset.file) throw new Error("No browser file was selected");
  return asset.file;
}
