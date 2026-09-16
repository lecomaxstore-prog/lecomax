// Removes white/near-white background from favicon.png using raw PNG parsing
import fs from 'fs';
import { createRequire } from 'module';

const filePath = new URL('../public/favicon.png', import.meta.url).pathname.slice(1);

// Read the PNG and decompress using zlib
import zlib from 'zlib';

const buf = fs.readFileSync(filePath);

// Parse PNG chunks
let pos = 8; // skip PNG signature
const chunks = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.slice(pos + 4, pos + 8).toString('ascii');
  const data = buf.slice(pos + 8, pos + 8 + len);
  chunks.push({ type, data });
  pos += 12 + len;
  if (type === 'IEND') break;
}

const ihdr = chunks.find(c => c.type === 'IHDR').data;
const width  = ihdr.readUInt32BE(0);
const height = ihdr.readUInt32BE(4);
const bitDepth    = ihdr[8];
const colorType   = ihdr[9];
console.log(`PNG: ${width}x${height} bit=${bitDepth} colorType=${colorType}`);

// Collect all IDAT chunks
const idatData = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
const rawPixels = zlib.inflateSync(idatData);

// Each row: 1 filter byte + width * 4 bytes (RGBA)
const bytesPerPixel = 4;
const stride = 1 + width * bytesPerPixel;
const output = Buffer.allocUnsafe(rawPixels.length);
rawPixels.copy(output);

let changed = 0;
for (let y = 0; y < height; y++) {
  const rowStart = y * stride;
  const filter = output[rowStart]; // should be 0 (None) after inflate reconstruction
  for (let x = 0; x < width; x++) {
    const i = rowStart + 1 + x * bytesPerPixel;
    const r = output[i], g = output[i+1], b = output[i+2];
    // Replace near-white pixels with transparent
    if (r > 230 && g > 230 && b > 230) {
      output[i] = 0; output[i+1] = 0; output[i+2] = 0; output[i+3] = 0;
      changed++;
    }
  }
}
console.log(`Replaced ${changed} white pixels with transparent`);

// Re-compress and rebuild PNG
const compressed = zlib.deflateSync(output, { level: 9 });

// Rebuild PNG
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
  const crcBuf = crc32(Buffer.concat([typeBytes, data]));
  const crcBytes = Buffer.allocUnsafe(4); crcBytes.writeUInt32BE(crcBuf);
  return Buffer.concat([len, typeBytes, data, crcBytes]);
}

// Force RGBA color type = 6
const newIhdr = Buffer.from(ihdr);
newIhdr[9] = 6; // RGBA

const outBufs = [
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
  makeChunk('IHDR', newIhdr),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', Buffer.alloc(0)),
];

fs.writeFileSync(filePath, Buffer.concat(outBufs));
console.log('Saved transparent favicon.png');
