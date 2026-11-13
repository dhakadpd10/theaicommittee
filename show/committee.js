// The AI Committee: three little desk-sized mascots behind a tiny hearing table on Meera's desk.
// Fan-made versions of each assistant's icon in a faceted low-poly look (fan-made, not affiliated):
//   Codex  - a chunky lavender-to-blue cloud whose face is a glowing >_ (the > is its eye, the _ its cursor mouth)
//   Claude - the orange pixel creature built from blocks: slot eyes, side arms that wave, four little legs
//   Gemini - a faceted sparkle with a smaller, smugger twin bobbing at its shoulder
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const UP = new THREE.Vector3(0, 1, 0);
function m(geo, mat, parent, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
const soft = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#FFFFFF'), sheenRoughness: 0.6, ...o });
const plain = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

let pseed = 11; const prnd = () => ((pseed = (pseed * 16807) % 2147483647) / 2147483647);
export const PRINTS = tex(512, 512, (x, w, h) => {
  x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const g = 100 + prnd() * 60; x.fillStyle = `rgba(${g},${g},${g},0.18)`; x.beginPath(); x.arc(prnd() * w, prnd() * h, 2 + prnd() * 9, 0, 7); x.fill(); }
  for (let p = 0; p < 9; p++) { const cx = prnd() * w, cy = prnd() * h, r0 = 10 + prnd() * 18; x.lineWidth = 1.6;
    for (let r = r0; r < r0 + 46; r += 4.5) { const g = prnd() < 0.5 ? 150 : 105; x.strokeStyle = `rgba(${g},${g},${g},0.22)`; x.beginPath(); x.ellipse(cx, cy, r, r * 0.8, prnd(), 0, 5.2); x.stroke(); } }
});
PRINTS.wrapS = PRINTS.wrapT = THREE.RepeatWrapping; PRINTS.colorSpace = THREE.NoColorSpace; PRINTS.repeat.set(3, 3);
// matte plasticine with thumbprints
export const clayMat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, bumpMap: PRINTS, bumpScale: 2.4, ...o });
// turn a whole built scene into clay: every lit surface goes matte with thumbprints; glossy dark beads (eyes) and
// textured or unlit surfaces (screens, labels, shine dots) keep their look
export function claymate(root) {
  root.traverse((o) => {
    if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
    const m = o.material;
    if (m.isMeshBasicMaterial || m.map || m.bumpMap === PRINTS || m.transparent || (m.emissiveIntensity > 0.4)) return;
    const c = m.color ? m.color.clone() : new THREE.Color('#CCCCCC');
    if (c.r + c.g + c.b < 0.12 && (m.clearcoat >= 0.99 || m.roughness < 0.4)) return;
    o.material = clayMat(c, { vertexColors: !!m.vertexColors, flatShading: false, emissive: m.emissive || new THREE.Color(0), emissiveIntensity: m.emissiveIntensity || 0 });
  });
}
const eyeM = new THREE.MeshStandardMaterial({ color: '#120C0A', roughness: 0.35, flatShading: true });
const shineM = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
const mouthM = plain('#4E1C1E', { roughness: 0.5 });
const browM = plain('#2A1D18', { roughness: 0.7 });

