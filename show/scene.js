// "Can We Sell This?" - low-poly 3D sitcom. Meera runs a small candle brand; Dabba is her cardboard-box AI.
// Stateless: window.renderAt(t) sets every pose from time t, so any frame renders on its own.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildCommittee } from './committee.js';

const W = 1080, H = 1920, FPS = 30;
const TL = window.TL;
const BEATS = TL.beats;

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, x) => a + (b - a) * x;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = (x) => 1 - Math.pow(1 - x, 3);
const eInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const noise = (t, s) => Math.sin(t * 1.3 + s) * 0.5 + Math.sin(t * 2.1 + s * 1.7) * 0.3 + Math.sin(t * 0.7 + s * 3.1) * 0.2;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
  if (parent) parent.add(o); return o;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  tex.userData.ctx = x; return tex;
}
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
// put a cylinder between two points (arms)
const UP = v3(0, 1, 0);
function limb(m, a, b) {
  const d = b.clone().sub(a), len = d.length();
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  m.scale.set(1, len, 1);
}

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('gl').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 60);
const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0.004, maxblur: 0.008 });
composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.32, 0.55, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const film = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, time: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c = mix(c, c * vec3(1.04, 1.0, 0.94), 0.6);              // warm grade
      c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 1.06); // a touch more colour
      vec2 d = vUv - 0.5; d.x *= 0.62;
      c *= 1.0 - smoothstep(0.32, 0.78, length(d)) * 0.42;     // vignette
      c += (h(vUv * 1000.0) - 0.5) * 0.022;                      // grain
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(film);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#8FA3D6', '#2A1E1A', 0.6); scene.add(hemi);
const key = new THREE.DirectionalLight('#FFB873', 1.6);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -2, near: 0.5, far: 20 });
key.shadow.bias = -0.0005; key.shadow.radius = 5;
scene.add(key); scene.add(key.target);
const lamp = new THREE.PointLight('#FFB060', 5, 5, 1.6); scene.add(lamp);
const screenGlow = new THREE.PointLight('#BFD6FF', 1.4, 2.2, 1.8); scene.add(screenGlow);
const shelfGlow = new THREE.PointLight('#FF9A4A', 2.2, 3.2, 1.8); scene.add(shelfGlow);
const rim = new THREE.DirectionalLight('#6F8CFF', 0.9); rim.position.set(-3, 3, -4); scene.add(rim);
const faceFill = new THREE.PointLight('#FFD9B8', 0.6, 4, 2); scene.add(faceFill);
const backLight = new THREE.SpotLight('#9DB8FF', 6, 6, 0.55, 0.8, 1.5); backLight.position.set(0.6, 3.4, -2.4); scene.add(backLight); scene.add(backLight.target);

// ---------- the room ----------
const room = new THREE.Group(); scene.add(room);
const floor = mesh(new THREE.PlaneGeometry(14, 10), mat('#4A3328', { flatShading: false }), room, 0, 0, 0);
floor.rotation.x = -Math.PI / 2;
const wallMat = mat('#4F6B68', { flatShading: false, roughness: 0.95 });
mesh(new THREE.PlaneGeometry(14, 7), wallMat, room, 0, 3.5, -3);
const sideWall = mesh(new THREE.PlaneGeometry(10, 7), wallMat, room, 3.4, 3.5, 0); sideWall.rotation.y = -Math.PI / 2;
const sideWallL = mesh(new THREE.PlaneGeometry(10, 7), wallMat, room, -3.4, 3.5, 0); sideWallL.rotation.y = Math.PI / 2;
// skirting
mesh(new THREE.BoxGeometry(14, 0.16, 0.04), mat('#E9E1D2'), room, 0, 0.08, -2.98);

// window with the city outside (night) / sunrise (morning)
const winG = new THREE.Group(); winG.position.set(-1.75, 2.55, -2.97); room.add(winG);
const nightTex = canvasTex(512, 640, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0B1430'); g.addColorStop(1, '#22305A');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { const bw = 40 + rnd() * 70, bh = 160 + rnd() * 330, bx = rnd() * w; x.fillStyle = '#0A1022'; x.fillRect(bx, h - bh, bw, bh);
    for (let k = 0; k < 18; k++) if (rnd() < 0.5) { x.fillStyle = rnd() < 0.7 ? '#FFD27A' : '#9FD0FF'; x.fillRect(bx + 6 + rnd() * (bw - 14), h - bh + 10 + rnd() * (bh - 20), 6, 8); } }
  x.filter = 'blur(10px)';
  for (let i = 0; i < 26; i++) { const r = 14 + rnd() * 26; x.globalAlpha = 0.35 + rnd() * 0.4; x.fillStyle = ['#FFB24A', '#FF7A59', '#8EC5FF', '#FFE08A'][Math.floor(rnd() * 4)]; x.beginPath(); x.arc(rnd() * w, 200 + rnd() * 440, r, 0, 7); x.fill(); }
  x.filter = 'none'; x.globalAlpha = 1;
});
const dayTex = canvasTex(512, 640, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#FFE7C2'); g.addColorStop(0.6, '#FFC79A'); g.addColorStop(1, '#F2A982');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const s = x.createRadialGradient(330, 380, 10, 330, 380, 220); s.addColorStop(0, 'rgba(255,250,225,1)'); s.addColorStop(1, 'rgba(255,240,200,0)');
  x.fillStyle = s; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { const bw = 40 + rnd() * 70, bh = 120 + rnd() * 300; x.fillStyle = 'rgba(214,150,128,0.75)'; x.fillRect(rnd() * w, h - bh, bw, bh); }
});
const glassN = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), new THREE.MeshBasicMaterial({ map: nightTex, toneMapped: false }));
const glassD = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), new THREE.MeshBasicMaterial({ map: dayTex, toneMapped: false }));
glassD.position.z = 0.002; winG.add(glassN); winG.add(glassD);
// a grey rainy day, with streaks that slide down the glass
const rainSkyTex = canvasTex(512, 640, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8E99A6'); g.addColorStop(1, '#5D6874');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { const bw = 40 + rnd() * 70, bh = 140 + rnd() * 300; x.fillStyle = 'rgba(60,70,82,0.7)'; x.fillRect(rnd() * w, h - bh, bw, bh); }
  x.filter = 'blur(6px)'; x.fillStyle = 'rgba(200,210,220,0.25)'; x.fillRect(0, 0, w, h * 0.4); x.filter = 'none';
});
const glassR = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), new THREE.MeshBasicMaterial({ map: rainSkyTex, toneMapped: false }));
glassR.position.z = 0.004; winG.add(glassR);
const streakTex = canvasTex(256, 512, (x, w, h) => {
  x.clearRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { const sx = rnd() * w, sy = rnd() * h, l = 20 + rnd() * 50; x.strokeStyle = `rgba(235,242,250,${0.25 + rnd() * 0.35})`; x.lineWidth = 1 + rnd() * 1.5; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx - l * 0.12, sy + l); x.stroke(); }
});
streakTex.wrapS = streakTex.wrapT = THREE.RepeatWrapping; streakTex.repeat.set(2, 1.5);
const streaks = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, toneMapped: false, depthWrite: false }));
streaks.position.z = 0.006; winG.add(streaks);
const frameMat = mat('#EDE6D8');
[[0, 1.08, 1.86, 0.08], [0, -1.08, 1.86, 0.08], [-0.89, 0, 0.08, 2.24], [0.89, 0, 0.08, 2.24], [0, 0, 0.05, 2.1], [0, 0.05, 1.7, 0.05]].forEach(([x, y, w, h]) => mesh(new THREE.BoxGeometry(w, h, 0.08), frameMat, winG, x, y, 0.03));
mesh(new THREE.BoxGeometry(2.0, 0.07, 0.25), frameMat, winG, 0, -1.12, 0.1);
// a plant on the sill
const pot = mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.18, 7), mat('#C8693E'), winG, -0.55, -0.99, 0.12);
for (let i = 0; i < 6; i++) { const l = mesh(new THREE.IcosahedronGeometry(0.09, 0), mat('#5E9B5A'), winG, -0.55 + (rnd() - 0.5) * 0.16, -0.82 + rnd() * 0.16, 0.12 + (rnd() - 0.5) * 0.1); l.scale.set(0.6, 1.4, 0.6); l.rotation.z = (rnd() - 0.5) * 1.2; }

