import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const sizes = [16, 32, 48, 128, 256];
mkdirSync('public/icons', { recursive: true });
for (const size of sizes) writeFileSync(`public/icons/icon-${size}.png`, makeIcon(size));
console.log(`Generated green U icons: ${sizes.join(', ')}`);

function makeIcon(size) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  const margin = Math.max(2, Math.round(size * 0.25));
  const left = margin;
  const right = size - margin;
  const top = margin;
  const bottom = size - margin;
  const stroke = Math.max(2, Math.round(size * 0.13));
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    pixels[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = row + 1 + x * 4;
      const white = ((x >= left && x < left + stroke) || (x >= right - stroke && x < right)) && y >= top && y < bottom - stroke ||
        y >= bottom - stroke && y < bottom && x >= left && x < right;
      pixels[offset] = white ? 255 : 16;
      pixels[offset + 1] = white ? 255 : 128;
      pixels[offset + 2] = white ? 255 : 64;
      pixels[offset + 3] = 255;
    }
  }
  return png(size, size, pixels);
}

function png(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([name, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([length, crcInput, crc]);
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
