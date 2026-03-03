// HUD updates, announcer, popups, damage numbers, camera shake
const THREE = window.THREE;
import { camera } from './scene.js';
import { gs, MAX_SP, MAX_AS } from './gamestate.js';

export let shakeAmt = 0, shakeDur = 0;
export function cameraShake(a, d) { shakeAmt = a; shakeDur = d; }
export function getShake() { return { shakeAmt, shakeDur }; }
export function tickShake(dt) { if (shakeDur > 0) shakeDur -= dt; }

export function updateHUD() {
  document.getElementById('p1-hp-fill').style.transform = `scaleX(${gs.p1.hp / gs.p1.maxHp})`;
  document.getElementById('p2-hp-fill').style.transform = `scaleX(${gs.p2.hp / gs.p2.maxHp})`;
  const p1el = document.getElementById('p1-sp-fill'), p2el = document.getElementById('p2-sp-fill');
  p1el.style.width = (gs.p1.sp / MAX_SP * 100) + '%'; p2el.style.width = (gs.p2.sp / MAX_SP * 100) + '%';
  p1el.style.background = gs.p1.sp >= MAX_SP ? 'linear-gradient(90deg,orange,gold)' : 'linear-gradient(90deg,var(--p1d),var(--gold))';
  p2el.style.background = gs.p2.sp >= MAX_SP ? 'linear-gradient(90deg,orange,gold)' : 'linear-gradient(90deg,var(--p2d),var(--gold))';
  const p1as = document.getElementById('p1-as-fill'), p2as = document.getElementById('p2-as-fill');
  const t = performance.now();
  const flicker = Math.sin(t * 0.025) > 0;
  p1as.style.width = (gs.p1.as / MAX_AS * 100) + '%'; p2as.style.width = (gs.p2.as / MAX_AS * 100) + '%';
  p1as.style.background = gs.p1.asExhaust > 0 ? 'linear-gradient(90deg,#550,#ff0)' : 'linear-gradient(90deg,#aa6600,#ffaa00)';
  p2as.style.background = gs.p2.asExhaust > 0 ? 'linear-gradient(90deg,#550,#ff0)' : 'linear-gradient(90deg,#aa6600,#ffaa00)';
  p1as.style.opacity = gs.p1.asExhaust > 0 ? (flicker ? '1' : '0.25') : '1';
  p2as.style.opacity = gs.p2.asExhaust > 0 ? (flicker ? '1' : '0.25') : '1';
  const p1bs = document.getElementById('p1-bs-fill'), p2bs = document.getElementById('p2-bs-fill');
  p1bs.style.width = gs.p1.blockStamina + '%'; p2bs.style.width = gs.p2.blockStamina + '%';
  p1bs.style.background = gs.p1.blockCooldown > 0 ? 'linear-gradient(90deg,#660,#ff4)' : 'linear-gradient(90deg,#336,#88ccff)';
  p2bs.style.background = gs.p2.blockCooldown > 0 ? 'linear-gradient(90deg,#660,#ff4)' : 'linear-gradient(90deg,#336,#88ccff)';
  document.getElementById('timer').textContent = Math.ceil(gs.timer);
  document.getElementById('timer').className = gs.timer < 10 ? 'low' : '';
  updateComboEl('p1-combo', gs.p1); updateComboEl('p2-combo', gs.p2);
}

function updateComboEl(id, player) {
  const el = document.getElementById(id);
  if (!el) return;
  if (player.comboCount >= 3) {
    el.textContent = `${player.comboCount} HIT!`;
    el.style.color = player.charCssColor || '#fff';
    el.style.textShadow = `0 0 20px ${player.charCssColor || '#fff'}`;
    el.classList.add('active');
  } else {
    el.classList.remove('active');
  }
}

export function updateWinDots() {
  ['p1', 'p2'].forEach(p => { for (let i = 1; i <= 2; i++) { const d = document.getElementById(`${p}-w${i}`); d.className = 'win-dot' + (gs[p].wins >= i ? ' filled' : ''); } });
}

export function showAnnouncer(text, dur) { const el = document.getElementById('announcer'); el.textContent = text; el.style.opacity = '1'; gs.announceTimer = dur; }
export function showAnnouncer2(text, dur) { const el = document.getElementById('announcer2'); el.textContent = text; el.style.opacity = '1'; gs.announce2Timer = dur; }

export function showSpecialPopup(text, col) {
  const cssCol = '#' + col.toString(16).padStart(6, '0');
  const el = document.getElementById('special-popup'); el.textContent = text;
  el.style.color = cssCol; el.style.filter = `drop-shadow(0 0 10px ${cssCol})`;  el.style.opacity = '1';
  clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = '0'; }, 1200);
}

export function spawnDmgNum(player, dmg, col, isSpecial, isBlocked) {
  const el = document.createElement('div'); el.className = 'dmg-num ' + (isSpecial ? 'sp' : 'nm');
  el.textContent = isSpecial ? `✦ ${dmg} ✦` : `-${dmg}`;
  el.style.color = isBlocked ? '#88ccff' : '#' + col.toString(16).padStart(6, '0');
  const pos3 = new THREE.Vector3(player.x, 2.8, player.z); pos3.project(camera);
  el.style.left = ((pos3.x * 0.5 + 0.5) * innerWidth) + 'px'; el.style.top = ((-pos3.y * 0.5 + 0.5) * innerHeight - 20) + 'px';
  document.getElementById('ui').appendChild(el); setTimeout(() => el.remove(), 900);
}