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
  const a = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 1, 6), mat); a.castShadow = true; parent.add(a);
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), mat); parent.add(s);
  const h = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.45, 0), mat); h.castShadow = true; parent.add(h);
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
  const NAMES = ['Codex', 'Claude', 'Gemini'], XS = [-0.26, 0, 0.26];
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
  const feet = (g, color, y = 0.015, w = 0.045) => [-1, 1].forEach((s) => { const f = m(new THREE.CapsuleGeometry(0.018, 0.02, 2, 6), plain(color, { roughness: 0.6, flatShading: true }), g, s * w, y, 0.02); f.rotation.x = Math.PI / 2; });

  // ---------- Codex: the puffy blue cloud with a >_ face (index 0) ----------
  {
    const g = new THREE.Group(); g.position.set(XS[0], 0.17, -0.05); root.add(g);
    const blob = new THREE.Group(); blob.position.y = 0.13; g.add(blob);
    // the scalloped cloud outline = the outer edge of a centre disc and 8 lobes, extruded into a soft cushion
    const circles = [[0, 0, 0.1]];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; circles.push([Math.cos(a) * 0.072, Math.sin(a) * 0.072, 0.064]); }
    const shape = new THREE.Shape();
    for (let i = 0; i <= 48; i++) {
      const th = (i / 48) * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
      let r = 0; for (const [cx, cy, rr] of circles) { const b = dx * cx + dy * cy, disc = b * b - (cx * cx + cy * cy) + rr * rr; if (disc >= 0) r = Math.max(r, b + Math.sqrt(disc)); }
      i ? shape.lineTo(dx * r * 0.88, dy * r * 0.88) : shape.moveTo(dx * r * 0.88, dy * r * 0.88);
    }
    const cg = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.032, bevelSize: 0.022, bevelSegments: 3, curveSegments: 2 });
    cg.translate(0, 0, -0.015);
    m(paint(cg, ['#1F3FF2', '#4E6BFF', '#B3AEFF'], [-0.45, 1, 0]), glossy(), blob);
    feet(g, '#2E44C9', 0.02, 0.04);
    // faces: the ">" is its eye, the "_" is its mouth (a cursor). One group per expression, toggled.
    const Z = 0.05, F = {};
    const mk = (name) => (F[name] = new THREE.Group(), F[name].position.set(0, 0, Z), blob.add(F[name]), F[name]);
    const chevron = (grp, flip = 1) => { bar(grp, [-0.048 * flip, 0.03, 0], [-0.018 * flip, 0, 0]); bar(grp, [-0.018 * flip, 0, 0], [-0.048 * flip, -0.03, 0]); };
    chevron(mk('neutral')); bar(F.neutral, [0.004, -0.032, 0], [0.05, -0.032, 0]);
    chevron(mk('talk')); F.cursor = m(new RoundedBoxGeometry(0.036, 0.036, 0.01, 2, 0.006), glowWhite, F.talk, 0.026, -0.026, 0);
    chevron(mk('think')); [0, 1, 2].forEach((i) => m(new THREE.SphereGeometry(0.0085, 12, 8), glowWhite, F.think, 0.008 + i * 0.02, -0.032, 0));
    bar(mk('happy'), [-0.052, -0.006, 0], [-0.034, 0.02, 0]); bar(F.happy, [-0.034, 0.02, 0], [-0.016, -0.006, 0]);
    const smile = m(new THREE.TorusGeometry(0.02, 0.0085, 8, 20, Math.PI), glowWhite, F.happy, 0.028, -0.02, 0); smile.rotation.z = Math.PI;
    bar(mk('blink'), [-0.05, 0.0, 0], [-0.018, 0.0, 0]); bar(F.blink, [0.004, -0.032, 0], [0.05, -0.032, 0]);
    chevron(mk('worried'), -1); [0, 1, 2, 3].forEach((i) => bar(F.worried, [0.004 + i * 0.012, -0.03 - (i % 2) * 0.008, 0], [0.016 + i * 0.012, -0.03 - ((i + 1) % 2) * 0.008, 0], 0.006));
    const arms = [arm(g, plain('#4D66FB', { flatShading: true }), 0.014), arm(g, plain('#4D66FB', { flatShading: true }), 0.014)];
    members.codex = { g, blob, F, arms, kind: 'codex' };
  }

  // ---------- Claude: the orange pixel creature, built from blocks (index 1) ----------
  // Same grid as the icon: 30 x 18 pixels. Body 22 x 14, a 30-wide band for arms, four 2 x 4 legs.
  {
    const g = new THREE.Group(); g.position.set(XS[1], 0.188, -0.05); root.add(g);
    const U = 0.0105, D = 10 * U;
    const orange = new THREE.MeshStandardMaterial({ color: '#D97757', roughness: 0.78, flatShading: true });
    const holeM = new THREE.MeshStandardMaterial({ color: '#2A1612', roughness: 0.5 });
    // c = column from the left (0..30), r = row from the top (0..18); y = 0 at the feet
    const px = (parent, c, r, w, h, mat = orange, d = D, z = 0) =>
      m(new THREE.BoxGeometry(w * U, h * U, d), mat, parent, (c + w / 2 - 15) * U, (18 - r - h / 2) * U, z);
    const legs = [6, 10, 18, 22].map((c) => px(g, c, 14, 2, 4, orange, D * 0.6));
    const bodyG = new THREE.Group(); g.add(bodyG);
    px(bodyG, 4, 0, 22, 14);
    // arms: the outer ends of the band, each on a hinge at the body edge so they can wave
    const armL = new THREE.Group(); armL.position.set((4 - 15) * U, 9 * U, 0); bodyG.add(armL);
    const armR = new THREE.Group(); armR.position.set((26 - 15) * U, 9 * U, 0); bodyG.add(armR);
    m(new THREE.BoxGeometry(4 * U, 4 * U, D * 0.8), orange, armL, -2 * U, 0, 0);
    m(new THREE.BoxGeometry(4 * U, 4 * U, D * 0.8), orange, armR, 2 * U, 0, 0);
    // face on the front: two slot eyes, a mouth that only shows when it talks, and ^ ^ eyes for happy
    const FZ = D / 2 + 0.0008;
    const eyes = [8, 20].map((c) => px(bodyG, c, 3, 2, 4, holeM, 0.4 * U, FZ));
    eyes.forEach((e) => (e.userData.y0 = e.position.y));
    const mouthB = px(bodyG, 13, 8, 4, 2, holeM, 0.4 * U, FZ);
    const happy = new THREE.Group(); bodyG.add(happy);
    [[7, 4], [8, 3], [9, 3], [10, 4], [19, 4], [20, 3], [21, 3], [22, 4]].forEach(([c, r]) => px(happy, c, r, 1, 1, holeM, 0.4 * U, FZ));
    members.claude = { g, bodyG, legs, armL, armR, eyes, mouthB, happy, U, kind: 'claude' };
  }

  // ---------- Gemini: the puffy sparkle twins (index 2) ----------
  {
    const g = new THREE.Group(); g.position.set(XS[2], 0.17, -0.05); root.add(g);
    const sparkleGeo = (R, depth) => {
      const s = new THREE.Shape(), q = 0.16;
      s.moveTo(0, R); s.quadraticCurveTo(R * q, R * q, R, 0); s.quadraticCurveTo(R * q, -R * q, 0, -R);
      s.quadraticCurveTo(-R * q, -R * q, -R, 0); s.quadraticCurveTo(-R * q, R * q, 0, R);
      const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.9, bevelSize: R * 0.09, bevelSegments: 2, curveSegments: 5 });
      geo.translate(0, 0, -depth / 2); return geo;
    };
    const STOPS = ['#2F74F7', '#8A5CF0', '#F2557A'];
    const big = new THREE.Group(); big.position.y = 0.14; g.add(big);
    m(paint(sparkleGeo(0.13, 0.03), STOPS, [1, -1, 0]), glossy(), big);
    const bigFace = new THREE.Group(); bigFace.position.set(0, -0.005, 0.045); big.add(bigFace);
    const twin = new THREE.Group(); twin.position.set(0.11, 0.28, 0.02); g.add(twin);
    m(paint(sparkleGeo(0.055, 0.016), ['#4F8CFF', '#C06BE0', '#F2557A'], [1, -1, 0]), glossy(), twin);
    const twinFace = new THREE.Group(); twinFace.position.set(0, -0.002, 0.022); twin.add(twinFace);
    const skin = plain('#8C6FD8', { flatShading: true });
    const mkFace = (grp, k) => ({
      headG: grp,
      eyes: [-1, 1].map((s) => eye(grp, s * 0.022 * k, 0.008 * k, 0, 0.011 * k, skin)),
      brows: [-1, 1].map((s) => brow(grp, s * 0.023 * k, 0.03 * k, 0, 0.012 * k)),
      mo: mouth(grp, 0, -0.016 * k, 0.002, 0.011 * k),
    });
    const heads = [mkFace(bigFace, 1), mkFace(twinFace, 0.55)];
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