// a glossy cartoon eye with two catch-lights and a lid that can close
function eye(parent, x, y, z, r, lidMat) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const e = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), eyeM); e.scale.set(0.82, 1.1, 0.45); g.add(e);
  const h1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.28, 6, 4), shineM); h1.position.set(r * 0.33, r * 0.45, r * 0.4); g.add(h1);
  
  const lid = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), lidMat); lid.scale.set(0.9, 1.2, 0.6); g.add(lid);
  return { g, lid, r };
}
function brow(parent, x, y, z, w) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(w * 0.13, w, 6, 10), browM); b.rotation.z = Math.PI / 2; g.add(b);
  return g;
}
function mouth(parent, x, y, z, r) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mouthM); inner.scale.set(1.2, 0.5, 0.35); g.add(inner);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(r * 0.5, 14, 10), plain('#E07B86')); tongue.position.set(0, -r * 0.55, r * 0.1); tongue.scale.set(1.2, 0.5, 0.6); g.add(tongue);
  return { g, inner, tongue, r };
}
// capsule arm from shoulder to hand
function arm(parent, mat, r) {
  const a = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 1, 14), mat); a.castShadow = true; parent.add(a);
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat); parent.add(s);
  const h = new THREE.Mesh(new THREE.SphereGeometry(r * 1.4, 16, 12), mat); h.scale.set(1, 0.85, 1); h.castShadow = true; parent.add(h);
  return {
    set(from, to) {
      const d = to.clone().sub(from), len = d.length();
      a.position.copy(from).addScaledVector(d, 0.5); a.quaternion.setFromUnitVectors(UP, d.clone().normalize()); a.scale.set(1, len, 1);
      s.position.copy(from); h.position.copy(to);
    },
  };
}

