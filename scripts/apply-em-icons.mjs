import fs from 'node:fs/promises';
import sharp from 'sharp';

const appSource = 'mobile/assets/images/app-icon-em-v7.png';
const faviconSource = 'public/brand/em-favicon-source-v7.png';
const resize = (source, size, destination) => sharp(source).resize(size, size).flatten({ background: '#123D2F' }).png().toFile(destination);
await resize(appSource, 1024, 'mobile/assets/images/app-icon-em-v7-1024.png');
await resize(faviconSource, 48, 'mobile/assets/images/favicon-em-v7.png');
await resize(faviconSource, 32, 'public/favicon.png');
for (const size of [16, 32, 48]) await resize(faviconSource, size, `public/brand/favicon-em-${size}.png`);
for (const size of [192, 512]) {
  await resize(appSource, size, `public/icons/icon-${size}.png`);
  await resize(appSource, size, `public/icons/icon-maskable-${size}.png`);
}
await resize(appSource, 180, 'public/icons/apple-touch-icon.png');
// ICO directory with PNG payloads for each browser icon size.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(size => fs.readFile(`public/brand/favicon-em-${size}.png`)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
  const entry = 6 + i * 16;
  header[entry] = sizes[i]; header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await fs.writeFile('public/favicon.ico', Buffer.concat([header, ...pngs]));
const configPath = 'mobile/app.base.json';
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
config.expo.icon = './assets/images/app-icon-em-v7-1024.png';
config.expo.ios.icon = config.expo.icon;
config.expo.android.adaptiveIcon = {
  backgroundColor: '#123D2F',
  foregroundImage: config.expo.icon,
};
config.expo.web.favicon = './assets/images/favicon-em-v7.png';
const splash = config.expo.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen');
if (splash) { splash[1].backgroundColor = '#123D2F'; splash[1].image = config.expo.icon; }
await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
const manifestPath = 'public/manifest.json';
const manifest = await fs.readFile(manifestPath, 'utf8');
await fs.writeFile(manifestPath, manifest.replaceAll('?v=5', '?v=7'));
console.log('Applied EM app, splash, browser, Apple touch and PWA icons.');
