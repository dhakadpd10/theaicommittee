// node show/voices.mjs <episode dir> [--check]
// Speaks every beat that has "say" in its character's voice (show/cast.json) with the local Kokoro model:
//   voice/NN.f32 (48 kHz mono, trimmed, pitched per character) + voice/voice.json (lengths + mouth envelope).
// --check: transcribes every line with local Whisper; lines it can't hear right are printed as "CHECK THESE WORDS: ...".
import fs from 'fs';
import path from 'path';
import { KokoroTTS } from 'kokoro-js';

const epDir = path.resolve(process.argv[2]);
const CHECK = process.argv.includes('--check');
const ep = JSON.parse(fs.readFileSync(path.join(epDir, 'episode.json'), 'utf8'));
const cast = JSON.parse(fs.readFileSync(new URL('./cast.json', import.meta.url), 'utf8'));
const out = path.join(epDir, 'voice');
fs.mkdirSync(out, { recursive: true });

const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
let acc = 'a';
tts._validate_voice = () => acc; // allows the Hindi-English voice (hf_*) and British voices with the right accent

const SR = 48000, FPS = 30, res = {}, lines = [];
for (let i = 0; i < ep.beats.length; i++) {
  const b = ep.beats[i]; if (!b.say) continue;
  const key = String(i).padStart(2, '0'), c = cast[b.who];
  if (!c) throw new Error(`beat ${i}: no voice for "${b.who}" in cast.json`);
  acc = c.acc;
  const au = await tts.generate(b.say, { voice: c.voice, speed: c.speed * (b.speed || 1) });
  const x = au.audio, sr = au.sampling_rate;
  const th = 0.01; let a = 0, e = x.length - 1;
  while (a < x.length && Math.abs(x[a]) < th) a++;
  while (e > a && Math.abs(x[e]) < th) e--;
  a = Math.max(0, a - Math.round(0.02 * sr)); e = Math.min(x.length - 1, e + Math.round(0.06 * sr));
  const seg = x.subarray(a, e);
  // resample to 48k; pitch > 1 raises the voice (Gemini's little twin)
  const step = (sr / SR) * c.pitch, n = Math.floor(seg.length / step), y = new Float32Array(n);
  for (let k = 0; k < n; k++) { const s = k * step, j = Math.floor(s), f = s - j; y[k] = ((seg[j] || 0) * (1 - f) + (seg[j + 1] || 0) * f) * c.gain; }
  fs.writeFileSync(path.join(out, key + '.f32'), Buffer.from(y.buffer));
  const hop = SR / FPS, env = [];
  for (let f = 0; f * hop < n; f++) { let s = 0; const s0 = Math.floor(f * hop), s1 = Math.min(n, Math.floor((f + 1) * hop)); for (let k = s0; k < s1; k++) s += y[k] * y[k]; env.push(Math.sqrt(s / Math.max(1, s1 - s0))); }
  const pk = Math.max(...env) || 1;
  res[key] = { who: b.who, len: +(n / SR).toFixed(3), env: env.map((v) => +(v / pk).toFixed(2)) };
  lines.push({ key, i, say: b.say, y });
  console.log(key, b.who, res[key].len + 's', b.say);
}
fs.writeFileSync(path.join(out, 'voice.json'), JSON.stringify(res));

if (CHECK) {
  const { pipeline } = await import('@huggingface/transformers');
  const asr = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-base.en', { dtype: 'q8' });
  // words -> comparable tokens: numbers as digits, no punctuation, a few sound-alikes merged
  const NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  const SAME = { okay: 'ok', mum: 'mom', whether: 'weather', kurda: 'kurta', percent: '', per: '', cent: '' };
  const norm = (s) => {
    const w = s.toLowerCase().replace(/[%]/g, ' percent').replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean).map((t) => SAME[t] ?? t).filter(Boolean);
    const outW = []; let acc2 = null;
    for (const t of w) {
      if (t in NUM) { acc2 = (acc2 || 0) + NUM[t]; continue; }
      if (t === 'hundred' && acc2 !== null) { acc2 *= 100; continue; }
      if (t === 'thousand' && acc2 !== null) { acc2 *= 1000; continue; }
      if (acc2 !== null) { outW.push(String(acc2)); acc2 = null; }
      outW.push(t.replace(/'/g, ''));
    }
    if (acc2 !== null) outW.push(String(acc2));
    return outW;
  };
  const wer = (r, h) => { const d = Array.from({ length: r.length + 1 }, (_, i) => [i, ...Array(h.length).fill(0)]); for (let j = 1; j <= h.length; j++) d[0][j] = j; for (let i = 1; i <= r.length; i++) for (let j = 1; j <= h.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1)); return d[r.length][h.length] / Math.max(1, r.length); };
  const heard = {}, bad = [];
  for (const L of lines) {
    const m = Math.floor(L.y.length / 3), z = new Float32Array(m + 8000);
    for (let k = 0; k < m; k++) z[k + 4000] = L.y[k * 3]; // 48k -> 16k with a little silence around it
    const text = (await asr(z)).text.trim();
    const e = wer(norm(L.say), norm(text)); heard[L.key] = { say: L.say, heard: text, error: +e.toFixed(2) };
    if (e > 0.2) bad.push(`beat ${L.i} "${L.say}" was heard as "${text}"`);
  }
  fs.writeFileSync(path.join(out, 'heard.json'), JSON.stringify(heard, null, 1));
  if (bad.length) console.log('CHECK THESE WORDS: ' + bad.join(' | ')); else console.log('voice check: every line heard right');
}
