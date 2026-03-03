// Attack, special, damage, stamina, blocking
const THREE = window.THREE;
import { camera } from './scene.js';
import { gs, MAX_SP, AS_EXHAUST_CD } from './gamestate.js';
import { spawnHit, spawnSpecial } from './characters.js';
import { updateHUD, showSpecialPopup, spawnDmgNum, cameraShake } from './hud.js';
import { endRound } from './rounds.js';

export function trySpendAS(player, cost) {
  if (player.asExhaust > 0) return false;
  if (player.as < cost) {
    player.as = 0; player.asExhaust = AS_EXHAUST_CD;
    showExhaustedPopup(player); return false;
  }
  player.as = Math.max(0, player.as - cost);
  updateHUD(); return true;
}

export function showExhaustedPopup(player) {
  const el = document.createElement('div'); el.className = 'exhausted-popup'; el.textContent = 'EXHAUSTED!';
  const pos3 = new THREE.Vector3(player.x, 3.2, player.z); pos3.project(camera);
  el.style.left = ((pos3.x * 0.5 + 0.5) * innerWidth - 50) + 'px';
  el.style.top = ((-pos3.y * 0.5 + 0.5) * innerHeight - 30) + 'px';
  document.getElementById('ui').appendChild(el);
  setTimeout(() => el.remove(), 900);
}

export function tryAttack(atk, def, dmg, range, col, knockback = 0) {
  const dx = def.x - atk.x, dz = def.z - atk.z, dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < range && ((atk.facing > 0 && dx > 0) || (atk.facing < 0 && dx < 0))) {
    applyDamage(def, dmg, col, false);
    atk.sp = Math.min(MAX_SP, atk.sp + 18);
    if (knockback > 0 && !def.blocking) { const len = dist > 0.01 ? dist : 1; def.kvx = (dx / len) * knockback; def.kvz = (dz / len) * knockback * 0.25; def.vy = 5.5; def.onGround = false; def.ragdoll = 0.55; cameraShake(0.45, 0.22); }
  }
}

export function doSpecial(atk, def, col, name) {
  const dx = def.x - atk.x, dz = def.z - atk.z, dist = Math.sqrt(dx * dx + dz * dz);
  spawnSpecial(new THREE.Vector3((atk.x + def.x) / 2, 1.5, (atk.z + def.z) / 2), col);
  showSpecialPopup(`⚡ ${name} ⚡`, col);
  if (dist < 4.5) { applyDamage(def, 30, col, true); atk.sp = Math.min(MAX_SP, atk.sp + 10); if (!def.blocking) { const len = dist > 0.01 ? dist : 1; def.kvx = (dx / len) * 22; def.kvz = (dz / len) * 22 * 0.3; def.vy = 9; def.onGround = false; def.ragdoll = 1.1; } }
  cameraShake(0.7, 0.4);
}

export function applyDamage(def, dmg, col, isSpecial) {
  const isBlocked = def.blocking && !isSpecial, isPartial = def.blocking && isSpecial;
  const actual = isBlocked ? Math.floor(dmg * 0.15) : isPartial ? Math.floor(dmg * 0.4) : dmg;
  def.hp = Math.max(0, def.hp - actual);
  if (!isBlocked) def.hitStun = isSpecial ? 0.5 : 0.22;
  def.sp = Math.min(MAX_SP, def.sp + (isBlocked ? 14 : 8));
  const flash = document.getElementById('hit-flash');
  if (isBlocked) { flash.style.background = '#88ccff'; flash.style.opacity = '0.18'; setTimeout(() => { flash.style.opacity = '0'; flash.style.background = '#fff'; }, 80); showBlockPopup(def); }
  else { flash.style.background = '#fff'; flash.style.opacity = isSpecial ? '0.3' : '0.12'; setTimeout(() => { flash.style.opacity = '0'; }, isSpecial ? 150 : 70); }
  spawnHit(new THREE.Vector3(def.x, 1.8, def.z), isBlocked ? 0x88ccff : col, isBlocked ? 5 : (isSpecial ? 20 : 10));
  spawnDmgNum(def, actual, col, isSpecial, isBlocked);
  updateHUD();
  if (def.hp <= 0) endRound(def === gs.p2 ? 1 : 2);
}

export function showBlockPopup(player) {
  const el = document.createElement('div'); el.className = 'dmg-num nm'; el.textContent = 'BLOCKED'; el.style.color = '#88ccff'; el.style.fontSize = '16px'; el.style.letterSpacing = '3px';
  const pos3 = new THREE.Vector3(player.x, 3.0, player.z); pos3.project(camera);
  el.style.left = ((pos3.x * 0.5 + 0.5) * innerWidth) + 'px'; el.style.top = ((-pos3.y * 0.5 + 0.5) * innerHeight - 20) + 'px';
  document.getElementById('ui').appendChild(el); setTimeout(() => el.remove(), 900);
}