// fairy lights along the back wall
const bulbs = [];
const bulbMat = new THREE.MeshBasicMaterial({ color: '#FFD08A', toneMapped: false });
for (let i = 0; i <= 26; i++) {
  const u = i / 26, x = lerp(-3.2, 3.2, u), y = 4.15 - Math.sin(u * Math.PI * 3) ** 2 * 0.35;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bulbMat); b.position.set(x, y, -2.92); room.add(b); bulbs.push(b);
}

// shelf with candle jars (her product) and packed orders
const shelfG = new THREE.Group(); shelfG.position.set(1.75, 0, -2.75); room.add(shelfG);
const plank = mat('#C89A6A');
const flames = [];
const jarCols = ['#D9A066', '#B9D1C2', '#E7C9B5', '#C9B6E0', '#E9DCC2'];
[1.55, 2.25, 2.95].forEach((y, s) => {
  mesh(new THREE.BoxGeometry(2.2, 0.06, 0.42), plank, shelfG, 0, y, 0.05);
  let x = -0.95;
  while (x < 0.95) {
    if (s === 0 && rnd() < 0.35) { const bw = 0.24 + rnd() * 0.2, bh = 0.18 + rnd() * 0.16; mesh(new THREE.BoxGeometry(bw, bh, 0.26), mat('#C69A62'), shelfG, x + bw / 2, y + 0.03 + bh / 2, 0.05); x += bw + 0.06; continue; }
    const jar = new THREE.Group(); jar.position.set(x + 0.1, y + 0.03, 0.05 + (rnd() - 0.5) * 0.08); shelfG.add(jar);
    mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.2, 8), mat(jarCols[Math.floor(rnd() * jarCols.length)], { roughness: 0.4 }), jar, 0, 0.1, 0);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), mat('#F4EFE6'), jar, 0, 0.215, 0);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), new THREE.MeshBasicMaterial({ color: '#FFC46B', toneMapped: false }));
    fl.position.set(0, 0.26, 0); jar.add(fl); flames.push(fl);
    x += 0.24 + rnd() * 0.06;
  }
});
// framed brand poster
const poster = mesh(new THREE.BoxGeometry(0.9, 1.15, 0.03), mat('#2B2B2B'), room, 0.35, 2.95, -2.96);
const posterArt = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(400, 520, (x, w, h) => {
  x.fillStyle = '#F1E4CF'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#C4552D'; x.beginPath(); x.ellipse(w / 2, 300, 70, 95, 0, 0, 7); x.fill();
  x.fillStyle = '#F1E4CF'; x.fillRect(w / 2 - 3, 190, 6, 30);
  x.fillStyle = '#FFB347'; x.beginPath(); x.ellipse(w / 2, 175, 14, 26, 0, 0, 7); x.fill();
  x.fillStyle = '#3A2A20'; x.font = '64px "Bree Serif"'; x.textAlign = 'center'; x.fillText('mitti', w / 2, 460);
  x.font = '600 18px InterSB'; x.fillText('HAND-POURED CANDLES', w / 2, 492);
}) }));
posterArt.position.set(0.35, 2.95, -2.94); room.add(posterArt);

// ---------- the desk ----------
const deskG = new THREE.Group(); room.add(deskG);
const woodM = mat('#B07A4F', { flatShading: false, roughness: 0.7 });
mesh(new RoundedBoxGeometry(3.0, 0.08, 1.35, 2, 0.02), woodM, deskG, 0.15, 1.0, 0.3);
[[-1.25, -0.3], [1.55, -0.3], [-1.25, 0.9], [1.55, 0.9]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(0.07, 1.0, 0.07), mat('#8A5C3A'), deskG, x, 0.5, z));
// chair back behind Meera
mesh(new RoundedBoxGeometry(0.85, 0.9, 0.1, 2, 0.04), mat('#2F3A44'), room, -0.35, 1.45, -1.05);
// laptop (screen faces Meera)
const lapG = new THREE.Group(); lapG.position.set(-0.35, 1.04, 0.4); deskG.add(lapG);
const alu = mat('#A9B0B8', { flatShading: false, roughness: 0.45, metalness: 0.3 });
mesh(new THREE.BoxGeometry(0.78, 0.025, 0.52), alu, lapG, 0, 0.012, 0);
const lid = new THREE.Group(); lid.position.set(0, 0.025, 0.26); lapG.add(lid);
lid.rotation.x = -0.22; // tilt back, away from Meera
mesh(new THREE.BoxGeometry(0.78, 0.5, 0.018), alu, lid, 0, 0.25, 0);
const screenTex = canvasTex(1024, 640, () => {});
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.45), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
screen.position.set(0, 0.25, -0.0105); screen.rotation.y = Math.PI; lid.add(screen);
screen.material.color.setScalar(0.72); // keep the white screen under the bloom threshold
// sticky note on the back of the lid
const note = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.14), new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(128, 128, (x) => {
  x.fillStyle = '#FFE36E'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#3A2A20'; x.font = '600 22px InterSB'; x.textAlign = 'center'; x.fillText('ship by', 64, 52); x.fillText('5 pm!!', 64, 84);
}) }));
note.position.set(0.22, 0.38, 0.0095); note.rotation.z = 0.12; lid.add(note);
// mug
const mugG = new THREE.Group(); mugG.position.set(0.32, 1.04, 0.42); deskG.add(mugG);
mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.15, 9), mat('#E9E1D2'), mugG, 0, 0.075, 0);
mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.01, 9), mat('#5A3A26'), mugG, 0, 0.14, 0);
const handle = mesh(new THREE.TorusGeometry(0.04, 0.012, 5, 8), mat('#E9E1D2'), mugG, -0.075, 0.08, 0); handle.rotation.y = Math.PI / 2;
// phone
const phoneG = new THREE.Group(); phoneG.position.set(0.0, 1.045, 0.75); deskG.add(phoneG);
mesh(new RoundedBoxGeometry(0.14, 0.015, 0.28, 2, 0.006), mat('#1B1E24', { flatShading: false }), phoneG, 0, 0, 0);
const phoneScr = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.25), new THREE.MeshBasicMaterial({ color: '#0E1116', toneMapped: false }));
phoneScr.rotation.x = -Math.PI / 2; phoneScr.position.y = 0.009; phoneG.add(phoneScr);
// packed parcels on the desk (left)
[[-1.1, 0.35, 0.36, 0.22, 0.3, 0.1], [-1.05, 0.62, 0.3, 0.18, 0.26, -0.15], [-1.12, 0.35, 0.26, 0.16, 0.22, 0.3]].forEach(([x, z, w, h, d, r], i) => {
  const b = mesh(new THREE.BoxGeometry(w, h, d), mat('#C69A62'), deskG, x, 1.04 + h / 2 + (i === 2 ? 0.22 : 0), z); b.rotation.y = r;
  mesh(new THREE.BoxGeometry(w + 0.004, 0.005, 0.06), mat('#D9C59C'), b, 0, h / 2, 0);
});
// desk lamp (left)
const lampG = new THREE.Group(); lampG.position.set(-1.15, 1.04, -0.15); deskG.add(lampG);
mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.03, 8), mat('#2F3A44'), lampG, 0, 0.015, 0);
const arm = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 6), mat('#2F3A44'), lampG, 0.08, 0.38, 0.05); arm.rotation.z = -0.25;
const shade = mesh(new THREE.ConeGeometry(0.16, 0.2, 8, 1, true), mat('#E0A63A', { side: THREE.DoubleSide }), lampG, 0.2, 0.74, 0.12); shade.rotation.z = 0.7;
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#FFE2A8', toneMapped: false }));
bulb.position.set(0.24, 0.68, 0.12); lampG.add(bulb);

