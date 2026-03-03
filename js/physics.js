// Physics simulation step
import { ARENA_R, GRAVITY, MAX_AS, AS_REGEN_RATE } from './gamestate.js';

export function physicsStep(p, dt) {
  if (p.frozen) return;
  p.vy += GRAVITY * dt; p.x += p.kvx * dt; p.z += p.kvz * dt;
  const kfric = p.onGround ? 8 : 3; p.kvx *= Math.max(0, 1 - kfric * dt); p.kvz *= Math.max(0, 1 - kfric * dt);
  p.y = Math.max(0, p.y + p.vy * dt); if (p.y <= 0) { p.y = 0; p.vy = 0; p.onGround = true; }
  const r = Math.sqrt(p.x * p.x + p.z * p.z); if (r > ARENA_R - 0.5) { const a = Math.atan2(p.z, p.x); p.x = Math.cos(a) * (ARENA_R - 0.5); p.z = Math.sin(a) * (ARENA_R - 0.5); p.kvx = 0; p.kvz = 0; }
  if (p.punching > 0) p.punching -= dt; if (p.kicking > 0) p.kicking -= dt; if (p.special > 0) p.special -= dt;
  if (p.hitStun > 0) p.hitStun -= dt; if (p.ragdoll > 0) p.ragdoll -= dt; if (p.blockCooldown > 0) p.blockCooldown -= dt;
  // Attack stamina regen
  if (p.asExhaust > 0) { p.asExhaust -= dt; p.as = Math.min(MAX_AS, p.as + AS_REGEN_RATE * 0.3 * dt); }
  else { const attacking = p.punching > 0 || p.kicking > 0; p.as = Math.min(MAX_AS, p.as + (attacking ? AS_REGEN_RATE * 0.15 : AS_REGEN_RATE) * dt); }
  // Guard stamina
  if (p.blocking) { p.blockStamina = Math.max(0, p.blockStamina - 28 * dt); if (p.blockStamina <= 0) { p.blocking = false; p.blockCooldown = 2.5; p.hitStun = 0.4; } }
  else { p.blockStamina = Math.min(100, p.blockStamina + (p.blockCooldown > 0 ? 8 : 18) * dt); }
}