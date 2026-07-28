import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "assets", "images", "branding", "app-icon-generated-source-v2.png");
const images = path.join(root, "assets", "images");
const generated = path.join(images, "branding", "generated");

const BLACK = { r: 8, g: 8, b: 8 };
const GREEN = { r: 18, g: 184, b: 63 };
const WHITE = { r: 255, g: 255, b: 255 };

if (!fs.existsSync(source)) {
  throw new Error(`Missing generated icon source: ${source}`);
}

fs.mkdirSync(generated, { recursive: true });

const sourceImage = sharp(source)
  .resize(1024, 1024, { fit: "cover" })
  .removeAlpha()
  .raw();
const { data, info } = await sourceImage.toBuffer({ resolveWithObject: true });

const opaque = Buffer.alloc(info.width * info.height * 4);
const foreground = Buffer.alloc(info.width * info.height * 4);
const monochrome = Buffer.alloc(info.width * info.height * 4);

for (let sourceIndex = 0, targetIndex = 0; sourceIndex < data.length; sourceIndex += 3, targetIndex += 4) {
  const r = data[sourceIndex];
  const g = data[sourceIndex + 1];
  const b = data[sourceIndex + 2];
  const brightness = Math.max(r, g, b);
  const greenDominance = g - Math.max(r, b);
  const isGreen = greenDominance > 22 && g > 46;
  const isWhite = !isGreen && brightness > 76;
  const color = isGreen ? GREEN : isWhite ? WHITE : BLACK;
  const coverage = isGreen
    ? Math.max(0, Math.min(255, Math.round((greenDominance - 10) * 2.8)))
    : isWhite
      ? Math.max(0, Math.min(255, Math.round((brightness - 34) * 1.45)))
      : 0;

  opaque[targetIndex] = Math.round(BLACK.r + ((color.r - BLACK.r) * coverage) / 255);
  opaque[targetIndex + 1] = Math.round(BLACK.g + ((color.g - BLACK.g) * coverage) / 255);
  opaque[targetIndex + 2] = Math.round(BLACK.b + ((color.b - BLACK.b) * coverage) / 255);
  opaque[targetIndex + 3] = 255;

  foreground[targetIndex] = color.r;
  foreground[targetIndex + 1] = color.g;
  foreground[targetIndex + 2] = color.b;
  foreground[targetIndex + 3] = coverage;

  monochrome[targetIndex] = 255;
  monochrome[targetIndex + 1] = 255;
  monochrome[targetIndex + 2] = 255;
  monochrome[targetIndex + 3] = coverage;
}

const raw = { width: info.width, height: info.height, channels: 4 };
const opaqueImage = () => sharp(opaque, { raw });
const foregroundImage = () => sharp(foreground, { raw });
const monochromeImage = () => sharp(monochrome, { raw });

await opaqueImage().png().toFile(path.join(images, "app-icon-v2.png"));
await opaqueImage().png().toFile(path.join(images, "splash-icon-v2.png"));
await opaqueImage().resize(512, 512).png().toFile(path.join(images, "favicon-v2.png"));
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { ...BLACK, alpha: 1 } },
}).png().toFile(path.join(images, "android-icon-background-v2.png"));
await foregroundImage().png().toFile(path.join(images, "android-icon-foreground-v2.png"));
await monochromeImage().png().toFile(path.join(images, "android-icon-monochrome-v2.png"));
await monochromeImage().resize(96, 96).png().toFile(path.join(images, "notification-icon-v2.png"));

const iosSizes = [
  ["20@2x", 40], ["20@3x", 60], ["29@2x", 58], ["29@3x", 87],
  ["40@2x", 80], ["40@3x", 120], ["60@2x", 120], ["60@3x", 180],
  ["76@1x", 76], ["76@2x", 152], ["83.5@2x", 167], ["1024", 1024],
];
for (const [name, size] of iosSizes) {
  await opaqueImage().resize(size, size).png().toFile(path.join(generated, `ios-app-icon-${name}.png`));
}

const androidSizes = [
  ["mdpi", 48], ["hdpi", 72], ["xhdpi", 96], ["xxhdpi", 144], ["xxxhdpi", 192],
];
for (const [density, size] of androidSizes) {
  await opaqueImage().resize(size, size).png().toFile(path.join(generated, `android-legacy-${density}.png`));
}

console.log(`Generated ${iosSizes.length + androidSizes.length + 7} production brand assets.`);