// ---------- MEERA ----------
// smooth, soft materials: skin with a little warm glow (fake subsurface), glossy hair, brushed-fleece hoodie
const SKIN = '#BC7A52', HAIR = '#1A1311', HOOD = '#C8562E';
const skinM = new THREE.MeshPhysicalMaterial({ color: SKIN, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color('#FFB89A'), sheenRoughness: 0.6, emissive: '#5A2010', emissiveIntensity: 0.12 });
const hairM = new THREE.MeshPhysicalMaterial({ color: HAIR, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.6, sheenColor: new THREE.Color('#6B4A3A') });
const hoodM = new THREE.MeshPhysicalMaterial({ color: HOOD, roughness: 0.92, sheen: 1, sheenColor: new THREE.Color('#FFB08A'), sheenRoughness: 0.8 });
const hoodDarkM = new THREE.MeshPhysicalMaterial({ color: '#A8441F', roughness: 0.95, sheen: 1, sheenColor: new THREE.Color('#E58A64') });
const creamM = new THREE.MeshStandardMaterial({ color: '#F1E6D4', roughness: 0.8 });
const meera = new THREE.Group(); meera.position.set(-0.35, 0, -0.55); scene.add(meera);
const torsoG = new THREE.Group(); torsoG.position.set(0, 0.9, 0); meera.add(torsoG); // pivot at hips, leans forward
// hoodie: a lathe profile with rounded, slightly puffy shoulders
const prof = [[0.0, 0], [0.43, 0], [0.47, 0.18], [0.47, 0.42], [0.44, 0.62], [0.39, 0.76], [0.29, 0.86], [0.16, 0.91], [0.0, 0.92]].map(([r, y]) => new THREE.Vector2(r, y));
const torso = mesh(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(40), 48), hoodM, torsoG, 0, 0, 0);
torso.scale.set(1.08, 1, 0.78);
const hood = mesh(new THREE.TorusGeometry(0.2, 0.095, 16, 32), hoodDarkM, torsoG, 0, 0.88, -0.07); hood.rotation.x = Math.PI / 2 - 0.35; hood.scale.set(1.1, 1, 1);
mesh(new THREE.CylinderGeometry(0.135, 0.15, 0.06, 24), new THREE.MeshStandardMaterial({ color: '#2A2422', roughness: 0.9 }), torsoG, 0, 0.9, 0.02); // tee under the hoodie
const strings = [-0.075, 0.075].map((x) => {
  const g = new THREE.Group(); g.position.set(x, 0.86, 0.3); g.rotation.x = 0.32; torsoG.add(g);
  mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.24, 8), creamM, g, 0, -0.12, 0);
  mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.04, 8), new THREE.MeshStandardMaterial({ color: '#D9B16A', metalness: 0.5, roughness: 0.35 }), g, 0, -0.25, 0);
  return g;
});
// a small embroidered candle on the chest
const patch = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(128, 128, (x) => {
  x.fillStyle = '#F1E6D4'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill();
  x.fillStyle = '#C8562E'; x.fillRect(48, 58, 32, 44); x.fillStyle = '#FFB347'; x.beginPath(); x.ellipse(64, 42, 9, 15, 0, 0, 7); x.fill();
}) }));
patch.scale.setScalar(0.75); patch.position.set(0.2, 0.62, 0.36); patch.rotation.y = 0.35; torsoG.add(patch);
const neck = mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.2, 24), skinM, torsoG, 0, 0.97, 0);
const headG = new THREE.Group(); headG.position.set(0, 1.27, 0); torsoG.add(headG);
const skull = mesh(new THREE.SphereGeometry(0.4, 64, 48), skinM, headG); skull.scale.set(1.0, 1.04, 0.95);
// soft jaw / cheeks so the face is not a perfect ball
[-1, 1].forEach((s) => { const c = mesh(new THREE.SphereGeometry(0.2, 32, 24), skinM, headG, s * 0.15, -0.14, 0.1); c.scale.set(0.95, 0.8, 0.85); });
[-1, 1].forEach((s) => { const e = mesh(new THREE.SphereGeometry(0.07, 24, 16), skinM, headG, s * 0.395, -0.02, 0); e.scale.set(0.5, 1, 0.8); });
// hair: smooth cap, back & sides, a swept fringe, a bun with a hair tie and a pencil
const cap = mesh(new THREE.SphereGeometry(0.43, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.36), hairM, headG, 0, 0.03, -0.01);
const back = mesh(new THREE.SphereGeometry(0.437, 64, 40, Math.PI - 0.6, Math.PI + 1.2, 0, Math.PI * 0.72), hairM, headG, 0, 0.02, -0.02);
// the gap (phi 0.6..2.54) sits around +z, so the face stays open
[[-0.17, 0.24, 0.28, 0.42, 1.25], [0.08, 0.28, 0.31, -0.25, 1.1], [0.26, 0.2, 0.26, -0.75, 0.9]].forEach(([x, y, z, r, w]) => {
  const f = mesh(new THREE.SphereGeometry(0.15, 32, 20), hairM, headG, x, y, z); f.scale.set(w, 0.5, 0.55); f.rotation.z = r;
});
// a loose strand by each ear
[-1, 1].forEach((s) => { const st = mesh(new THREE.CapsuleGeometry(0.035, 0.22, 8, 16), hairM, headG, s * 0.36, -0.08, 0.14); st.rotation.z = s * 0.12; });
const bun = mesh(new THREE.SphereGeometry(0.17, 40, 30), hairM, headG, 0.02, 0.47, -0.12); bun.scale.set(1, 0.9, 1);
const tie = mesh(new THREE.TorusGeometry(0.11, 0.022, 12, 32), hoodDarkM, headG, 0.02, 0.36, -0.1); tie.rotation.x = Math.PI / 2 + 0.3;
const pencil = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.46, 6), new THREE.MeshStandardMaterial({ color: '#F2C230', roughness: 0.5 }), headG, 0.02, 0.5, -0.12); pencil.rotation.z = 1.15;
mesh(new THREE.ConeGeometry(0.016, 0.05, 6), new THREE.MeshStandardMaterial({ color: '#E8B89A' }), pencil, 0, -0.255, 0).rotation.z = Math.PI;
mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.035, 12), new THREE.MeshStandardMaterial({ color: '#F28BA0' }), pencil, 0, 0.245, 0);
// earrings
const earrings = [-1, 1].map((s) => { const e = mesh(new THREE.TorusGeometry(0.05, 0.01, 12, 32), new THREE.MeshStandardMaterial({ color: '#E8B85A', metalness: 0.85, roughness: 0.25 }), headG, s * 0.4, -0.15, 0.02); e.rotation.y = Math.PI / 2; return e; });
// face: big glossy eyes with two catch-lights, soft brows, button nose, blush
const face = new THREE.Group(); face.position.set(0, -0.02, 0.36); headG.add(face);
const eyeM = new THREE.MeshPhysicalMaterial({ color: '#120C0A', roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
const shine = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
const eyes = [-1, 1].map((s) => {
  const g = new THREE.Group(); g.position.set(s * 0.145, 0.03, 0.01); face.add(g);
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.066, 32, 24), eyeM); e.scale.set(0.82, 1.1, 0.42); g.add(e);
  const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.019, 16, 12), shine); h1.position.set(0.022, 0.032, 0.026); g.add(h1);
  const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8), shine); h2.position.set(-0.02, -0.03, 0.026); g.add(h2);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.072, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), skinM); lid.scale.set(0.9, 1.2, 0.6); g.add(lid);
  return { g, lid };
});
const browM = new THREE.MeshStandardMaterial({ color: '#2A1D18', roughness: 0.7 });
const brows = [-1, 1].map((s) => { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.08, 6, 12), browM); b.rotation.z = Math.PI / 2; const g = new THREE.Group(); g.position.set(s * 0.15, 0.15, 0.025); g.add(b); face.add(g); return g; });
const nose = mesh(new THREE.SphereGeometry(0.032, 24, 16), skinM, face, 0, -0.06, 0.05); nose.scale.set(1.1, 0.85, 0.9);
const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 16), new THREE.MeshStandardMaterial({ color: '#4E1C1E', roughness: 0.5 }));
mouth.position.set(0, -0.165, 0.0); face.add(mouth);
const blushTex = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(232,120,100,0.75)'); g.addColorStop(1, 'rgba(232,120,100,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
const cheeks = [-1, 1].map((s) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.09), new THREE.MeshBasicMaterial({ map: blushTex, transparent: true, depthWrite: false })); c.position.set(s * 0.22, -0.085, -0.01); c.rotation.y = s * 0.55; face.add(c); return c; });
// water drops for wet scenes: little beads that slide down her face and hair
const dropM = new THREE.MeshPhysicalMaterial({ color: '#DCEFFF', roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.75 });
const drops = [[-0.2, 0.1, 0.36, 0.016], [0.18, 0.05, 0.37, 0.013], [-0.05, 0.25, 0.37, 0.012], [0.28, 0.2, 0.28, 0.015], [-0.32, -0.05, 0.24, 0.014], [0.1, -0.12, 0.39, 0.011], [-0.12, 0.33, 0.27, 0.013], [0.33, -0.18, 0.2, 0.012]]
  .map(([x, y, z, r], i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), dropM); d.scale.set(0.85, 1.25, 0.6); d.position.set(x, y, z); d.userData = { x, y, z, ph: i * 0.37 }; d.visible = false; headG.add(d); return d; });
