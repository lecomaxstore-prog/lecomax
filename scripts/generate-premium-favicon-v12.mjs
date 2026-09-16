import fs from 'node:fs/promises';
import sharp from 'sharp';

const source = 'public/brand/favicon-premium-v12-source.png';
const sizes = [16, 32, 48];
const pngs = [];
for (const size of sizes) {
  const png = await sharp(source).resize(size, size).png().toBuffer();
  await fs.writeFile(`public/brand/favicon-premium-v12-${size}.png`, png);
  pngs.push(png);
}
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
pngs.forEach((png, index) => {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index];
  directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(png.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await fs.writeFile('public/brand/favicon-premium-v12.ico', Buffer.concat([directory, ...pngs]));
for (const size of [180, 192, 512]) {
  await sharp(source).resize(size, size).png().toFile(`public/icons/premium-v12-${size}.png`);
}
// Keep the entire monogram inside the central maskable safe area.
for (const size of [192, 512]) {
  const inset = Math.round(size * 0.12);
  await sharp(source).resize(size - 2 * inset, size - 2 * inset)
    .extend({ top: inset, bottom: inset, left: inset, right: inset, background: '#000000' })
    .png().toFile(`public/icons/premium-v12-maskable-${size}.png`);
}
await sharp(source).resize(1024, 1024).flatten({ background: '#000000' })
  .png().toFile('mobile/assets/images/app-icon-shopping-v12.png');
await sharp(source).resize(640, 640).flatten({ background: '#000000' })
  .extend({ top: 192, bottom: 192, left: 192, right: 192, background: '#000000' })
  .png().toFile('mobile/assets/images/app-icon-shopping-adaptive-v12.png');
await sharp(source).resize(48, 48).png().toFile('mobile/assets/images/favicon-shopping-v12.png');
await fs.copyFile('public/brand/favicon-premium-v12.ico', 'public/favicon.ico');
await fs.copyFile('public/brand/favicon-premium-v12-32.png', 'public/favicon.png');
console.log('Exported website, iOS, Android adaptive, splash, and Expo web icons.');
