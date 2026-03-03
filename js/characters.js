// Character builder, instances, shadows, particle systems, flying heads
const THREE = window.THREE;
import { scene, camera } from './scene.js';
import { gs, GRAVITY } from './gamestate.js';
import { cameraShake } from './hud.js';

export function buildChar(mainCol, accentCol) {
  const root = new THREE.Group();
  const mainMats = [], accentMats = [];
  const mat = (c, r = 0.5, m = 0.2) => {
    const material = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    if (c === mainCol) mainMats.push(material); else if (c === accentCol) accentMats.push(material);
    return material;
  };
  const accentBasic = (opts = {}) => { const material = new THREE.MeshBasicMaterial({ color: accentCol, ...opts }); accentMats.push(material); return material; };
  const skin = mat(0xf0c8a0, 0.9, 0), body = mat(mainCol, 0.4, 0.5), acc = mat(accentCol, 0.3, 0.7), dark = mat(0x111122, 0.8, 0.3);
  const torso = new THREE.Group();
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.7, 0.4), body); chest.castShadow = true; torso.add(chest);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.05), acc); plate.position.set(0, 0.02, 0.22); torso.add(plate);
  const gLine = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.04), accentBasic()); gLine.position.set(0, 0.1, 0.25); torso.add(gLine);
  const abs = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.35, 0.38), dark); abs.position.y = -0.52; abs.castShadow = true; torso.add(abs);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.42), acc); belt.position.y = -0.4; torso.add(belt);
  torso.position.y = 1.95; root.add(torso);
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.38), dark); hips.position.y = 1.55; hips.castShadow = true; root.add(hips);
  const headGroup = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.48), skin); head.castShadow = true; headGroup.add(head);
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.2, 0.52), body); helmet.position.y = 0.3; headGroup.add(helmet);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.08), accentBasic({ transparent: true, opacity: 0.9 }));
  visor.position.set(0, 0.06, 0.25); headGroup.add(visor);
  [-0.14, 0.14].forEach(ex => { const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.06), accentBasic()); eye.position.set(ex, 0.04, 0.25); headGroup.add(eye); });
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.46), mat(0xe0b890, 0.9)); jaw.position.y = -0.22; headGroup.add(jaw);
  headGroup.position.y = 2.48; root.add(headGroup);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.15, 8), skin); neck.position.y = 2.22; root.add(neck);
  function makeArm(side) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), acc));
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.5, 8), body); upper.position.y = -0.28; upper.castShadow = true; g.add(upper);
    const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), dark); elbowSphere.position.y = -0.55; g.add(elbowSphere);
    const forearm = new THREE.Group(); forearm.position.y = -0.55;
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.48, 8), mat(mainCol, 0.5, 0.4)); fore.position.y = -0.27; fore.castShadow = true; forearm.add(fore);
    const bracer = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), acc); bracer.position.y = -0.36; bracer.rotation.y = Math.PI / 4; forearm.add(bracer);
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), skin); fist.position.y = -0.63; fist.castShadow = true; forearm.add(fist);
    g.add(forearm); g.position.set(side * 0.58, 2.02, 0); g.forearm = forearm; return g;
  }
  const armL = makeArm(-1), armR = makeArm(1); root.add(armL, armR);
  function makeLeg(side) {
    const g = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.58, 8), mat(mainCol, 0.5)); thigh.position.y = -0.3; thigh.castShadow = true; g.add(thigh);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), acc); knee.position.y = -0.6; g.add(knee);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.55, 8), dark); shin.position.y = -0.9; shin.castShadow = true; g.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.34), body); boot.position.set(0, -1.27, 0.05); boot.castShadow = true; g.add(boot);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.38), dark); sole.position.set(0, -1.44, 0.06); g.add(sole);
    g.position.set(side * 0.24, 1.50, 0); return g;
  }
  const legL = makeLeg(-1), legR = makeLeg(1); root.add(legL, legR);
  const shieldMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0, side: THREE.DoubleSide });
  const shield = new THREE.Mesh(new THREE.CircleGeometry(0.7, 20), shieldMat);
  shield.position.set(0, 2.0, 0.55); root.add(shield);
  function setColors(newMain, newAccent) {
    mainMats.forEach(m => m.color.setHex(newMain));
    accentMats.forEach(m => m.color.setHex(newAccent));
  }
  return { root, torso, headGroup, armL, armR, forearmL: armL.forearm, forearmR: armR.forearm, legL, legR, shieldMat, setColors };
}

export const p1Char = buildChar(0x0099cc, 0x00e5ff); p1Char.root.position.set(-3.5, 0, 0); scene.add(p1Char.root);
export const p2Char = buildChar(0xcc0033, 0xff3d71); p2Char.root.position.set(3.5, 0, 0);  scene.add(p2Char.root);

function makeShadow() { const m = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.02; scene.add(m); return m; }
export const shadow1 = makeShadow(), shadow2 = makeShadow();

// Particles
export const particles = [], flyingHeads = [];

export function launchHead(ch, st) {
  const head = ch.headGroup; const worldPos = new THREE.Vector3(); head.getWorldPosition(worldPos);
  ch.root.remove(head); scene.add(head); head.position.copy(worldPos);
  flyingHeads.push({ mesh: head, vy: 12 + Math.random() * 5, vx: (Math.random() - 0.5) * 6, vz: (Math.random() - 0.5) * 3, spinX: (Math.random() - 0.5) * 18, spinZ: (Math.random() - 0.5) * 18, life: 3.5 });
  spawnSpecial(worldPos, st === gs.p1 ? 0x00e5ff : 0xff3d71); cameraShake(0.6, 0.35);
}

export function spawnHit(pos, col, n = 12) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + Math.random() * 0.08, 0), new THREE.MeshBasicMaterial({ color: col })); m.position.copy(pos); scene.add(m); const a = Math.random() * Math.PI * 2, spd = 4 + Math.random() * 8; particles.push({ mesh: m, vel: new THREE.Vector3(Math.cos(a) * spd, Math.random() * 6 + 2, Math.sin(a) * spd * 0.4), life: 1, maxLife: 0.6 + Math.random() * 0.4 }); }
}

export function spawnSpecial(pos, col) {
  for (let i = 0; i < 28; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.1, 4, 4), new THREE.MeshBasicMaterial({ color: col })); m.position.copy(pos); scene.add(m); const a = Math.random() * Math.PI * 2; particles.push({ mesh: m, vel: new THREE.Vector3(Math.cos(a) * (5 + Math.random() * 10), 2 + Math.random() * 12, (Math.random() - 0.5) * 4), life: 1, maxLife: 1 + Math.random() * 0.5 }); }
  const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 32), ringMat); ring.rotation.x = Math.PI / 2; ring.position.copy(pos); ring.position.y = 0.5; scene.add(ring);
  particles.push({ mesh: ring, vel: new THREE.Vector3(), life: 1, maxLife: 0.6, isRing: true, ringMat });
}

export function reattachHeads() {
  if (!p1Char.root.children.includes(p1Char.headGroup)) { p1Char.headGroup.position.set(0, 0, 0); p1Char.headGroup.rotation.set(0, 0, 0); p1Char.root.add(p1Char.headGroup); }
  if (!p2Char.root.children.includes(p2Char.headGroup)) { p2Char.headGroup.position.set(0, 0, 0); p2Char.headGroup.rotation.set(0, 0, 0); p2Char.root.add(p2Char.headGroup); }
}