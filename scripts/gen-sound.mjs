import { mkdirSync, writeFileSync } from 'node:fs';

// Synthesize a one-second, 880 Hz, mono 8-bit PCM beep and round-trip it through base64.
const sampleRate = 8000;
const samples = Buffer.alloc(sampleRate);
for (let index = 0; index < samples.length; index += 1) {
  const wave = Math.sin(2 * Math.PI * 880 * index / sampleRate);
  samples[index] = Math.round(128 + wave * 38);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0); header.writeUInt32LE(36 + samples.length, 4); header.write('WAVE', 8);
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22); header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate, 28);
header.writeUInt16LE(1, 32); header.writeUInt16LE(8, 34); header.write('data', 36); header.writeUInt32LE(samples.length, 40);
const wavBase64 = Buffer.concat([header, samples]).toString('base64');
mkdirSync('public/sounds', { recursive: true });
writeFileSync('public/sounds/notify.wav', Buffer.from(wavBase64, 'base64'));
console.log(`Generated public/sounds/notify.wav (${Buffer.byteLength(wavBase64, 'base64')} bytes)`);