// arms (rebuilt every frame between shoulder, elbow and hand): smooth sleeves, round joints, ribbed cuffs, mitten hands
const arms = [-1, 1].map(() => ({
  up: mesh(new THREE.CylinderGeometry(0.105, 0.095, 1, 24, 1, true), hoodM, meera),
  lo: mesh(new THREE.CylinderGeometry(0.095, 0.085, 1, 24, 1, true), hoodM, meera),
  sh: mesh(new THREE.SphereGeometry(0.135, 32, 24), hoodM, meera),
  el: mesh(new THREE.SphereGeometry(0.098, 24, 16), hoodM, meera),
  cuff: mesh(new THREE.TorusGeometry(0.075, 0.022, 12, 24), hoodDarkM, meera),
  hand: mesh(new THREE.SphereGeometry(0.075, 32, 24), skinM, meera),
}));

// ---------- DABBA ----------
const dabba = new THREE.Group(); dabba.position.set(0.82, 1.04, 0.36); dabba.rotation.y = -0.72; scene.add(dabba);
const kraft = canvasTex(512, 512, (x, w, h) => {
  x.fillStyle = '#C99B63'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '120,80,40' : '235,200,150'},${0.05 + rnd() * 0.08})`; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1); }
  x.strokeStyle = 'rgba(90,60,30,0.25)'; x.lineWidth = 3; x.strokeRect(6, 6, w - 12, h - 12);
});
const kraftSide = canvasTex(512, 512, (x, w, h) => {
  x.drawImage(kraft.image, 0, 0);
  x.fillStyle = 'rgba(60,40,22,0.85)'; x.font = '800 40px InterXB'; x.textAlign = 'center';
  x.fillText('↑↑', 110, 140); x.font = '700 28px InterB'; x.fillText('THIS SIDE UP', 256, 135);
  x.save(); x.translate(300, 330); x.rotate(-0.15); x.strokeStyle = '#B8322A'; x.lineWidth = 7; x.strokeRect(-150, -48, 300, 96);
  x.fillStyle = '#B8322A'; x.font = '800 62px InterXB'; x.fillText('FRAGILE', 0, 22); x.restore();
});
const label = canvasTex(256, 160, (x, w, h) => {
  x.fillStyle = '#F7F3EA'; x.fillRect(0, 0, w, h); x.fillStyle = '#1F1A17';
  for (let i = 0; i < 26; i++) x.fillRect(16 + i * 8, 18, i % 3 ? 3 : 5, 54);
  x.font = '800 40px InterXB'; x.fillText('DABBA', 18, 116); x.font = '600 18px InterSB'; x.fillText('ORDER #0001 · AI', 18, 142);
});
const bodyG = new THREE.Group(); bodyG.position.y = 0.13; dabba.add(bodyG);
const BW = 0.54, BH = 0.42, BD = 0.44;
const kraftM = new THREE.MeshPhysicalMaterial({ map: kraft, roughness: 0.88, sheen: 0.5, sheenColor: new THREE.Color('#FFE2B8') });
const kraftSideM = new THREE.MeshPhysicalMaterial({ map: kraftSide, roughness: 0.88, sheen: 0.5, sheenColor: new THREE.Color('#FFE2B8') });
const body = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 5, 0.035), [kraftSideM, kraftSideM, kraftM, kraftM, kraftM, kraftM]);
body.position.y = BH / 2; body.castShadow = body.receiveShadow = true; bodyG.add(body);
// tape down the front edge
mesh(new THREE.BoxGeometry(0.1, 0.006, BD + 0.006), new THREE.MeshStandardMaterial({ color: '#DCC394', roughness: 0.35, transparent: true, opacity: 0.85 }), bodyG, 0, BH + 0.002, 0).visible = false;
// open flaps, like ears
const flaps = [-1, 1].map((s) => {
  const p = new THREE.Group(); p.position.set(s * BW / 2, BH, 0); bodyG.add(p);
  const f = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.014, BD - 0.03, 2, 0.006), kraftM); f.position.x = s * 0.1; f.castShadow = true; p.add(f);
  return { p, s };
});
const flapsFB = [-1, 1].map((s) => {
  const p = new THREE.Group(); p.position.set(0, BH, s * BD / 2); bodyG.add(p);
  const f = new THREE.Mesh(new RoundedBoxGeometry(BW - 0.05, 0.014, 0.13, 2, 0.006), kraftM); f.position.z = s * 0.065; f.castShadow = true; p.add(f);
  return { p, s };
});
// shipping label on the side
const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.125), new THREE.MeshStandardMaterial({ map: label, roughness: 0.8 }));
lab.position.set(-BW / 2 - 0.002, BH * 0.42, 0.06); lab.rotation.y = -Math.PI / 2; lab.rotation.z = 0.06; bodyG.add(lab);
// face: doodled straight onto the cardboard in marker (no screen, no glow)
const faceTex = canvasTex(400, 300, () => {});
const faceScr = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.36), new THREE.MeshStandardMaterial({ map: faceTex, transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 }));
faceScr.position.set(0, BH * 0.5, BD / 2 + 0.002); bodyG.add(faceScr);
// legs and little arms: rolled-up cardboard tubes
const tubeM = mat('#B88A55', { roughness: 0.9 });
[-1, 1].forEach((s) => {
  mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.1, 16), tubeM, dabba, s * 0.13, 0.08, 0);
  mesh(new RoundedBoxGeometry(0.1, 0.045, 0.14, 3, 0.018), mat('#9C7146'), dabba, s * 0.13, 0.022, 0.02);
});
const dArms = [-1, 1].map((s) => {
  const p = new THREE.Group(); p.position.set(s * (BW / 2 + 0.008), BH * 0.45, 0); bodyG.add(p);
  const a = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.17, 12), tubeM); a.position.y = -0.085; a.castShadow = true; p.add(a);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), mat('#9C7146')); h.position.y = -0.17; p.add(h);
  return { p, s };
});

let faceKey = '';
function drawDabbaFace(state) {
  const k = JSON.stringify(state); if (k === faceKey) return; faceKey = k;
  const x = faceTex.userData.ctx, w = 400, h = 300;
  x.clearRect(0, 0, w, h);
  // marker lines "boil" a little (redrawn with a new wobble a few times a second), like hand-drawn animation
  let sd = 7 + state.wob * 131;
  const jr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647 - 0.5) * 3.2;
  const INK = '#221A16';
  const line = (pts, lw = 9, col = INK) => {
    x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
    pts.forEach(([px, py], i) => (i ? x.lineTo(px + jr(), py + jr()) : x.moveTo(px + jr(), py + jr()))); x.stroke();
  };
  const arc = (cx, cy, r, a0, a1, lw = 9, col = INK, ry = r) => { const p = []; for (let i = 0; i <= 14; i++) { const a = a0 + (a1 - a0) * i / 14; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]); } line(p, lw, col); };
  const { mood, open, blink, look = 0 } = state;
  const small = mood === 'small', happy = mood === 'happy' || mood === 'proud';
  const ey = small ? 128 : 118, rx = small ? 30 : 40, ry = small ? 34 : 47;
  [130, 270].forEach((cx, i) => {
    const s = i ? 1 : -1;
    // eyebrows
    if (small) line([[cx - 26, ey - 58 + (i ? -10 : 10)], [cx + 26, ey - 58 + (i ? 10 : -10)].map((v, j) => v)], 8);
    else if (happy) arc(cx, ey - 50, 26, Math.PI * 1.15, Math.PI * 1.85, 8);
    else line([[cx - 26, ey - 62], [cx + 26, ey - 64]], 8);
    if (blink > 0.6) { arc(cx, ey + 2, 30, Math.PI * 0.15, Math.PI * 0.85, 9); return; }
    if (happy) { arc(cx, ey + 18, 30, Math.PI * 1.12, Math.PI * 1.88, 11); return; }
    // white of the eye, marker outline, pupil, shine
    const rY = ry * (1 - blink * 0.8);
    x.fillStyle = '#FBF7EE'; x.beginPath(); x.ellipse(cx, ey, rx, rY, 0, 0, 7); x.fill();
    arc(cx, ey, rx, 0, Math.PI * 2, 8, INK, rY);
    const px = cx + look * 14 + (small ? -6 : 4), py = ey + (small ? 10 : 6);
    x.fillStyle = INK; x.beginPath(); x.arc(px, py, small ? 12 : 17, 0, 7); x.fill();
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(px + 6, py - 6, small ? 4 : 6, 0, 7); x.fill();
  });
  // blush scribbles when pleased
  if (happy) [70, 330].forEach((cx) => { for (let j = 0; j < 3; j++) line([[cx - 16 + j * 12, 196], [cx - 6 + j * 12, 176]], 6, '#E46A7A'); });
  // a sweat drop when he knows he did something
  if (small) { x.fillStyle = '#7CC3F2'; x.beginPath(); x.moveTo(330, 58); x.quadraticCurveTo(348, 92, 330, 100); x.quadraticCurveTo(312, 92, 330, 58); x.fill(); line([[330, 60], [345, 90]], 3, '#3E86B8'); }
  // mouth
  const my = 232;
  if (open > 0.08) {
    const mh = 10 + open * 40, mw = 36 + open * 8;
    x.fillStyle = '#6E2326'; x.beginPath(); x.ellipse(200, my, mw, mh / 2 + 4, 0, 0, Math.PI); x.lineTo(200 - mw, my); x.fill();
    x.fillStyle = '#E07B86'; x.beginPath(); x.ellipse(200, my + mh / 2 - 2, mw * 0.45, mh * 0.22, 0, 0, 7); x.fill();
    line([[200 - mw, my], [200 + mw, my]], 8); arc(200, my, mw, 0, Math.PI, 8, INK, mh / 2 + 4);
  } else if (happy) arc(200, my - 22, 34, Math.PI * 0.18, Math.PI * 0.82, 9);
  else if (small) line([[176, my], [188, my - 6], [200, my], [212, my - 6], [224, my]], 7);
  else arc(200, my - 30, 26, Math.PI * 0.3, Math.PI * 0.7, 8);
  faceTex.needsUpdate = true;
}

// ---------- THE AI COMMITTEE (episodes with "cast": "committee") ----------
const COMMITTEE = TL.cast === 'committee';
const LOYAL = TL.id === '01-loyal10';
const MEMBERS = ['codex', 'claude', 'gemini', 'twin'];
let com = null;
if (COMMITTEE) {
  dabba.visible = false;
  com = buildCommittee(scene);
  com.root.position.set(0.74, 1.04, 0.42); com.root.rotation.y = -0.5;
  com.root.updateMatrixWorld(true);
}
// a point in the committee's own space, in world space
const comPt = (x, y, z) => com.root.localToWorld(v3(x, y, z));

// ---------- laptop screen ----------
let scrKey = '';
function drawScreen(st) {
  const k = JSON.stringify(st); if (k === scrKey) return; scrKey = k;
  const x = screenTex.userData.ctx, w = 1024, h = 640;
  if (st.page === 'calendar') { drawCalendar(x, w, h, st); screenTex.needsUpdate = true; return; }
  if (st.page === 'text') { drawDoc(x, w, h, st); screenTex.needsUpdate = true; return; }
  x.fillStyle = '#F6F3EE'; x.fillRect(0, 0, w, h);
  // side bar
  x.fillStyle = '#2B2622'; x.fillRect(0, 0, 200, h);
  x.fillStyle = '#F1E4CF'; x.font = '44px "Bree Serif"'; x.fillText('mitti', 34, 70);
  x.font = '600 24px InterSB'; ['Home', 'Orders', 'Products', 'Discounts', 'Customers'].forEach((s, i) => { x.fillStyle = (st.page === 'orders' ? i === 1 : i === 3) ? '#FFB347' : '#BFB3A3'; x.fillText(s, 34, 150 + i * 52); });
  x.fillStyle = '#1F1A17';
  if (st.page === 'discount') {
    x.font = '700 40px InterB'; x.fillText('New discount code', 250, 90);
    x.font = '600 24px InterSB'; x.fillStyle = '#7A6E62'; x.fillText('Code', 250, 160);
    rr(x, 250, 175, 520, 72, 10); x.fillStyle = '#FFF'; x.fill(); x.strokeStyle = '#D8CFC3'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#1F1A17'; x.font = '800 40px InterXB'; x.fillText('LOYAL10'.slice(0, st.typed), 275, 226);
    x.fillStyle = '#7A6E62'; x.font = '600 24px InterSB'; x.fillText('Amount', 250, 300);
    x.fillStyle = '#1F1A17'; x.font = '700 34px InterB'; x.fillText('10% off', 250, 345);
    x.fillStyle = '#7A6E62'; x.font = '600 24px InterSB'; x.fillText('Who can use it', 250, 410);
    x.fillStyle = '#1F1A17'; x.font = '700 30px InterB'; x.fillText('Loyal customers (40)', 250, 452);
    if (st.live) { rr(x, 250, 500, 220, 64, 32); x.fillStyle = '#2FAE6A'; x.fill(); x.fillStyle = '#FFF'; x.font = '700 30px InterB'; x.fillText('● Active', 290, 543); }
    return void (screenTex.needsUpdate = true);
  }
  // orders dashboard
  x.font = '600 26px InterSB'; x.fillStyle = '#7A6E62'; x.fillText('Orders today', 250, 80);
  x.fillStyle = '#1F1A17'; x.font = '800 150px InterXB'; x.fillText(String(st.n), 245, 220);
  // spike chart
  x.strokeStyle = '#C4552D'; x.lineWidth = 7; x.beginPath();
  for (let i = 0; i <= 40; i++) { const u = i / 40, y = 330 - (u < 0.75 ? 6 + Math.sin(i) * 4 : Math.pow((u - 0.75) / 0.25, 2) * 110 * st.spike); x.lineTo(250 + u * 720, y); }
  x.stroke();
  x.font = '600 24px InterSB';
  for (let i = 0; i < 5; i++) {
    const y = 390 + i * 50; x.fillStyle = i % 2 ? '#F6F3EE' : '#EFE9E0'; x.fillRect(250, y - 32, 720, 48);
    x.fillStyle = '#1F1A17'; x.fillText(`#${st.n + 1040 - i}`, 270, y);
    x.fillStyle = '#C4552D'; x.font = '800 24px InterXB'; x.fillText(st.code, 470, y); x.font = '600 24px InterSB';
    x.fillStyle = '#B8322A'; x.fillText('– ₹80', 860, y);
  }
  if (st.toast) { rr(x, 560, 30, 430, 70, 14); x.fillStyle = '#1F1A17'; x.fill(); x.fillStyle = '#FFF'; x.font = '600 24px InterSB'; x.fillText(st.toast, 585, 74); }
  screenTex.needsUpdate = true;
}

