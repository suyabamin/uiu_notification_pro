import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { deflateRawSync } from 'node:zlib';

const root = process.cwd();
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');

for (const browser of ['chrome', 'firefox']) {
  const result = spawnSync(process.execPath, [vite, 'build', '--mode', browser, '--outDir', `dist/${browser}`, '--emptyOutDir'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
for (const browser of ['edge', 'opera']) {
  rmSync(join(root, 'dist', browser), { recursive: true, force: true });
  copyDirectory(join(root, 'dist', 'chrome'), join(root, 'dist', browser));
}
for (const browser of ['chrome', 'firefox', 'edge', 'opera']) {
  const directory = join(root, 'dist', browser);
  const zipPath = join(root, 'build', `${browser}-mv3.zip`);
  mkdirSync(join(root, 'build'), { recursive: true });
  writeFileSync(zipPath, createZip(directory));
  console.log(`Packaged ${relative(root, zipPath)}`);
}

function copyDirectory(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source)) {
    const from = join(source, entry);
    const to = join(destination, entry);
    if (statSync(from).isDirectory()) copyDirectory(from, to);
    else copyFileSync(from, to);
  }
}

function createZip(directory) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const filePath of listFiles(directory)) {
    const name = relative(directory, filePath).split(sep).join('/');
    const nameBytes = Buffer.from(name);
    const original = readFileSync(filePath);
    const compressed = deflateRawSync(original);
    const crc = crc32(original);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(original.length, 22); local.writeUInt16LE(nameBytes.length, 26);
    localParts.push(local, nameBytes, compressed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(8, 10); central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(original.length, 24);
    central.writeUInt16LE(nameBytes.length, 28); central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);
    offset += local.length + nameBytes.length + compressed.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const ending = Buffer.alloc(22);
  const entries = centralParts.filter((part) => part.length >= 46 && part.readUInt32LE(0) === 0x02014b50).length;
  ending.writeUInt32LE(0x06054b50, 0); ending.writeUInt16LE(entries, 8); ending.writeUInt16LE(entries, 10);
  ending.writeUInt32LE(centralDirectory.length, 12); ending.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, ending]);
}

function listFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
