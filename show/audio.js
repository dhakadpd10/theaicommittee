// Sound for one episode: lo-fi music bed, room tone, sound effects and the cast's voices, all synthesised here.
// node show/audio.js episodes/<id> [--voice-only]  -> <id>/audio.wav (48 kHz, 16-bit stereo)
const fs = require('fs'), path = require('path');
const timeline = require('./timeline');

const EP = path.resolve(process.argv[2]);
const VOICE_ONLY = process.argv.includes('--voice-only');
const TL = timeline(EP), B = TL.beats, DUR = TL.DUR;
const SR = 48000, N = Math.round(SR * DUR), TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const music = [new Float32Array(N), new Float32Array(N)], sfx = [new Float32Array(N), new Float32Array(N)];
let seed = 4242;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
function add(bus, t0, len, gen, { pan = 0, gain = 1 } = {}) {
  const s0 = Math.round(t0 * SR), n = Math.round(len * SR);
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n; i++) { const k = s0 + i; if (k < 0 || k >= N) continue; const v = gen(i / SR) * gain; bus[0][k] += v * gl; bus[1][k] += v * gr; }
}
function onePole() { let y = 0; return (x, a) => (y += a * (x - y)); }

const LOYAL = TL.id === '01-loyal10';
const morningB = B.find((b) => b.time === 'morning'), morningAt = morningB ? morningB.start : Infinity;
const card = B.find((b) => b.card) || null;
// the music cuts out on the punchline: episode.json "musicStop" is that beat's index (LOYAL10: "LOYAL20 is still live")
const stopBeat = LOYAL ? B[12] : TL.musicStop !== undefined ? B[TL.musicStop] : null;
const stopMusic = stopBeat ? stopBeat.vo - 0.05 : DUR;

// ---------- music: soft electric-piano chords, 72 BPM, Fmaj7 Em7 Dm7 Cmaj7 ----------
const BEAT = 60 / 72, BAR = BEAT * 4;
const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
const keys = (f) => (t) => {
  const env = Math.exp(-t * 1.6) * Math.min(1, t * 80);
  return (Math.sin(TAU * f * t + 0.6 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 3)) + 0.15 * Math.sin(TAU * f * 3 * t) * Math.exp(-t * 6)) * env;
};
function musicSection(t0, t1, bright) {
  for (let bar = 0; t0 + bar * BAR < t1; bar++) {
    const tb = t0 + bar * BAR, ch = chords[bar % 4];
    ch.forEach((m, i) => add(music, tb + i * 0.025, Math.min(BAR * 1.1, t1 - tb), keys(mtof(m + (bright ? 12 : 0))), { gain: 0.07, pan: (i - 1.5) * 0.25 }));
    // a sleepy melody note on beat 3
    const mel = ch[(bar * 3) % 4] + 12 + (bright ? 12 : 0);
    add(music, tb + BEAT * 2 + 0.05, BEAT * 1.6, keys(mtof(mel)), { gain: 0.05, pan: 0.2 });
    // bass
    add(music, tb, BAR * 0.9, (t) => Math.sin(TAU * mtof(ch[0] - 12) * t) * Math.exp(-t * 1.2) * Math.min(1, t * 60), { gain: 0.16 });
    // brushed kick + soft hat
    for (let k = 0; k < 4; k++) {
      const tk = tb + k * BEAT; if (tk > t1) break;
      if (k % 2 === 0) add(music, tk, 0.3, (t) => Math.sin(TAU * (50 * t + 60 * (1 - Math.exp(-t * 30)) / 30)) * Math.exp(-t * 12), { gain: 0.35 });
      const lp = onePole(); add(music, tk + BEAT / 2, 0.05, (t) => { const n = rnd(); return (n - lp(n, 0.25)) * Math.exp(-t * 70); }, { gain: 0.07, pan: 0.3 });
      if (k % 2 === 1) { const lp2 = onePole(); add(music, tk, 0.16, (t) => lp2(rnd(), 0.35) * Math.exp(-t * 26), { gain: 0.12, pan: -0.1 }); }
    }
  }
}
musicSection(0, card ? Math.min(card.start + 0.2, stopMusic) : stopMusic, B[0].time === 'morning');
if (LOYAL) musicSection(morningAt + 0.1, stopMusic, true);
// vinyl crackle under the music
for (let i = 0; i < DUR * 9; i++) { const t0 = Math.abs(rnd()) * DUR; if (t0 < stopMusic) add(music, t0, 0.004, () => rnd() * 0.5, { gain: 0.05, pan: rnd() * 0.6 }); }
// hard stop with a short fade
const sStop = Math.round(stopMusic * SR);
for (let i = sStop; i < N; i++) { const g = clamp(1 - (i - sStop) / (0.06 * SR)); music[0][i] *= g; music[1][i] *= g; }
if (card) {
  const sCard = Math.round(card.start * SR), sCardEnd = Math.round((morningAt + 0.1) * SR);
  for (let i = sCard; i < sCardEnd; i++) { const g = clamp(1 - (i - sCard) / (0.4 * SR)); music[0][i] *= g; music[1][i] *= g; }
}

