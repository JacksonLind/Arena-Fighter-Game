// Player input handling
import { gs, keys, SPEED, MAX_SP, AS_PUNCH_COST, AS_KICK_COST } from './gamestate.js';
import { trySpendAS, tryAttack, doSpecial } from './combat.js';

export function p1Input(dt) {
  if (gs.p1.hitStun > 0 || gs.p1.frozen) return;
  const spd = SPEED * (gs.p1.spdMult || 1);
  if (keys['KeyA']) gs.p1.x -= spd * dt;
  if (keys['KeyD']) gs.p1.x += spd * dt;
  if (keys['KeyW']) gs.p1.z -= spd * 0.6 * dt;
  if (keys['KeyS']) gs.p1.z += spd * 0.6 * dt;
  gs.p1.blocking = !!(keys['ShiftLeft'] && gs.p1.onGround && gs.p1.punching <= 0 && gs.p1.kicking <= 0 && gs.p1.special <= 0 && gs.p1.blockStamina > 0 && gs.p1.blockCooldown <= 0);
  if (keys['Space'] && gs.p1.onGround && !gs.p1.blocking) { gs.p1.vy = 10; gs.p1.onGround = false; }
}

export function handleP1Actions() {
  if (gs.p1.hitStun > 0 || gs.p1.frozen) return;
  if (keys['KeyF'] && gs.p1.punching <= 0) { if (!trySpendAS(gs.p1, AS_PUNCH_COST)) return; gs.p1.punching = 0.32; tryAttack(gs.p1, gs.p2, 10, 2.4, gs.p1.charCol); }
  if (keys['KeyG'] && gs.p1.kicking <= 0) { if (!trySpendAS(gs.p1, AS_KICK_COST)) return; gs.p1.kicking = 0.42; tryAttack(gs.p1, gs.p2, 16, 2.8, gs.p1.charCol, 18, true); }
  if (keys['KeyH'] && gs.p1.special <= 0 && gs.p1.sp >= MAX_SP) { gs.p1.special = 0.7; gs.p1.sp = 0; doSpecial(gs.p1, gs.p2, gs.p1.charCol, gs.p1.charSpecial); }
}

export function p2HumanInput(dt) {
  if (gs.p2.hitStun > 0 || gs.p2.frozen) return;
  const spd = SPEED * (gs.p2.spdMult || 1);
  if (keys['ArrowLeft'])  gs.p2.x -= spd * dt;
  if (keys['ArrowRight']) gs.p2.x += spd * dt;
  if (keys['ArrowUp'] && gs.p2.onGround) { gs.p2.vy = 10; gs.p2.onGround = false; }
  gs.p2.blocking = !!(keys['ArrowDown'] && gs.p2.onGround && gs.p2.punching <= 0 && gs.p2.kicking <= 0 && gs.p2.special <= 0 && gs.p2.blockStamina > 0 && gs.p2.blockCooldown <= 0);
}

export function handleP2HumanActions() {
  if (gs.p2.hitStun > 0 || gs.p2.frozen) return;
  if (keys['Semicolon'] && gs.p2.punching <= 0) { if (!trySpendAS(gs.p2, AS_PUNCH_COST)) return; gs.p2.punching = 0.32; tryAttack(gs.p2, gs.p1, 10, 2.4, gs.p2.charCol); }
  if (keys['Quote'] && gs.p2.kicking <= 0) { if (!trySpendAS(gs.p2, AS_KICK_COST)) return; gs.p2.kicking = 0.42; tryAttack(gs.p2, gs.p1, 16, 2.8, gs.p2.charCol, 18, true); }
  if (keys['BracketRight'] && gs.p2.special <= 0 && gs.p2.sp >= MAX_SP) { gs.p2.special = 0.7; gs.p2.sp = 0; doSpecial(gs.p2, gs.p1, gs.p2.charCol, gs.p2.charSpecial); }
}