export function buildCommittee(scene) {
  const root = new THREE.Group(); scene.add(root);

  // ---------- the hearing table ----------
  const wood = plain('#7A4B2C', { roughness: 0.55 });
  m(new RoundedBoxGeometry(0.84, 0.035, 0.3, 3, 0.012), wood, root, 0, 0.165, 0.02);
  const skirtTex = tex(1024, 160, (x, w, h) => {
    x.fillStyle = '#22304A'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 6) { x.fillStyle = `rgba(255,255,255,${0.02 + (i % 12 ? 0 : 0.02)})`; x.fillRect(i, 0, 2, h); }
    x.strokeStyle = '#D9B15C'; x.lineWidth = 5; x.strokeRect(14, 14, w - 28, h - 28);
    x.fillStyle = '#E9C978'; x.font = '800 62px InterXB'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('THE AI COMMITTEE', w / 2, h / 2 + 4);
  });
  const skirt = m(new THREE.PlaneGeometry(0.82, 0.15), new THREE.MeshStandardMaterial({ map: skirtTex, roughness: 0.9 }), root, 0, 0.075, 0.172);
  skirt.castShadow = false;
  [-0.4, 0.4].forEach((x) => m(new THREE.BoxGeometry(0.02, 0.15, 0.28), plain('#22304A', { roughness: 0.9 }), root, x, 0.075, 0.03));

  // ---------- name plates, desk mics, the gavel ----------
  const NAMES = ['Byte', 'Sage', 'Gigi'], XS = [-0.26, 0, 0.26];
  NAMES.forEach((n, i) => {
    const plate = tex(256, 72, (x, w, h) => {
      x.fillStyle = '#FBF7EE'; x.fillRect(0, 0, w, h); x.strokeStyle = '#C9BFAE'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4);
      x.fillStyle = '#1F1A17'; x.font = '800 40px InterXB'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(n, w / 2, h / 2 + 2);
    });
    const tent = new THREE.Group(); tent.position.set(XS[i], 0.183, 0.12); root.add(tent);
    const f = m(new THREE.PlaneGeometry(0.17, 0.048), new THREE.MeshStandardMaterial({ map: plate, roughness: 0.8 }), tent, 0, 0.022, 0.01); f.rotation.x = -0.35;
    const b = m(new THREE.PlaneGeometry(0.17, 0.048), plain('#EFE9DD'), tent, 0, 0.022, -0.008); b.rotation.x = 0.35 + Math.PI;
    // a tiny desk microphone
    const mic = new THREE.Group(); mic.position.set(XS[i] + 0.085, 0.183, 0.075); mic.scale.setScalar(0.8); root.add(mic);
    m(new THREE.CylinderGeometry(0.022, 0.026, 0.008, 16), plain('#2B2F36', { metalness: 0.5 }), mic, 0, 0.004, 0);
    const stem = m(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 8), plain('#3A3F48', { metalness: 0.6 }), mic, 0, 0.05, -0.01); stem.rotation.x = -0.35;
    m(new THREE.SphereGeometry(0.014, 14, 10), plain('#1D2026', { roughness: 0.4 }), mic, 0, 0.092, -0.026);
  });
  const gavel = new THREE.Group(); gavel.position.set(0.13, 0.183, 0.07); gavel.rotation.y = 0.5; root.add(gavel);
  m(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 20), wood, gavel, 0, 0.006, 0);
  const head = m(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 16), plain('#5A341C'), gavel, 0, 0.03, 0); head.rotation.z = Math.PI / 2;
  const handle = m(new THREE.CylinderGeometry(0.005, 0.006, 0.09, 8), plain('#5A341C'), gavel, 0, 0.03, 0.045); handle.rotation.x = Math.PI / 2;

  const members = {};
  // soft vertical/diagonal colour gradient baked into a geometry's vertices
  function paint(geo, stops, dir = [0, 1, 0]) {
    const p = geo.attributes.position, col = [], d = new THREE.Vector3(...dir).normalize(), tmp = new THREE.Vector3();
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < p.count; i++) { const k = tmp.fromBufferAttribute(p, i).dot(d); mn = Math.min(mn, k); mx = Math.max(mx, k); }
    const cs = stops.map((s) => new THREE.Color(s)), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const u = Math.min(1, Math.max(0, (tmp.fromBufferAttribute(p, i).dot(d) - mn) / (mx - mn || 1))), k = Math.min(cs.length - 2, Math.floor(u * (cs.length - 1)));
      c.copy(cs[k]).lerp(cs[k + 1], u * (cs.length - 1) - k); col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return geo;
  }
  const glossy = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.72, ...o });
  const glowWhite = new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: '#FFFFFF', emissiveIntensity: 0.55, roughness: 0.3 });
  const bar = (parent, a, b, r = 0.0085) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, d.length(), 2, 6), glowWhite);
    o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(UP, d.normalize()); parent.add(o); return o;
  };
  const feet = (g, color, y = 0.015, w = 0.045) => [-1, 1].forEach((s) => { const f = m(new THREE.CapsuleGeometry(0.018, 0.02, 6, 12), plain(color, { roughness: 0.6, flatShading: true }), g, s * w, y, 0.02); f.rotation.x = Math.PI / 2; });

  // ---------- the original clay cast (13 Nov 2026): Byte, Sage, Gigi & Gogo ----------
  // Original characters, not the AI companies' logos. Each keeps the slot and animation hooks of the member it
  // replaced (codex -> Byte, claude -> Sage, gemini/twin -> Gigi & Gogo), so pose() and the episodes work unchanged.
  const bead = new THREE.MeshStandardMaterial({ color: '#17110E', roughness: 0.22 }); // glossy clay-bead eyes
  const dark = clayMat('#2A1814', { roughness: 0.7 });

  // ---------- Byte: a slate-blue clay pebble with an antenna; literal, instant, asks nothing (index 0) ----------
  {
    const g = new THREE.Group(); g.position.set(XS[0], 0.17, -0.05); root.add(g);
    const blob = new THREE.Group(); blob.position.y = 0.13; g.add(blob);
    const blue = clayMat('#5E7FC2');
    const body = m(new THREE.SphereGeometry(0.105, 40, 28), blue, blob); body.scale.set(1.12, 0.92, 0.8);
    const stalk = m(new THREE.CylinderGeometry(0.006, 0.008, 0.07, 10), clayMat('#4A66A3'), blob, 0.02, 0.115, 0); stalk.rotation.z = -0.25;
    m(new THREE.SphereGeometry(0.017, 20, 14), clayMat('#F2C14E'), blob, 0.03, 0.152, 0);
    feet(g, '#4A66A3', 0.02, 0.045);
    const Z = 0.082, F = {};
    const mk = (name) => (F[name] = new THREE.Group(), F[name].position.set(0, 0.005, Z), blob.add(F[name]), F[name]);
    const eyes = (grp, y = 0.012, sy = 1) => [-1, 1].forEach((s) => { const e = m(new THREE.SphereGeometry(0.013, 18, 12), bead, grp, s * 0.034, y, 0); e.scale.set(0.9, 1.15 * sy, 0.6); });
    const line = (grp, x, y, w, rot = 0) => { const c = m(new THREE.CapsuleGeometry(0.0045, w, 4, 8), dark, grp, x, y, 0); c.rotation.z = Math.PI / 2 + rot; return c; };
    eyes(mk('neutral')); line(F.neutral, 0, -0.03, 0.024);
    eyes(mk('talk')); F.cursor = m(new THREE.SphereGeometry(0.016, 18, 12), dark, F.talk, 0, -0.032, 0); F.cursor.scale.set(1.3, 1, 0.5);
    eyes(mk('think'), 0.026); m(new THREE.SphereGeometry(0.008, 12, 8), dark, F.think, 0.012, -0.03, 0);
    [-1, 1].forEach((s) => { const a = m(new THREE.TorusGeometry(0.013, 0.0045, 8, 16, Math.PI), dark, mk('happy'), s * 0.034, 0.008, 0); });
    const sm = m(new THREE.TorusGeometry(0.02, 0.005, 8, 18, Math.PI), dark, F.happy, 0, -0.022, 0); sm.rotation.z = Math.PI;
    line(mk('blink'), -0.034, 0.01, 0.016); line(F.blink, 0.034, 0.01, 0.016); line(F.blink, 0, -0.03, 0.024);
    eyes(mk('worried'), 0.012, 0.8); line(F.worried, -0.008, -0.032, 0.012, 0.35); line(F.worried, 0.008, -0.032, 0.012, -0.35);
    const arms = [arm(g, blue, 0.014), arm(g, blue, 0.014)];
    members.codex = { g, blob, F, arms, kind: 'codex' };
  }

  // ---------- Sage: a sage-green clay egg with round glasses and a mustard scarf; careful, polite, says too much (index 1) ----------
  {
    const g = new THREE.Group(); g.position.set(XS[1], 0.188, -0.05); root.add(g);
    const U = 0.0105;
    const green = clayMat('#8DB28A');
    const legs = [-1, 1].map((s) => m(new THREE.SphereGeometry(0.02, 16, 10), clayMat('#6F9470'), g, s * 0.035, 2 * U, 0.01));
    legs.forEach((l) => l.scale.set(1.2, 0.6, 1.4));
    const bodyG = new THREE.Group(); g.add(bodyG);
    const egg = m(new THREE.SphereGeometry(0.1, 40, 28), green, bodyG, 0, 0.125, 0); egg.scale.set(0.95, 1.18, 0.82);
    const scarf = m(new THREE.TorusGeometry(0.068, 0.017, 12, 32), clayMat('#E2A93B'), bodyG, 0, 0.085, 0); scarf.rotation.x = Math.PI / 2 - 0.15; scarf.scale.set(1.12, 1, 0.85);
    const tail = m(new THREE.CapsuleGeometry(0.014, 0.05, 6, 10), clayMat('#E2A93B'), bodyG, 0.04, 0.05, 0.07); tail.rotation.z = 0.3;
    const armL = new THREE.Group(); armL.position.set(-0.09, 0.11, 0); bodyG.add(armL);
    const armR = new THREE.Group(); armR.position.set(0.09, 0.11, 0); bodyG.add(armR);
    [armL, armR].forEach((a, i) => { const c = m(new THREE.CapsuleGeometry(0.014, 0.04, 6, 10), green, a, (i ? 1 : -1) * 0.022, -0.012, 0); c.rotation.z = (i ? 1 : -1) * 1.1; });
    const FZ = 0.086; // just in front of the egg surface at eye height
    const eyes = [-1, 1].map((s) => { const e = m(new THREE.SphereGeometry(0.013, 18, 12), bead, bodyG, s * 0.03, 0.153, FZ + 0.008); e.scale.set(0.9, 1.2, 0.7); e.userData.y0 = e.position.y; return e; });
    const rim = clayMat('#3B2A22', { roughness: 0.55 });
    [-1, 1].forEach((s) => m(new THREE.TorusGeometry(0.024, 0.004, 10, 28), rim, bodyG, s * 0.03, 0.155, FZ + 0.004));
    const bridge = m(new THREE.CapsuleGeometry(0.003, 0.01, 4, 8), rim, bodyG, 0, 0.158, FZ + 0.008); bridge.rotation.z = Math.PI / 2;
    const mouthB = m(new THREE.SphereGeometry(0.012, 16, 10), dark, bodyG, 0, 0.11, FZ - 0.003); mouthB.scale.set(1.5, 1, 0.5);
    const happy = new THREE.Group(); bodyG.add(happy);
    [-1, 1].forEach((s) => m(new THREE.TorusGeometry(0.011, 0.004, 8, 14, Math.PI), dark, happy, s * 0.03, 0.15, FZ + 0.002));
    members.claude = { g, bodyG, legs, armL, armR, eyes, mouthB, happy, U, kind: 'claude' };
  }

  // ---------- Gigi & Gogo: a pink clay bean and her small lavender twin; cheerful, overconfident, overshare (index 2) ----------
  {
    const g = new THREE.Group(); g.position.set(XS[2], 0.17, -0.05); root.add(g);
    const big = new THREE.Group(); big.position.y = 0.14; g.add(big);
    const bean = m(new THREE.SphereGeometry(0.1, 40, 28), clayMat('#E98BA2'), big); bean.scale.set(1, 1.12, 0.8);
    const curl = m(new THREE.TorusGeometry(0.018, 0.007, 10, 20, Math.PI * 1.5), clayMat('#C9607E'), big, -0.02, 0.112, 0); curl.rotation.z = 0.6;
    const bigFace = new THREE.Group(); bigFace.position.set(0, 0.0, 0.078); big.add(bigFace);
    const twin = new THREE.Group(); twin.position.set(0.11, 0.28, 0.02); g.add(twin);
    const ball = m(new THREE.SphereGeometry(0.045, 32, 22), clayMat('#A99AE6'), twin); ball.scale.set(1, 1.05, 0.85);
    const twinFace = new THREE.Group(); twinFace.position.set(0, -0.002, 0.036); twin.add(twinFace);
    const lidM = clayMat('#D9768F');
    const mkFace = (grp, k) => ({
      headG: grp,
      eyes: [-1, 1].map((s) => eye(grp, s * 0.026 * k, 0.012 * k, 0, 0.012 * k, lidM)),
      brows: [-1, 1].map((s) => brow(grp, s * 0.027 * k, 0.036 * k, 0, 0.013 * k)),
      mo: mouth(grp, 0, -0.018 * k, 0.002, 0.012 * k),
    });
    const heads = [mkFace(bigFace, 1), mkFace(twinFace, 0.5)];
    heads[0].brows.forEach((b) => (b.visible = false));
    members.gemini = { g, big, twin, heads, kind: 'gemini' };
  }

  // ---------- posing ----------
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  function faceSet(f, { talk = 0, blink = 0, mood = 'normal', lid = 0 }) {
    const close = Math.max(blink, lid);
    f.eyes.forEach((e) => { e.lid.visible = close > 0.02; e.lid.position.y = (1 - close) * e.r * 1.9; e.lid.scale.y = 0.3 + close * 0.95; });
    const up = mood === 'excited' ? 0.006 : mood === 'smug' ? 0.002 : mood === 'worried' ? 0.004 : 0;
    f.brows.forEach((b, i) => {
      const s = i ? 1 : -1;
      b.userData.y0 = b.userData.y0 ?? b.position.y;
      b.position.y = b.userData.y0 + up + (mood === 'smug' && s > 0 ? 0.006 : 0);
      b.rotation.z = mood === 'worried' ? s * -0.35 : mood === 'smug' ? (s > 0 ? 0.3 : -0.05) : mood === 'excited' ? s * 0.15 : 0;
    });
    const open = mood === 'excited' ? Math.max(talk, 0.5) : mood === 'happy' ? Math.max(talk, 0.35) : talk;
    f.mo.inner.scale.set(1.15 - open * 0.15, 0.22 + open * 0.95, 0.35);
    f.mo.tongue.visible = open > 0.45; f.mo.tongue.scale.y = 0.3 + open * 0.4;
  }
  // state: { codex: {talk, blink, mood}, claude: {talk, blink, mood, wave}, gemini: {talkL (big), talkR (twin), moodL, moodR, blink} }
  function pose(state, t) {
    const n = (s) => Math.sin(t * 1.7 + s) * 0.5 + Math.sin(t * 2.9 + s * 2) * 0.3;
    // Codex: calm hover, face switches by mood; talking turns the cursor into a pulsing block
    const cx = members.codex, cs = state.codex || {};
    cx.blob.position.y = 0.13 + Math.sin(t * 2.2) * 0.004; cx.blob.rotation.z = n(2) * 0.04;
    const mode = cs.blink > 0.5 ? 'blink' : cs.talk > 0.05 ? 'talk' : cs.mood === 'happy' ? 'happy' : cs.mood === 'think' ? 'think' : cs.mood === 'worried' ? 'worried' : 'neutral';
    for (const k of ['neutral', 'talk', 'think', 'happy', 'blink', 'worried']) cx.F[k].visible = k === mode;
    cx.F.cursor.scale.y = 0.35 + (cs.talk || 0) * 0.9;
    cx.arms[0].set(v(-0.1, 0.12, 0), v(-0.12, 0.05, 0.06)); cx.arms[1].set(v(0.1, 0.12, 0), v(0.12, 0.05, 0.06));
    // Claude: hops a little when it talks, arms flap, the slot eyes squash for blinks and moods
    const cl = members.claude, ks = state.claude || {}, U = cl.U, tk = ks.talk || 0;
    const mood = ks.mood || 'normal';
    cl.bodyG.position.y = Math.abs(Math.sin(t * 6)) * U * 0.6 * tk + (mood === 'happy' ? U * 0.6 : 0);
    cl.bodyG.rotation.z = n(3) * 0.03;
    cl.armL.rotation.z = -(ks.wave ? 0.5 + Math.sin(t * 9) * 0.4 : tk * Math.sin(t * 10) * 0.25);
    cl.armR.rotation.z = ks.wave ? 0.5 + Math.sin(t * 9 + 1) * 0.4 : tk * Math.sin(t * 10 + 1) * 0.25;
    cl.legs.forEach((l, i) => (l.position.y = 2 * U + (mood === 'happy' ? Math.max(0, Math.sin(t * 12 + i * 1.6)) * U * 0.8 : 0)));
    const blinkC = (ks.blink || 0) > 0.5;
    const eh = blinkC ? 0.25 : mood === 'worried' || mood === 'small' ? 0.5 : 1, eUp = mood === 'think' ? 1.2 * U : mood === 'worried' ? -0.5 * U : 0;
    cl.eyes.forEach((e) => { e.visible = mood !== 'happy' || blinkC; e.scale.y = eh; e.position.y = e.userData.y0 + eUp - (blinkC ? 1.2 * U : 0); });
    cl.happy.visible = mood === 'happy' && !blinkC;
    cl.mouthB.visible = tk > 0.05 || mood === 'worried'; cl.mouthB.scale.y = mood === 'worried' && tk < 0.05 ? 0.5 : 0.35 + tk * 0.9;
    // Gemini: the big one floats, the twin bobs around its shoulder
    const gm = members.gemini, gs = state.gemini || {};
    gm.big.position.y = 0.14 + Math.sin(t * 1.8) * 0.005; gm.big.rotation.z = n(5) * 0.05;
    gm.twin.position.set(0.11 + Math.sin(t * 1.3) * 0.008, 0.28 + Math.sin(t * 2.4 + 1) * 0.01, 0.02); gm.twin.rotation.z = Math.sin(t * 1.1) * 0.15;
    faceSet(gm.heads[0], { talk: gs.talkL || 0, blink: gs.blink || 0, mood: gs.moodL || 'normal' });
    faceSet(gm.heads[1], { talk: gs.talkR || 0, blink: gs.blink || 0, mood: gs.moodR || 'smug' });
  }

  return { root, members, pose, XS };
}