// ---------- room tone ----------
{ // night: low city hum; morning: birds
  const lp = onePole();
  add(sfx, 0, card ? card.start : DUR, (t) => lp(rnd(), 0.02) * 0.6, { gain: 0.08 });
  for (let k = 0; k < (LOYAL ? 9 : 0); k++) {
    const t0 = morningAt + 0.2 + k * 1.9 + Math.abs(rnd()) * 1.2; if (t0 > DUR - 1) break;
    const f0 = 2600 + Math.abs(rnd()) * 1400, pan = rnd() * 0.8, n = 2 + Math.floor(Math.abs(rnd()) * 3);
    for (let j = 0; j < n; j++) add(sfx, t0 + j * 0.13, 0.1, (t) => Math.sin(TAU * (f0 * t + 9000 * t * t)) * Math.sin(Math.PI * t / 0.1), { gain: 0.035, pan });
  }
}

// ---------- effects ----------
const ping = (t0, g = 0.2, pan = 0) => [0, 0.07].forEach((d, i) => add(sfx, t0 + d, 0.5, (t) => {
  const f = mtof(i ? 88 : 83); return (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.7 * t) * Math.exp(-t * 9)) * Math.exp(-t * 7);
}, { gain: g, pan }));
const buzz = (t0, len = 0.45) => add(sfx, t0, len, (t) => Math.sign(Math.sin(TAU * 170 * t)) * 0.4 * (Math.sin(TAU * 14 * t) > -0.2 ? 1 : 0) * Math.min(1, t * 50) * Math.min(1, (len - t) * 40), { gain: 0.06, pan: -0.1 });
const chirp = (t0, up = true) => [0, 0.075].forEach((d, i) => add(sfx, t0 + d, 0.06, (t) => Math.sin(TAU * (up ? [1200, 1600][i] : [1500, 1000][i]) * t) * Math.sin(Math.PI * t / 0.06), { gain: 0.07, pan: 0.25 }));
const click = (t0) => { const lp = onePole(); add(sfx, t0, 0.025, (t) => { const n = rnd(); return (n - lp(n, 0.25)) * Math.exp(-t * 200); }, { gain: 0.16, pan: -0.15 }); };

// each committee member has its own little sound before it speaks
const twinkle = (t0, base = 88, g = 0.05) => [0, 4, 7, 12].forEach((d, i) => add(sfx, t0 + i * 0.045, 0.35, (t) => Math.sin(TAU * mtof(base + d) * t) * Math.exp(-t * 9) * Math.min(1, t * 200), { gain: g, pan: 0.35 }));
const hmm = (t0) => [57, 60].forEach((m, i) => add(sfx, t0 + i * 0.09, 0.22, (t) => Math.sin(TAU * mtof(m + 12) * t) * Math.sin(Math.PI * t / 0.22), { gain: 0.06, pan: 0 }));
const typeBurst = (t0, n = 7) => { for (let i = 0; i < n; i++) click(t0 + i * 0.045 + Math.abs(rnd()) * 0.015); };
const whoosh = (t0, len = 0.45) => { const lp = onePole(); add(sfx, t0, len, (t) => { const x = t / len; return lp(rnd(), 0.05 + 0.4 * x) * Math.sin(Math.PI * x) * 1.4; }, { gain: 0.22, pan: 0.2 }); };
B.forEach((b) => {
  if (b.vo === null) return;
  if (b.who === 'codex') typeBurst(b.vo - 0.42);
  if (b.who === 'claude') hmm(b.vo - 0.3);
  if (b.who === 'gemini') twinkle(b.vo - 0.25, 88);
  if (b.who === 'twin') twinkle(b.vo - 0.2, 95, 0.035);
  for (const fx of b.sfx || []) {
    if (fx === 'send') { whoosh(b.vo - 0.55); ping(b.vo - 0.12, 0.1, 0.3); }
    if (fx === 'type') typeBurst(b.start + 0.1, 14);
    if (fx === 'wipe') for (let k = 0; k < 9; k++) { const t0 = b.start + 0.25 + k * ((b.end - b.start - 0.6) / 9); add(sfx, t0, 0.12, (t) => Math.sin(TAU * (900 - k * 40) * (1 - t * 2) * t) * Math.exp(-t * 25), { gain: 0.09, pan: (k - 4) * 0.08 }); }
    if (fx === 'thunder') { const lp = onePole(), lp2 = onePole(); add(sfx, b.start + 0.25, 2.6, (t) => lp2(lp(rnd(), 0.02), 0.05) * 9 * Math.min(1, t * 6) * Math.exp(-t * 1.4) * (1 + 0.6 * Math.sin(t * 7)), { gain: 0.5 }); }
  }
});

