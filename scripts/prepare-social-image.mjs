import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/prepare-social-image.mjs <generated-image-path>");
await mkdir("public/images/social", { recursive: true });
const result = await sharp(source)
  .resize(1200, 630, { fit: "contain", background: "#12372D" })
  .flatten({ background: "#12372D" })
  .toColourspace("srgb")
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile("public/images/social/lecomax-share-v3.jpg");
console.log(JSON.stringify(result));
