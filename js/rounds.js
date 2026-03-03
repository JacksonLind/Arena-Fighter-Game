// Round management, countdown, victory, menu flow
import { gs, makePlayer, roundTransition, vsAI, aiDifficulty, setVsAI, setAiDifficulty } from './gamestate.js';
import { p1Char, p2Char, flyingHeads, reattachHeads } from './characters.js';
import { scene } from './scene.js';
import { updateHUD, updateWinDots, showAnnouncer } from './hud.js';
import { launchHead } from './characters.js';

export function beginCountdown(firstRound = false) {
  gs.p1.frozen = true; gs.p2.frozen = true;
  gs.p1.punching = 0; gs.p1.kicking = 0; gs.p1.special = 0; gs.p1.blocking = false;
  gs.p2.punching = 0; gs.p2.kicking = 0; gs.p2.special = 0; gs.p2.blocking = false;
  roundTransition.active = true;
  roundTransition.step = firstRound ? -1 : 3;
  roundTransition.timer = firstRound ? 0.4 : 0.8;
  document.getElementById('announcer').style.opacity = '0';
  document.getElementById('announcer2').style.opacity = '0';
  const ov = document.getElementById('countdown-overlay');
  ov.classList.remove('show'); ov.textContent = '';
}

export function tickCountdown(dt) {
  if (!roundTransition.active) return;
  roundTransition.timer -= dt;
  if (roundTransition.timer > 0) return;
  const ov = document.getElementById('countdown-overlay');
  const step = roundTransition.step;
  if (step === -1) {
    ov.textContent = 'FIGHT!'; ov.style.fontSize = '90px'; ov.style.color = '#ffd600'; ov.classList.add('show');
    roundTransition.step = 'done'; roundTransition.timer = 0.85;
  } else if (step === 3) {
    ov.textContent = '3'; ov.style.fontSize = '120px'; ov.style.color = '#ffffff'; ov.classList.add('show');
    roundTransition.step = 2; roundTransition.timer = 1.0;
  } else if (step === 2) {
    ov.textContent = '2'; ov.classList.add('show');
    roundTransition.step = 1; roundTransition.timer = 1.0;
  } else if (step === 1) {
    ov.textContent = '1'; ov.classList.add('show');
    roundTransition.step = 0; roundTransition.timer = 1.0;
  } else if (step === 0) {
    ov.textContent = 'FIGHT!'; ov.style.fontSize = '90px'; ov.style.color = '#ffd600'; ov.classList.add('show');
    roundTransition.step = 'done'; roundTransition.timer = 0.85;
  } else if (step === 'done') {
    ov.classList.remove('show'); ov.textContent = '';
    roundTransition.active = false;
    gs.p1.frozen = false; gs.p2.frozen = false;
  }
}

export function endRound(winner) {
  if (gs.gameOver) return;
  gs.gameOver = true;
  if (winner === 1) gs.p1.wins++; else gs.p2.wins++;
  updateWinDots();
  const wname = winner === 1 ? 'AZURE' : (vsAI ? 'CPU' : 'CRIMSON'), wcol = winner === 1 ? '#00e5ff' : '#ff3d71';
  const ann = document.getElementById('announcer'); ann.style.color = wcol; ann.style.filter = `drop-shadow(0 0 30px ${wcol})`;
  setTimeout(() => launchHead(winner === 1 ? p2Char : p1Char, winner === 1 ? gs.p2 : gs.p1), 120);
  const matchWins = winner === 1 ? gs.p1.wins : gs.p2.wins;
  showAnnouncer(`${wname} WINS!`, 999);
  if (matchWins >= 2) { setTimeout(() => showVictoryScreen(wname, wcol), 1800); }
  else { setTimeout(() => resetRound(), 2500); }
}

function showVictoryScreen(name, col) {
  const vs = document.getElementById('victory-screen'), vn = document.getElementById('victory-name');
  vn.textContent = name; vn.style.color = col; vn.style.textShadow = `0 0 60px ${col},0 0 120px ${col}`;
  vs.style.display = 'flex'; document.addEventListener('keydown', onVictoryKey);
}
function onVictoryKey(e) { if (e.code !== 'KeyR') return; document.removeEventListener('keydown', onVictoryKey); returnToMenu(); }

function returnToMenu() {
  document.getElementById('victory-screen').style.display = 'none';
  for (const fh of flyingHeads) scene.remove(fh.mesh); flyingHeads.length = 0;
  reattachHeads();
  resetPlayerState(gs.p1, -3.5, 1, true); resetPlayerState(gs.p2, 3.5, -1, true);
  gs.timer = 60; gs.timerAccum = 0; gs.gameOver = false; gs.started = false; gs.round = 1;
  document.getElementById('round-info').textContent = 'Round 1';
  document.getElementById('announcer').style.opacity = '0'; document.getElementById('announcer2').style.opacity = '0';
  document.getElementById('p2-label').textContent = 'CRIMSON · P2'; document.getElementById('p2-ctrl-name').textContent = 'Player 2';
  updateWinDots(); updateHUD(); document.getElementById('mode-screen').style.display = 'flex';
}

export function resetPlayerState(p, x, facing, keepWins) {
  const wins = p.wins;
  Object.assign(p, makePlayer(x, facing));
  if (keepWins) p.wins = wins;
}

export function resetRound() {
  for (const fh of flyingHeads) scene.remove(fh.mesh); flyingHeads.length = 0;
  reattachHeads();
  resetPlayerState(gs.p1, -3.5, 1, true); resetPlayerState(gs.p2, 3.5, -1, true);
  gs.timer = 60; gs.timerAccum = 0; gs.gameOver = false; gs.round++;
  document.getElementById('round-info').textContent = `Round ${gs.round}`;
  document.getElementById('announcer').style.color = '#fff'; document.getElementById('announcer').style.filter = 'drop-shadow(0 0 30px rgba(255,220,0,.9))';
  document.getElementById('announcer').style.opacity = '0'; document.getElementById('announcer2').style.opacity = '0';
  updateHUD();
  beginCountdown(false);
}

export function startGame() {
  document.getElementById('mode-screen').style.display = 'none';
  if (vsAI) { document.getElementById('p2-label').textContent = 'CRIMSON · CPU'; document.getElementById('p2-ctrl-name').textContent = 'CPU'; document.getElementById('p2-ctrl-row').innerHTML = `<span style="color:var(--p2)">AI-CONTROLLED</span><br><span style="color:rgba(255,255,255,.3)">Diff: ${aiDifficulty.toUpperCase()}</span>`; }
  gs.started = true;
  beginCountdown(true);
}

// Menu button listeners
document.getElementById('btn-ai').addEventListener('click', () => { setVsAI(true); startGame(); });
document.getElementById('btn-human').addEventListener('click', () => { setVsAI(false); startGame(); });
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => { document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); setAiDifficulty(btn.dataset.diff); });
});