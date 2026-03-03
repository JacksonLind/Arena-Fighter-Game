// Character animation and pose system
export const charRot = { p1: 0, p2: 0 };

export function lerpAngle(a, b, t) { let d = ((b - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI; return a + d * t; }
export function lerp(a, b, t) { return a + (b - a) * t; }

export const anim = {
  p1: { armRx: 0, armRz: 0, armRpz: 0, armRpy: 2.02, armLx: 0, armLz: 0, armLpz: 0, armLpy: 2.02, foreRx: -1.1, foreLx: -1.1, legRx: 0, legRpz: 0, legRpy: 1.5, legLx: 0, legLpz: 0, legLpy: 1.5, torsox: 0, torsoz: 0, torsoy: 1.95, headY: 2.48, rdArmRx: 0, rdArmRz: 0, rdArmLx: 0, rdArmLz: 0, rdForeRx: 0, rdForeLx: 0, rdLegRx: 0, rdLegLx: 0, rdTorsoZ: 0 },
  p2: { armRx: 0, armRz: 0, armRpz: 0, armRpy: 2.02, armLx: 0, armLz: 0, armLpz: 0, armLpy: 2.02, foreRx: -1.1, foreLx: -1.1, legRx: 0, legRpz: 0, legRpy: 1.5, legLx: 0, legLpz: 0, legLpy: 1.5, torsox: 0, torsoz: 0, torsoy: 1.95, headY: 2.48, rdArmRx: 0, rdArmRz: 0, rdArmLx: 0, rdArmLz: 0, rdForeRx: 0, rdForeLx: 0, rdLegRx: 0, rdLegLx: 0, rdTorsoZ: 0 },
};

export function animateChar(ch, st, opponent, rotKey, dt) {
  const t = performance.now() / 1000, a = anim[rotKey], B = Math.min(1, dt * 18);
  ch.root.position.set(st.x, st.y, st.z);
  charRot[rotKey] = lerpAngle(charRot[rotKey], Math.atan2(opponent.x - st.x, opponent.z - st.z), Math.min(1, dt * 14));
  ch.root.rotation.y = charRot[rotKey];
  const speed = Math.sqrt((st.vx || 0) ** 2 + (st.vz || 0) ** 2), moving = speed > 0.8, running = speed > 3.5;
  const wp = t * (running ? 9 : 6.5);
  let pose = 'idle';
  if (st.ragdoll > 0) pose = 'ragdoll';
  else if (st.hitStun > 0) pose = 'hitstun';
  else if (st.special > 0) pose = 'special';
  else if (st.blocking) pose = 'block';
  else if (st.blockCooldown > 0 && st.blockStamina < 5) pose = 'guardbreak';
  else if (st.kicking > 0) pose = 'kick';
  else if (st.punching > 0) pose = 'punch';
  else if (!st.onGround) pose = 'jump';
  else if (running) pose = 'run';
  else if (moving) pose = 'walk';
  if (pose !== 'ragdoll') ch.root.rotation.z = lerp(ch.root.rotation.z, 0, Math.min(1, dt * 6));
  let tARx = 0, tARz = 0, tARpz = 0.05, tARpy = 2.02, tALx = 0, tALz = 0, tALpz = 0.05, tALpy = 2.02;
  let tFRx = -1.1, tFLx = -1.1, tLRx = 0, tLRpz = 0, tLRpy = 1.5, tLLx = 0, tLLpz = 0, tLLpy = 1.5;
  let tTx = 0, tTz = 0, tTy = 1.95, tHy = 2.48, hBob = 0, tBob = 0;
  if (pose === 'ragdoll') {
    const B2 = Math.min(1, dt * 6), T = Math.sin(t * 14) * 0.5, T2 = Math.cos(t * 9 + 1.2) * 0.6;
    a.rdArmRx = lerp(a.rdArmRx, 0.8 + T, B2); a.rdArmRz = lerp(a.rdArmRz, 1.1 + T2 * 0.5, B2);
    a.rdArmLx = lerp(a.rdArmLx, 0.6 - T2, B2); a.rdArmLz = lerp(a.rdArmLz, -1.0 + T * 0.4, B2);
    a.rdForeRx = lerp(a.rdForeRx, -0.2 + T, B2); a.rdForeLx = lerp(a.rdForeLx, -0.3 - T2, B2);
    a.rdLegRx = lerp(a.rdLegRx, -0.7 + T * 0.6, B2); a.rdLegLx = lerp(a.rdLegLx, 0.5 + T2 * 0.5, B2);
    a.rdTorsoZ = lerp(a.rdTorsoZ, T * 0.35, B2);
    tARx = a.rdArmRx; tARz = a.rdArmRz; tALx = a.rdArmLx; tALz = a.rdArmLz;
    tFRx = a.rdForeRx; tFLx = a.rdForeLx; tLRx = a.rdLegRx; tLLx = a.rdLegLx;
    tTz = a.rdTorsoZ; tTx = 0.4; tTy = 1.88; tHy = 2.35;
  } else if (pose === 'idle') {
    const ip = t * 1.6; tARx = -0.45 + Math.sin(ip) * 0.06; tALx = -0.45 - Math.sin(ip) * 0.06;
    tARpz = 0.1; tALpz = 0.1; tARpy = 2.08; tALpy = 2.08; tFRx = -1.2; tFLx = -1.2;
    tTz = Math.sin(ip * 0.7) * 0.012; hBob = Math.sin(ip) * 0.015; tBob = hBob * 0.8;
  } else if (pose === 'walk') {
    tARx = -0.3 + Math.sin(wp) * 0.35; tALx = -0.3 - Math.sin(wp) * 0.35;
    tFRx = -0.8 + Math.sin(wp) * 0.2; tFLx = -0.8 - Math.sin(wp) * 0.2;
    tLRx = Math.sin(wp) * 0.42; tLLx = -Math.sin(wp) * 0.42;
    tTz = Math.sin(wp) * 0.03; tBob = Math.abs(Math.sin(wp)) * 0.025; hBob = tBob * 0.7;
  } else if (pose === 'run') {
    tARx = Math.sin(wp) * 0.7; tALx = -Math.sin(wp) * 0.7;
    tFRx = -1.4 + Math.sin(wp) * 0.3; tFLx = -1.4 - Math.sin(wp) * 0.3;
    tLRx = Math.sin(wp) * 0.65; tLLx = -Math.sin(wp) * 0.65;
    tTx = -0.22; tTz = Math.sin(wp) * 0.06; tBob = Math.abs(Math.sin(wp)) * 0.04; hBob = tBob * 0.6;
  } else if (pose === 'punch') {
    const e = Math.sin((1 - st.punching / 0.32) * Math.PI);
    tARx = -(Math.PI * 0.55) * e - 0.2; tARpz = e * 0.45; tARpy = 2.08; tFRx = -1.1 + e * 1.1;
    tALx = -0.5; tALpz = 0.15; tALpy = 2.15; tFLx = -1.3; tTz = e * 0.1; tTx = -e * 0.08; tLRx = 0.08; tLLx = -0.05;
  } else if (pose === 'kick') {
    const k = Math.sin((1 - st.kicking / 0.42) * Math.PI);
    tLRx = -(Math.PI * 0.65) * k; tLRpz = k * 0.35; tLRpy = 1.5 + k * 0.1; tLLx = 0.12;
    tARx = 0.5; tALx = -0.6; tALpz = 0.2; tFRx = -0.5; tFLx = -1.0; tTx = -k * 0.1; tTz = k * 0.12;
  } else if (pose === 'block') {
    tARx = -(Math.PI * 0.7); tARz = -0.3; tARpz = 0.28; tARpy = 2.2;
    tALx = -(Math.PI * 0.7); tALz = 0.3; tALpz = 0.28; tALpy = 2.2;
    tFRx = -1.5; tFLx = -1.5; tLRx = 0.15; tLLx = 0.15; tTx = 0.18; tTy = 1.88; tHy = 2.38;
  } else if (pose === 'guardbreak') {
    const sg = Math.sin(t * 18) * 0.25;
    tARx = 0.4 + sg; tARz = 0.5 + sg * 0.5; tARpy = 1.9; tALx = 0.4 - sg; tALz = -0.5 - sg * 0.5; tALpy = 1.9;
    tFRx = -0.3 + sg * 0.5; tFLx = -0.3 - sg * 0.5; tTx = 0.35; tTz = sg * 0.4; tTy = 1.88; tHy = 2.35;
  } else if (pose === 'jump') {
    const asc = st.vy > 0;
    tLRx = asc ? -0.55 : 0.2; tLLx = asc ? -0.45 : 0.15; tLRpz = asc ? 0.12 : 0; tLLpz = asc ? 0.1 : 0;
    tARx = asc ? -0.6 : -0.2; tALx = asc ? -0.6 : -0.2; tARpz = 0.1; tALpz = 0.1;
    tFRx = asc ? -1.4 : -0.6; tFLx = asc ? -1.4 : -0.6; tTx = asc ? -0.25 : 0.1; tHy = 2.5;
  } else if (pose === 'special') {
    const r = Math.sin((1 - st.special / 0.7) * Math.PI);
    tARx = -(Math.PI * 0.55) * r; tARz = -0.6 * r; tARpy = 2.0 + r * 0.3;
    tALx = -(Math.PI * 0.55) * r; tALz = 0.6 * r; tALpy = 2.0 + r * 0.3;
    tFRx = -0.3 * r; tFLx = -0.3 * r; tTx = -r * 0.2; tTz = Math.sin(t * 22) * 0.12 * r;
    tTy = 1.95 + r * 0.4; tHy = 2.48 + r * 0.4; tLRx = r * 0.2; tLLx = r * 0.2;
    if (st.special > 0.35) ch.root.position.y = st.y + Math.sin(((0.7 - st.special) / 0.35) * Math.PI) * 1.6;
  } else if (pose === 'hitstun') {
    const sh = Math.random() - 0.5;
    tARx = 0.5 + sh * 0.3; tARz = 0.4; tARpy = 1.95; tALx = 0.5 - sh * 0.3; tALz = -0.4; tALpy = 1.95;
    tFRx = -0.2 + sh * 0.4; tFLx = -0.2 - sh * 0.4; tTx = 0.3; tTz = sh * 0.18; tLRx = -0.1; tLLx = -0.05;
    ch.root.position.x += (Math.random() - 0.5) * 0.2; ch.root.position.z += (Math.random() - 0.5) * 0.06;
  }
  a.armRx = lerp(a.armRx, tARx, B); a.armRz = lerp(a.armRz, tARz, B); a.armRpz = lerp(a.armRpz, tARpz, B); a.armRpy = lerp(a.armRpy, tARpy, B);
  a.armLx = lerp(a.armLx, tALx, B); a.armLz = lerp(a.armLz, tALz, B); a.armLpz = lerp(a.armLpz, tALpz, B); a.armLpy = lerp(a.armLpy, tALpy, B);
  a.foreRx = lerp(a.foreRx, tFRx, B); a.foreLx = lerp(a.foreLx, tFLx, B);
  a.legRx = lerp(a.legRx, tLRx, B); a.legRpz = lerp(a.legRpz, tLRpz, B); a.legRpy = lerp(a.legRpy, tLRpy, B);
  a.legLx = lerp(a.legLx, tLLx, B); a.legLpz = lerp(a.legLpz, tLLpz, B); a.legLpy = lerp(a.legLpy, tLLpy, B);
  a.torsox = lerp(a.torsox, tTx, B); a.torsoz = lerp(a.torsoz, tTz, B); a.torsoy = lerp(a.torsoy, tTy + tBob, B);
  a.headY = lerp(a.headY, tHy + hBob, B);
  ch.armR.rotation.x = a.armRx; ch.armR.rotation.z = a.armRz; ch.armR.position.z = a.armRpz; ch.armR.position.y = a.armRpy;
  ch.armL.rotation.x = a.armLx; ch.armL.rotation.z = a.armLz; ch.armL.position.z = a.armLpz; ch.armL.position.y = a.armLpy;
  ch.forearmR.rotation.x = a.foreRx; ch.forearmL.rotation.x = a.foreLx;
  ch.legR.rotation.x = a.legRx; ch.legR.position.z = a.legRpz; ch.legR.position.y = a.legRpy;
  ch.legL.rotation.x = a.legLx; ch.legL.position.z = a.legLpz; ch.legL.position.y = a.legLpy;
  ch.torso.rotation.x = a.torsox; ch.torso.rotation.z = a.torsoz; ch.torso.position.y = a.torsoy;
  ch.headGroup.position.y = a.headY;
  if (st.blocking) ch.shieldMat.opacity = 0.45 + Math.sin(t * 8) * 0.1;
  else if (st.blockCooldown > 0 && st.blockStamina < 5) ch.shieldMat.opacity = Math.sin(t * 20) * 0.3;
  else ch.shieldMat.opacity = Math.max(0, ch.shieldMat.opacity - dt * 4);
}