// a plain document / email / chat answer on the laptop: a bold title and wrapped lines, in the column a vertical crop sees
function drawDoc(x, w, h, st) {
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
  const L = 330, R = 790;
  x.fillStyle = '#1F1A17'; x.font = '800 38px InterXB'; x.fillText(st.title || '', L, 82);
  x.fillStyle = '#ECE6DE'; x.fillRect(L, 104, R - L, 3);
  x.font = '600 27px InterSB'; let y = 160;
  for (const para of String(st.body || '').split(String.fromCharCode(10))) {
    let cur = '';
    for (const word of para.split(' ')) { const t = cur ? cur + ' ' + word : word; if (x.measureText(t).width > R - L && cur) { x.fillStyle = '#2A2420'; x.fillText(cur, L, y); y += 40; cur = word; } else cur = t; }
    x.fillStyle = '#2A2420'; x.fillText(cur, L, y); y += 52;
  }
  if (st.stamp) { x.save(); x.translate(R - 120, h - 120); x.rotate(-0.18); x.strokeStyle = '#D6453D'; x.lineWidth = 6; x.strokeRect(-130, -38, 260, 76); x.fillStyle = '#D6453D'; x.font = '800 40px InterXB'; x.textAlign = 'center'; x.fillText(st.stamp, 0, 14); x.restore(); }
}

