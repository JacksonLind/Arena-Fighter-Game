// Main game loop — entry point loaded as ES module
const THREE = window.THREE;

import { renderer, scene, camera, blueLight, redLight, underGlow, ring1, ring2, emblem, pillarObjs } from './scene.js';
import { gs, keys, vsAI, GRAVITY } from './gamestate.js';
import { p1Char, p2Char, shadow1, shadow2, particles, flyingHeads } from './characters.js';
import { p1Input, handleP1Actions, p2HumanInput, handleP2HumanActions } from './input.js';
import { aiThink } from './ai.js';
import { physicsStep } from './physics.js';
import { tickCountdown, endRound } from './rounds.js';
import { updateHUD, updateWinDots, getShake, tickShake } from './hud.js';
import { animateChar } from './animation.js';

// Import rounds.js to trigger its menu button listeners
import './rounds.js';

const camPos = new THREE.Vector3(0, 10, 20), camTarget = new THREE.Vector3(0, 1.5, 0);
let lastTime = performance.now();

document.addEventListener('keydown', e => {
  if (!gs.started || gs.gameOver) return;
  handleP1Actions(); if (!vsAI) handleP2HumanActions();
});

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastTime) / 1000, 0.05); lastTime = now;

  if (gs.started && !gs.gameOver) {
    tickCountdown(dt);
    if (!gs.p1.frozen) {
      gs.timerAccum += dt;
      if (gs.timerAccum >= 1) { gs.timerAccum -= 1; gs.timer = Math.max(0, gs.timer - 1); updateHUD(); if (gs.timer <= 0) endRound(gs.p1.hp >= gs.p2.hp ? 1 : 2); }
    }
    const p1px = gs.p1.x, p1pz = gs.p1.z, p2px = gs.p2.x, p2pz = gs.p2.z;
    p1Input(dt); if (vsAI) aiThink(dt); else p2HumanInput(dt);
    gs.p1.facing = gs.p2.x >= gs.p1.x ? 1 : -1; gs.p2.facing = gs.p1.x >= gs.p2.x ? 1 : -1;
    physicsStep(gs.p1, dt); physicsStep(gs.p2, dt); updateHUD();
    if (dt > 0) { gs.p1.vx = (gs.p1.x - p1px) / dt; gs.p1.vz = (gs.p1.z - p1pz) / dt; gs.p2.vx = (gs.p2.x - p2px) / dt; gs.p2.vz = (gs.p2.z - p2pz) / dt; }
    if (gs.announceTimer > 0) { gs.announceTimer -= dt; if (gs.announceTimer <= 0) document.getElementById('announcer').style.opacity = '0'; }
    if (gs.announce2Timer > 0) { gs.announce2Timer -= dt; if (gs.announce2Timer <= 0) document.getElementById('announcer2').style.opacity = '0'; }
  } else if (!gs.started) { if (gs.announceTimer > 0) { gs.announceTimer -= dt; if (gs.announceTimer <= 0) document.getElementById('announcer').style.opacity = '0'; } }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt / p.maxLife;
    if (p.isRing) { const s = 1 + (1 - p.life) * 6; p.mesh.scale.set(s, s, s); p.ringMat.opacity = Math.max(0, p.life * 0.8); }
    else { p.vel.y += GRAVITY * 0.6 * dt; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.material.opacity = Math.max(0, p.life); p.mesh.material.transparent = true; }
    if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
  }
  // Flying heads
  for (let i = flyingHeads.length - 1; i >= 0; i--) {
    const fh = flyingHeads[i]; fh.life -= dt; fh.vy += GRAVITY * dt;
    fh.mesh.position.x += fh.vx * dt; fh.mesh.position.y += fh.vy * dt; fh.mesh.position.z += fh.vz * dt;
    fh.mesh.rotation.x += fh.spinX * dt; fh.mesh.rotation.z += fh.spinZ * dt;
    if (fh.mesh.position.y < 0.3) { fh.mesh.position.y = 0.3; fh.vy = Math.abs(fh.vy) * 0.45; fh.vx *= 0.6; fh.vz *= 0.6; fh.spinX *= 0.5; fh.spinZ *= 0.5; }
    if (fh.life <= 0) { scene.remove(fh.mesh); flyingHeads.splice(i, 1); }
  }

  animateChar(p1Char, gs.p1, gs.p2, 'p1', dt); animateChar(p2Char, gs.p2, gs.p1, 'p2', dt);
  shadow1.position.set(gs.p1.x, 0.02, gs.p1.z); shadow2.position.set(gs.p2.x, 0.02, gs.p2.z);
  shadow1.material.opacity = 0.4 * (1 - gs.p1.y / 5); shadow2.material.opacity = 0.4 * (1 - gs.p2.y / 5);

  // Camera tracking
  const midX = (gs.p1.x + gs.p2.x) / 2 * 0.35, midZ = (gs.p1.z + gs.p2.z) / 2 * 0.2;
  const sep = Math.abs(gs.p1.x - gs.p2.x) + Math.abs(gs.p1.z - gs.p2.z);
  const tPos = new THREE.Vector3(midX, 10 + sep * 0.1, 17 + sep * 0.5);
  const shake = getShake();
  tickShake(dt);
  if (shake.shakeDur > 0) { tPos.x += (Math.random() - 0.5) * shake.shakeAmt; tPos.y += (Math.random() - 0.5) * shake.shakeAmt * 0.5; }
  camPos.lerp(tPos, 0.06); camera.position.copy(camPos); camTarget.lerp(new THREE.Vector3(midX, 1.5, midZ), 0.06); camera.lookAt(camTarget);

  // Scene ambiance
  const t = now / 1000;
  blueLight.intensity = 2.5 + Math.sin(t * 2.3) * 0.6; redLight.intensity = 2.5 + Math.sin(t * 2.7) * 0.6; underGlow.intensity = 0.8 + Math.sin(t * 4) * 0.3;
  ring1.material.opacity = 0.4 + Math.sin(t * 1.2) * 0.2; ring2.material.opacity = 0.15 + Math.sin(t * 0.9) * 0.08; emblem.material.opacity = 0.06 + Math.sin(t * 0.5) * 0.03;
  pillarObjs.forEach((po, i) => { po.band.rotation.z = t * (i % 2 === 0 ? 1 : -1) * 0.8; po.capLight.intensity = 1.2 + Math.sin(t * 3 + i) * 0.5; });
  renderer.render(scene, camera);
}

requestAnimationFrame(loop);
updateHUD(); updateWinDots();