if (LOYAL) {
// typing before her first line, and the code being typed after it
for (let i = 0; i < 9; i++) click(0.05 + i * 0.03 + Math.abs(rnd()) * 0.02);
for (let i = 0; i < 7; i++) click(B[0].vo + 1.4 + i * 0.2);
// Dabba chirps before each line he says
B.filter((b) => b.who === 'dabba').forEach((b) => chirp(b.vo - 0.2, b.mood !== 'small'));
// "next morning": soft chime
[76, 81, 84].forEach((m, i) => add(sfx, card.start + 0.35 + i * 0.12, 1.5, (t) => Math.sin(TAU * mtof(m) * t) * Math.exp(-t * 2.2) * Math.min(1, t * 60), { gain: 0.06, pan: (i - 1) * 0.4 }));
// orders flood in: pings speed up, phone buzzes
{
  const lb = B.find((b) => b.shot === 'laptop');
  let tt = lb.start + 0.15, gap = 0.32;
  while (tt < B[4].vo + 0.9) { ping(tt, tt > B[4].vo - 0.1 ? 0.06 : 0.14, rnd() * 0.5); tt += gap; gap = Math.max(0.07, gap * 0.86); }
  for (let k = 0; k < 4; k++) buzz(lb.start + 0.2 + k * 0.7, 0.4);
}
// head on the desk
{ const e = B[B.length - 1]; add(sfx, e.vo + e.len + 1.35, 0.25, (t) => Math.sin(TAU * (70 + 50 * Math.exp(-t * 30)) * t) * Math.exp(-t * 16), { gain: 0.3 }); }
// one more order, right at the end
buzz(DUR - 1.3, 0.4); ping(DUR - 1.25, 0.16, 0.2);
}

// rain: a soft hiss from the first rainy beat to the end, with the odd drip
{
  const rb = B.find((b) => b.weather === 'rain');
  if (rb) {
    const lpA = onePole(), lpB = onePole();
    add(sfx, rb.start, DUR - rb.start, (t) => { const n = rnd(); return (lpA(n, 0.35) - lpB(n, 0.03)) * Math.min(1, t * 1.5); }, { gain: 0.16, pan: -0.2 });
    for (let k = 0; k < (DUR - rb.start) * 3; k++) { const t0 = rb.start + Math.abs(rnd()) * (DUR - rb.start); add(sfx, t0, 0.06, (t) => Math.sin(TAU * (1400 + Math.abs(rnd()) * 900) * t) * Math.exp(-t * 60), { gain: 0.03, pan: rnd() * 0.7 }); }
  }
}

// ---------- voices ----------
const vo = new Float32Array(N);
B.forEach((b) => {
  if (b.vo === null) return;
  const buf = fs.readFileSync(path.join(EP, 'voice', b.key + '.f32'));
  const x = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  const s0 = Math.round(b.vo * SR);
  for (let j = 0; j < x.length && s0 + j < N; j++) {
    let v = x[j];
    if (b.who === 'dabba') v = v * 0.8 + v * Math.sin(TAU * 55 * j / SR) * 0.25; // a little tin-can robot
    vo[s0 + j] += v;
  }
});
let vpk = 0; for (let i = 0; i < N; i++) vpk = Math.max(vpk, Math.abs(vo[i]));
for (let i = 0; i < N; i++) vo[i] *= 0.9 / vpk;
const duck = new Float32Array(N); let env = 0;
for (let i = 0; i < N; i++) { const a = Math.abs(vo[i]); env = a > env ? env + (a - env) * 0.02 : env * 0.99993; duck[i] = 1 - 0.6 * clamp(env * 8); }

// ---------- mix ----------
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = clamp((DUR - t) / 0.5) * clamp(t / 0.03);
  const m = VOICE_ONLY ? 0 : 1;
  L[i] = (m * (music[0][i] * duck[i] + sfx[0][i]) + vo[i]) * fade;
  R[i] = (m * (music[1][i] * duck[i] + sfx[1][i]) + vo[i]) * fade;
}
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const drive = 1.05 / peak;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * drive) / Math.tanh(1.05) * 0.89; R[i] = Math.tanh(R[i] * drive) / Math.tanh(1.05) * 0.89; }
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) { data.writeInt16LE(Math.round(clamp(L[i], -1, 1) * 32767), i * 4); data.writeInt16LE(Math.round(clamp(R[i], -1, 1) * 32767), i * 4 + 2); }
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28);
hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
const out = path.join(EP, VOICE_ONLY ? 'voice_only.wav' : 'audio.wav');
fs.writeFileSync(out, Buffer.concat([hdr, data]));
console.log('wrote', out, 'dur', DUR, 'raw peak', peak.toFixed(2));
