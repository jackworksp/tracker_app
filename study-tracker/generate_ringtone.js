const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const duration = 60; // 60 seconds long (Continuous ringing)
const numSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + numSamples * 2); // 16-bit mono

// WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // PCM chunk size
buffer.writeUInt16LE(1, 20); // Audio format (1 = PCM)
buffer.writeUInt16LE(1, 22); // Num channels (1 = Mono)
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
buffer.writeUInt16LE(2, 32); // Block align
buffer.writeUInt16LE(16, 34); // Bits per sample
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40);

// Generate Tone (Beep-Beep-Beep: 0.5s on, 0.5s off)
for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const isBeep = (t % 1.0) < 0.5; // 0.5s beep every 1s
    const volume = isBeep ? 0.5 : 0;
    const freq = 880; // A5
    const value = volume * 32767 * Math.sin(2 * Math.PI * freq * t);
    buffer.writeInt16LE(Math.floor(value), 44 + i * 2);
}

// Target path in Android raw resources
const targetDir = 'frontend/android/app/src/main/res/raw';

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const outputPath = path.join(targetDir, 'ringtone.wav');
fs.writeFileSync(outputPath, buffer);
console.log('Ringtone generated at: ' + outputPath);