// the week as an agenda list (fits a vertical crop); events vanish top-down as "cleared" goes 0 -> 1, the wedding last
const CAL = [['MON', '10:00', 'Standup', '#7FA8F8'], ['MON', '15:00', 'Client call', '#F59F6B'], ['TUE', '11:00', 'Dentist', '#7DD3C0'], ['WED', '18:00', 'Gym', '#B7A4F7'],
  ['THU', '14:00', 'Supplier call', '#F59F6B'], ['FRI', '20:00', 'Dinner with Rohan', '#F28BA0'], ['SAT', 'all day', "Didi's wedding", '#E8577E']];
function drawCalendar(x, w, h, st) {
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
  const L = 330, R = 790;
  x.fillStyle = '#1F1A17'; x.font = '800 40px InterXB'; x.fillText('This week', L, 78);
  x.fillStyle = '#8A8178'; x.font = '600 22px InterSB'; x.fillText('Oct 19 - 25', L + 220, 78);
  const shown = CAL.length - Math.floor((st.cleared || 0) * CAL.length + 1e-6);
  CAL.forEach(([d, tm, label, col], i) => {
    if (i < CAL.length - shown) return;
    const big = d === 'SAT', y = 108 + i * 66, hh = big ? 74 : 56;
    rr(x, L, y, R - L, hh, 12); x.fillStyle = big ? '#FDE3EA' : '#F5F2EE'; x.fill();
    rr(x, L, y, 12, hh, 6); x.fillStyle = col; x.fill();
    x.fillStyle = big ? '#E8577E' : '#8A8178'; x.font = '800 20px InterXB'; x.fillText(d, L + 28, y + (big ? 44 : 36));
    x.fillStyle = '#8A8178'; x.font = '600 20px InterSB'; x.fillText(tm, L + 92, y + (big ? 44 : 36));
    x.fillStyle = '#1F1A17'; x.font = (big ? '800 28px InterXB' : '700 24px InterB'); x.fillText(label, L + 190, y + (big ? 46 : 37));
  });
  if (shown === 0) { x.fillStyle = '#B5ADA4'; x.font = '600 30px InterSB'; x.textAlign = 'center'; x.fillText('No events', (L + R) / 2, 330); x.textAlign = 'left'; }
  if (st.ooo) { rr(x, L, 560, R - L, 54, 12); x.fillStyle = '#FFE36E'; x.fill(); x.fillStyle = '#1F1A17'; x.font = '700 24px InterB'; x.fillText('Out of office · until March', L + 70, 596); }
}

// ---------- HUD (subtitles, cards) ----------
const hud = document.getElementById('hud').getContext('2d');
function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
const TAGS = { codex: ['CODEX', '#6F84FF'], claude: ['CLAUDE', '#E0805F'], gemini: ['GEMINI', '#A77BF3'], twin: ['GEMINI (THE TWIN)', '#E06A9A'] };
function subtitle(text, a, who) {
  if (!text || a <= 0) return;
  hud.save(); hud.globalAlpha = a;
  if (COMMITTEE && TAGS[who]) {
    const [name, col] = TAGS[who];
    hud.font = '800 30px InterXB'; hud.textAlign = 'center'; hud.textBaseline = 'middle';
    const tw = hud.measureText(name).width + 40;
    rr(hud, W / 2 - tw / 2, 222, tw, 48, 24); hud.fillStyle = col; hud.fill();
    hud.fillStyle = '#FFFFFF'; hud.fillText(name, W / 2, 247);
  }
  hud.font = '600 50px InterSB'; hud.textAlign = 'center'; hud.textBaseline = 'middle';
  const lines = wrap(hud, text, 820), lh = 64;
  const bw = Math.max(...lines.map((l) => hud.measureText(l).width)) + 64, bh = lines.length * lh + 34;
  rr(hud, W / 2 - bw / 2, 300 - 17, bw, bh, 22); hud.fillStyle = 'rgba(16,14,18,0.55)'; hud.fill();
  hud.fillStyle = '#FFFFFF';
  lines.forEach((l, i) => hud.fillText(l, W / 2, 300 + lh / 2 + i * lh));
  hud.restore();
}

// ---------- shots ----------
const MEERA_HEAD = () => v3(-0.35, 2.08, -0.5);
const DABBA_FACE = v3(0.82, 1.4, 0.36);
function shotCam(b, t) {
  const u = prog(t, b.start, b.end), d = noise(t * 0.6, b.i) * 0.012;
  if (COMMITTEE) {
    const push = /-push$/.test(b.shot || ''), who = (b.shot || '').replace(/-push$/, '');
    const mi = { codex: 0, claude: 1, gemini: 2 }[who];
    if (mi !== undefined && push) { const x = com.XS[mi]; return { p: comPt(x * 0.8 + d, lerp(0.42, 0.38, eInOut(u)), lerp(1.12, 0.78, eInOut(u))), l: comPt(x, 0.31, -0.06), fov: 34, focus: comPt(x, 0.38, -0.02) }; }
    if (b.shot === 'committee') { const k = b.dist || 2.6; return { p: comPt(0 + d, b.camY ?? 0.52, lerp(k, k - 0.15, eInOut(u))), l: comPt(0, b.lookY ?? 0.29, 0), fov: 34, focus: comPt(0, 0.35, -0.05) }; }
    if (mi !== undefined) { const x = com.XS[mi]; return { p: comPt(x * 0.8 + d, 0.42, lerp(1.12, 1.05, u)), l: comPt(x, 0.3, -0.06), fov: 34, focus: comPt(x, 0.4, -0.02) }; }
    if (b.shot === 'wide') return { p: v3(lerp(0.55, 0.5, u) + d, 2.45, lerp(5.6, 5.2, eInOut(u))), l: v3(0.35, 1.7, 0), fov: 40, focus: null };
  }
  switch (b.shot) {
    case 'wide': return { p: v3(lerp(0.35, 0.3, u) + d, 2.45, lerp(5.6, 5.0, eInOut(u))), l: v3(0.2, 1.72, 0), fov: 40, focus: null };
    case 'wide-end': return { p: v3(0.25 + d, 2.35, lerp(5.3, 5.05, u)), l: v3(0.2, 1.62, 0), fov: 40, focus: null };
    case 'meera-hold': return { p: v3(0.6 + d * 0.3, 2.1, lerp(2.0, 1.85, eInOut(u))), l: v3(-0.31, 1.98, -0.5), fov: 34, focus: 'meera' };
    case 'meera': return { p: v3(0.62 + d, 2.12 + d, lerp(2.25, 2.1, u)), l: v3(-0.3, 1.98, -0.5), fov: 34, focus: 'meera' };
    case 'dabba': return { p: v3(-0.42 + d, 1.62, lerp(1.82, 1.74, u)), l: v3(0.8, 1.33, 0.34), fov: 36, focus: 'dabba' };
    case 'dabba-push': return { p: v3(lerp(-0.42, -0.05, eInOut(u)) + d, lerp(1.62, 1.5, u), lerp(1.82, 1.45, eInOut(u))), l: v3(0.8, 1.38, 0.34), fov: 36, focus: 'dabba' };
    case 'laptop': return LOYAL ? { p: v3(-0.35 + d, 1.8, lerp(-0.62, -0.42, eOut(u))), l: v3(-0.37, 1.31, 0.7), fov: 38, focus: 'laptop' } : { p: v3(-0.37 + d, 1.52, lerp(-0.36, -0.26, eOut(u))), l: v3(-0.37, 1.31, 0.7), fov: 36, focus: 'laptop' };
  }
  return { p: v3(0, 2.4, 5.4), l: v3(0, 1.7, 0), fov: 40, focus: null };
}

