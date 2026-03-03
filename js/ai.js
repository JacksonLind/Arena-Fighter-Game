// AI behavior and difficulty settings
import { gs, ai, keys, SPEED, MAX_SP, AS_PUNCH_COST, AS_KICK_COST, aiDifficulty } from './gamestate.js';
import { trySpendAS, tryAttack, doSpecial } from './combat.js';

export function aiThink(dt) {
  if (gs.p2.hitStun > 0 || gs.p2.frozen) { gs.p2.blocking = false; return; }
  const diff = {
    easy:   { reaction: 1.1,  aggression: 0.18, accuracy: 0.3,  blockChance: 0.08, dodgeChance: 0.06, specialChance: 0.07 },
    medium: { reaction: 0.65, aggression: 0.38, accuracy: 0.52, blockChance: 0.28, dodgeChance: 0.22, specialChance: 0.28 },
    hard:   { reaction: 0.35, aggression: 0.58, accuracy: 0.72, blockChance: 0.5,  dodgeChance: 0.42, specialChance: 0.52 },
  }[aiDifficulty];
  ai.actionTimer -= dt; ai.jumpCooldown -= dt; ai.retreatTimer -= dt;
  ai.dodgeTimer = (ai.dodgeTimer || 0) - dt; ai.blockTimer = (ai.blockTimer || 0) - dt;
  const dx = gs.p1.x - gs.p2.x, dz = gs.p1.z - gs.p2.z, dist = Math.sqrt(dx * dx + dz * dz);
  const inRange = dist < 2.8, closeRange = dist < 2.0, tooClose = dist < 1.4;
  const p1Attacking = gs.p1.punching > 0.1 || gs.p1.kicking > 0.1;
  if (p1Attacking && inRange && gs.p2.special <= 0) {
    if (Math.random() < diff.blockChance && ai.blockTimer <= 0 && gs.p2.blockStamina > 5 && gs.p2.blockCooldown <= 0) { gs.p2.blocking = true; ai.blockTimer = 0.5 + Math.random() * 0.3; ai.state = 'block'; return; }
    else if (Math.random() < diff.dodgeChance && ai.dodgeTimer <= 0) { ai.state = 'dodge'; ai.dodgeTimer = 0.35; ai.dodgeDir = Math.random() < 0.5 ? 1 : -1; }
  }
  if (!p1Attacking || !inRange) { if (ai.blockTimer <= 0) gs.p2.blocking = false; }
  if (ai.state === 'block' && ai.blockTimer <= 0) { gs.p2.blocking = false; ai.state = 'approach'; }
  if (ai.actionTimer <= 0) {
    ai.actionTimer = diff.reaction * (0.6 + Math.random() * 0.8);
    if (ai.state === 'dodge') { ai.state = Math.random() < 0.7 ? 'attack' : 'approach'; }
    else if (tooClose) { ai.state = 'retreat'; ai.retreatTimer = 0.3 + Math.random() * 0.3; }
    else if (gs.p2.hp < gs.p2.maxHp * 0.25 && dist < 5) { ai.state = Math.random() < 0.5 ? 'retreat' : 'attack'; ai.retreatTimer = 0.5; }
    else if (closeRange && Math.random() < diff.aggression) { ai.state = 'attack'; }
    else if (dist > 5) { ai.state = 'approach'; }
    else { const r = Math.random(); ai.state = r < diff.aggression * 0.6 ? 'attack' : r < 0.7 ? 'circle' : 'approach'; }
  }
  const aiSpd = SPEED * (gs.p2.spdMult || 1);
  if (ai.state === 'dodge' && ai.dodgeTimer > 0) { gs.p2.z += ai.dodgeDir * aiSpd * 1.4 * dt; gs.p2.x += (dx > 0 ? -1 : 1) * aiSpd * 0.6 * dt; }
  else if (ai.state === 'approach') { gs.p2.x += (dx > 0 ? 1 : -1) * aiSpd * (0.65 + Math.random() * 0.25) * dt; gs.p2.z += (gs.p1.z - gs.p2.z) * Math.min(1, dt * 3); }
  else if (ai.state === 'circle') { ai.circleDir = ai.circleDir || (Math.random() < 0.5 ? 1 : -1); gs.p2.z += ai.circleDir * aiSpd * 0.8 * dt; gs.p2.x += (dx > 0 ? 1 : -1) * (dist - 2.5) * dt * 2; }
  else if (ai.state === 'retreat' && ai.retreatTimer > 0) { gs.p2.x += (dx > 0 ? -1 : 1) * aiSpd * dt; gs.p2.z += Math.sin(performance.now() * 0.004) * aiSpd * 0.4 * dt; }
  else if (ai.state === 'attack' && !inRange) { gs.p2.x += (dx > 0 ? 1 : -1) * aiSpd * 0.85 * dt; gs.p2.z += (gs.p1.z - gs.p2.z) * Math.min(1, dt * 2); }
  // AI attacks
  if (inRange && !gs.p2.blocking && gs.p2.punching <= 0 && gs.p2.kicking <= 0 && gs.p2.special <= 0 && gs.p2.asExhaust <= 0) {
    if (Math.random() < diff.accuracy * dt * 5) {
      if (closeRange && Math.random() < 0.5) { if (trySpendAS(gs.p2, AS_PUNCH_COST)) { gs.p2.punching = 0.32; tryAttack(gs.p2, gs.p1, 10, 2.4, gs.p2.charCol); } }
      else { if (trySpendAS(gs.p2, AS_KICK_COST)) { gs.p2.kicking = 0.42; tryAttack(gs.p2, gs.p1, 16, 2.8, gs.p2.charCol, 18, true); } }
    }
  }
  if (gs.p2.sp >= MAX_SP && gs.p2.special <= 0 && !gs.p2.blocking && inRange) { if (Math.random() < diff.specialChance * dt * 1.5) { gs.p2.special = 0.7; gs.p2.sp = 0; doSpecial(gs.p2, gs.p1, gs.p2.charCol, gs.p2.charSpecial); } }
  if (gs.p2.onGround && ai.jumpCooldown <= 0 && !gs.p2.blocking) {
    const cp = Math.sqrt(gs.p2.x * gs.p2.x + gs.p2.z * gs.p2.z) > 7 ? 0.04 : 0;
    if (Math.random() < (0.008 + cp) * (aiDifficulty === 'hard' ? 2 : 1)) { gs.p2.vy = 10; gs.p2.onGround = false; ai.jumpCooldown = 2.0 + Math.random() * 2.5; }
  }
}