// ---------- the director ----------
const beatAt = (t) => BEATS.find((b) => t >= b.start && t < b.end) || BEATS[BEATS.length - 1];
// mouth opening for whoever is speaking at t
function talk(who, t) {
  for (const b of BEATS) if (b.who === who && b.vo !== null && t >= b.vo && t < b.vo + b.len) {
    const f = Math.floor((t - b.vo) * FPS); return clamp((b.env[f] || 0) * 1.35);
  }
  return 0;
}
const speaking = (who, t) => BEATS.some((b) => b.who === who && b.vo !== null && t >= b.vo - 0.1 && t < b.vo + b.len + 0.1);
function blinkAt(t, s) { const period = 3.1 + (s % 3) * 0.7, ph = ((t + s) % period) / period; return ph > 0.955 ? Math.sin(((ph - 0.955) / 0.045) * Math.PI) : 0; }

function renderAt(t) {
  const b = beatAt(t);
  const morning = b.time === 'morning';
  // lighting
  glassD.visible = morning;
  hemi.color.set(morning ? '#FFE9D2' : '#8FA3D6'); hemi.groundColor.set(morning ? '#6B4A3A' : '#2A1E1A'); hemi.intensity = morning ? 1.05 : 0.55;
  key.color.set(morning ? '#FFC08A' : '#FFB873'); key.intensity = morning ? 2.8 : 1.3;
  key.position.set(morning ? -3.5 : -1.6, morning ? 4.2 : 3.4, morning ? -1.2 : 1.6); key.target.position.set(0.2, 1.0, 0.2);
  lamp.position.set(-0.9, 1.8, 0.0); lamp.intensity = morning ? 0 : 2.6;
  bulb.material.color.set(morning ? '#9A8C78' : '#FFE2A8');
  screenGlow.position.set(-0.35, 1.45, 0.4); screenGlow.intensity = morning ? 0.6 : 1.6;
  shelfGlow.position.set(1.75, 2.6, -2.2); shelfGlow.intensity = morning ? 0 : 2.4;
  flames.forEach((f, i) => { f.visible = !morning; f.scale.y = 1 + Math.sin(t * 13 + i * 2.3) * 0.15; });
  bulbMat.color.set(morning ? '#B8A68A' : '#FFD08A');
  rim.intensity = morning ? 0.3 : 0.9;
  faceFill.position.set(0.6, 2.1, 1.4); faceFill.intensity = morning ? 0.4 : 0.7;
  scene.background = new THREE.Color(morning ? '#3C3430' : '#0E1220');
  const rain = b.weather === 'rain';
  glassR.visible = rain; streaks.visible = rain; streakTex.offset.set(t * 0.05, -t * 1.3);
  if (rain) {
    glassD.visible = false;
    hemi.color.set('#B4C2D2'); hemi.groundColor.set('#4A4440'); hemi.intensity = 0.85;
    key.color.set('#C9D6E6'); key.intensity = 1.5; key.position.set(-3.2, 3.8, -1.0);
    lamp.intensity = 1.8; bulb.material.color.set('#FFE2A8');
    flames.forEach((f) => (f.visible = false)); shelfGlow.intensity = 0; bulbMat.color.set('#C8B89A');
    rim.intensity = 0.5; scene.background = new THREE.Color('#2A2F36');
  }
  const wet = rain && BEATS.some((x) => x.wet && x.start <= t);
  drops.forEach((d) => { d.visible = wet; const u = ((t * 0.18 + d.userData.ph) % 1); d.position.y = d.userData.y - u * 0.22; d.scale.y = 1.25 + u * 0.5; });

  // ----- laptop screen -----
  const b0 = BEATS[0], b1 = BEATS[1];
  if (!LOYAL) {
    let sc = null; for (const x of BEATS) if (x.screen && x.start <= t) sc = { ...x.screen, _b: x };
    if (sc && sc.page === 'text') drawScreen({ page: 'text', title: sc.title || '', body: sc.body || '', stamp: sc.stamp || '' });
    else if (sc && sc.page === 'calendar') drawScreen({ page: 'calendar', cleared: sc.wipe ? Math.round(prog(t, sc._b.start + 0.25, sc._b.end - 0.35) * 18) / 18 : sc.cleared || 0, ooo: !!sc.ooo });
    else drawScreen({ page: 'orders', n: 42, spike: 0.2, code: 'WELCOME5', toast: null });
  }
  else if (!morning) drawScreen({ page: 'discount', typed: Math.round(clamp((t - b0.vo - 1.4) / 1.4) * 7), live: t > b1.vo + 0.4 });
  else {
    const lb = BEATS.find((x) => x.shot === 'laptop');
    const n = t < lb.end ? Math.round(lerp(37, 904, eInOut(prog(t, lb.start + 0.3, lb.end - 0.2)))) : 904 + Math.floor(Math.max(0, t - lb.end) * 0.9);
    const off = BEATS[11], l20 = BEATS[12];
    drawScreen({ page: 'orders', n, spike: eOut(prog(t, lb.start, lb.end)), code: t > l20.vo ? 'LOYAL20' : 'LOYAL10', toast: t > off.vo + 0.6 && t < l20.vo ? 'LOYAL10 turned off' : t >= l20.vo ? 'LOYAL20 · 212 uses' : 'LOYAL10 used 867 times' });
  }

  // ----- phone buzz when orders pile in -----
  const lb = BEATS.find((x) => x.shot === 'laptop');
  const buzzing = LOYAL && ((t > lb.start && t < BEATS[4].vo + 1) || (t > TL.DUR - 1.35 && t < TL.DUR - 0.9));
  phoneG.rotation.y = buzzing ? Math.sin(t * 90) * 0.04 : 0;
  phoneScr.material.color.set(buzzing ? '#DDEBFF' : '#0E1116');

  // ----- MEERA -----
  const mb = b.who === 'meera' ? b : null;
  let mood = mb ? mb.mood : (morning ? 'flat' : 'calm');
  if (COMMITTEE && !mb) { mood = b.mood && !b.who ? b.mood : 'calm'; for (const x of BEATS) if (x.who === 'meera' && x.start <= t) mood = x.mood || mood; if (b.mood && !b.who) mood = b.mood; }
  const end = BEATS[BEATS.length - 1];
  const slump = LOYAL ? eInOut(prog(t, end.vo + end.len + 0.3, end.vo + end.len + 1.4)) : 0; // head down on the desk
  const lookDabba = (b.who === 'dabba' || MEMBERS.includes(b.who) || (mb && t > mb.vo - 0.2)) ? 1 : 0.3;
  const shock = (LOYAL ? b.i === 4 : mb && mb.mood === 'shock') ? eOut(prog(t, b.vo - 0.1, b.vo + 0.3)) : 0;
  const breathe = Math.sin(t * 2.2) * 0.006;
  meera.visible = b.shot !== 'laptop';
  torsoG.rotation.x = 0.06 + slump * 0.62 - shock * 0.05 + (mood === 'tired' ? 0.05 : 0);
  torsoG.scale.set(1, 1 + breathe, 1);
  const tk = talk('meera', t);
  headG.rotation.y = lerp(0.05, 0.42, lookDabba) * (1 - slump) + noise(t * 0.8, 3) * 0.03;
  headG.rotation.x = (morning && b.i === 3 ? 0.3 : 0.02) + tk * 0.04 + noise(t, 5) * 0.02 - shock * 0.08 + slump * 0.45 + (mood === 'tired' ? 0.08 : 0);
  headG.rotation.z = noise(t * 0.7, 9) * 0.03 + (mood === 'tired' ? -0.07 : 0) + (mood === 'flat' ? 0.03 : 0);
  mouth.scale.set(1.15 - tk * 0.25, 0.18 + tk * 1.05, 0.45);
  const lidDown = mood === 'flat' ? 0.45 : mood === 'tired' ? 0.6 : 0;
  const bl = Math.max(blinkAt(t, 1.3), slump);
  eyes.forEach((e) => {
    const big = 1 + shock * 0.22;
    e.g.scale.set(big, big, 1);
    // lid: a skin cap that slides down over the eye
    const c = Math.max(lidDown * (1 - shock), bl);
    e.lid.position.y = lerp(0.12, 0.0, c); e.lid.scale.y = lerp(0.3, 1.25, c);
    e.lid.visible = c > 0.02;
  });
  brows.forEach((br, i) => {
    const s = i ? 1 : -1;
    const up = shock * 0.05 + (mood === 'calm' ? 0.01 : 0) - (mood === 'flat' ? 0.012 : 0);
    br.position.y = 0.15 + up; br.rotation.z = s * (mood === 'tired' ? -0.25 : mood === 'flat' ? 0.0 : 0.08) + s * shock * -0.12;
  });
  earrings.forEach((e, i) => { e.rotation.x = noise(t * 2, i * 4) * 0.25; });
  // arms: hands on the laptop (night), one hand near the mug (morning)
  meera.updateMatrixWorld(true);
  arms.forEach((a, i) => {
    const s = i ? 1 : -1;
    const sh = new THREE.Vector3(s * 0.33, 0.8, 0); torsoG.localToWorld(sh); meera.worldToLocal(sh);
    let hand = v3(s * 0.2, 1.1, 0.9);
    if (morning && s > 0) hand = v3(0.58, 1.12, 0.92);
    if (slump > 0) hand.lerp(v3(s * 0.32, 1.1, 0.75), slump);
    if (!morning && b.i === 0) hand.y += Math.max(0, Math.sin(t * 22 + i * 1.7)) * 0.02 * (t < b0.vo ? 1 : 0);
    const elbow = sh.clone().lerp(hand, 0.5).add(v3(s * 0.12, -0.18, -0.05));
    limb(a.up, sh, elbow); limb(a.lo, elbow, hand); a.hand.position.copy(hand);
    a.sh.position.copy(sh); a.el.position.copy(elbow);
    const dir = hand.clone().sub(elbow).normalize();
    a.cuff.position.copy(hand).addScaledVector(dir, -0.06); a.cuff.quaternion.setFromUnitVectors(v3(0, 0, 1), dir);
    a.hand.quaternion.setFromUnitVectors(UP, dir); a.hand.scale.set(1, 1.25, 0.8);
  });

  // ----- DABBA -----
  if (COMMITTEE) {
    const st = JSON.parse(JSON.stringify(b.pose || {}));
    const lastMood = (who, def) => { let m = def; for (const x of BEATS) if (x.who === who && x.start <= t) m = x.mood || m; return m; };
    for (const k of ['codex', 'claude']) { st[k] = st[k] || {}; st[k].talk = talk(k, t); st[k].blink = blinkAt(t, k.length); if (!st[k].mood) st[k].mood = lastMood(k, 'normal'); }
    st.gemini = st.gemini || {};
    st.gemini.talkL = talk('gemini', t); st.gemini.talkR = talk('twin', t); st.gemini.blink = blinkAt(t, 2.2);
    st.gemini.moodL = st.gemini.moodL || lastMood('gemini', 'normal'); st.gemini.moodR = st.gemini.moodR || lastMood('twin', 'smug');
    com.pose(st, t);
  } else {
  const db = b.who === 'dabba' ? b : null;
  const dk = talk('dabba', t);
  const dMood = db ? db.mood : (t > BEATS[12].vo ? 'small' : 'normal');
  const hop = db ? Math.max(0, Math.sin(prog(t, db.vo - 0.15, db.vo + 0.25) * Math.PI)) * 0.04 : 0;
  bodyG.position.y = 0.13 + hop + dk * 0.012;
  bodyG.rotation.z = noise(t * 1.4, 2) * 0.03 + (dMood === 'small' ? 0.05 : 0);
  bodyG.scale.set(1 + dk * 0.02, 1 - dk * 0.03 + Math.sin(t * 3) * 0.006, 1);
  flaps.forEach((f) => { f.p.rotation.z = f.s * (0.9 + dk * 0.35 + Math.sin(t * 3 + f.s) * 0.04 - (dMood === 'small' ? 0.55 : 0)); });
  flapsFB.forEach((f) => { f.p.rotation.x = f.s * (1.1 + dk * 0.25) * (f.s > 0 ? 1 : 1); });
  dArms.forEach((a) => {
    const wave = db && db.i === 1 ? Math.sin(prog(t, db.vo, db.vo + 1) * Math.PI) : 0;
    a.p.rotation.z = a.s * (0.25 + (a.s > 0 ? wave * 1.9 : 0) + dk * 0.15);
  });
  const lookAway = dMood === 'small' ? -0.6 : 0;
  drawDabbaFace({ mood: dMood, open: Math.round(dk * 5) / 5, blink: Math.round(blinkAt(t, 0.4) * 4) / 4, look: lookAway, wob: Math.floor(t * 8) % 3 });
  dabba.rotation.y = -0.72 + noise(t * 0.5, 7) * 0.04;
  }

  // ----- camera -----
  const c = shotCam(b, t);
  camera.position.copy(c.p); camera.lookAt(c.l); camera.fov = c.fov; camera.updateProjectionMatrix();
  const fp = c.focus instanceof THREE.Vector3 ? c.focus : c.focus === 'meera' ? MEERA_HEAD() : c.focus === 'dabba' ? DABBA_FACE : c.focus === 'laptop' ? v3(-0.35, 1.31, 0.7) : null;
  if (fp) { bokeh.enabled = true; bokeh.uniforms.focus.value = camera.position.distanceTo(fp); bokeh.uniforms.aperture.value = c.focus === 'laptop' ? 0.0025 : 0.03; bokeh.uniforms.maxblur.value = 0.018; }
  else { bokeh.enabled = true; bokeh.uniforms.focus.value = camera.position.distanceTo(v3(0.2, 1.7, -0.2)); bokeh.uniforms.aperture.value = 0.006; bokeh.uniforms.maxblur.value = 0.006; }
  film.uniforms.time.value = (t * 30) % 97;
  backLight.target.position.set(-0.35, 1.9, -0.5); backLight.intensity = morning ? 3 : 7;
  composer.render();

  // ----- HUD -----
  hud.clearRect(0, 0, W, H);
  if (b.card) {
    const a = Math.min(prog(t, b.start, b.start + 0.25), 1 - prog(t, b.end - 0.25, b.end));
    hud.fillStyle = '#000'; hud.fillRect(0, 0, W, H);
    hud.globalAlpha = Math.min(prog(t, b.start + 0.25, b.start + 0.6), 1 - prog(t, b.end - 0.45, b.end - 0.15));
    hud.fillStyle = '#F1E4CF'; hud.font = '600 54px InterSB'; hud.textAlign = 'center'; hud.textBaseline = 'middle';
    hud.fillText(b.card, W / 2, H / 2); hud.globalAlpha = 1;
    void a;
  } else if (b.text) {
    subtitle(b.text, prog(t, b.vo - 0.12, b.vo), b.who);
  }
  // fade in / out of the whole reel
  const fade = Math.max(1 - prog(t, 0, 0.25), prog(t, TL.DUR - 0.5, TL.DUR));
  if (fade > 0) { hud.fillStyle = `rgba(0,0,0,${fade})`; hud.fillRect(0, 0, W, H); }
}

window.renderAt = renderAt;
window.renderCover = () => {
  const b = TL.cover !== undefined ? BEATS[TL.cover] : BEATS[4];
  renderAt((b.vo ?? b.start) + 1.2);
};
renderAt(0.5);
window.ready = true;
