// Round management, countdown, victory, menu flow
import { gs, makePlayer, roundTransition, vsAI, aiDifficulty, setVsAI, setAiDifficulty, ROSTER, p1SelectedChar, p2SelectedChar, setP1Char, setP2Char, CAMPAIGN_ENEMIES, campaignState } from './gamestate.js';
import { p1Char, p2Char, flyingHeads, reattachHeads } from './characters.js';
import { scene } from './scene.js';
import { updateHUD, updateWinDots, showAnnouncer } from './hud.js';
import { launchHead } from './characters.js';

const ROSTER_MAX_HP_MULT  = Math.max(...ROSTER.map(c => c.hpMult));
const ROSTER_MAX_SPD_MULT = Math.max(...ROSTER.map(c => c.spdMult));
const ROSTER_MAX_DMG_MULT = Math.max(...ROSTER.map(c => c.dmgMult));

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
  const wname = winner === 1 ? gs.p1.charName : (campaignState.active ? gs.p2.charName : (vsAI ? 'CPU' : gs.p2.charName)), wcol = winner === 1 ? gs.p1.charCssColor : gs.p2.charCssColor;
  const ann = document.getElementById('announcer'); ann.style.color = wcol; ann.style.filter = `drop-shadow(0 0 30px ${wcol})`;
  setTimeout(() => launchHead(winner === 1 ? p2Char : p1Char, winner === 1 ? gs.p2 : gs.p1), 120);
  const matchWins = winner === 1 ? gs.p1.wins : gs.p2.wins;
  showAnnouncer(`${wname} WINS!`, 999);
  if (matchWins >= 2) {
    if (campaignState.active) {
      if (winner === 1) { setTimeout(() => advanceCampaignStage(), 2000); }
      else { setTimeout(() => showCampaignGameOver(), 1800); }
    } else {
      setTimeout(() => showVictoryScreen(wname, wcol), 1800);
    }
  } else { setTimeout(() => resetRound(), 2500); }
}

function showVictoryScreen(name, col) {
  const vs = document.getElementById('victory-screen'), vn = document.getElementById('victory-name');
  vn.textContent = name; vn.style.color = col; vn.style.textShadow = `0 0 60px ${col},0 0 120px ${col}`;
  vs.style.display = 'flex'; document.addEventListener('keydown', onVictoryKey);
}
function onVictoryKey(e) { if (e.code !== 'KeyR') return; document.removeEventListener('keydown', onVictoryKey); returnToMenu(); }

function returnToMenu() {
  document.getElementById('victory-screen').style.display = 'none';
  document.getElementById('campaign-gameover').style.display = 'none';
  document.getElementById('campaign-stage-intro').style.display = 'none';
  document.getElementById('victory-title').textContent = 'Champion';
  document.getElementById('victory-sub').textContent = '⚡ Victorious ⚡';
  campaignState.active = false; campaignState.stage = 0; campaignState.currentEnemy = null;
  for (const fh of flyingHeads) scene.remove(fh.mesh); flyingHeads.length = 0;
  reattachHeads();
  resetPlayerState(gs.p1, -3.5, 1, true); resetPlayerState(gs.p2, 3.5, -1, true);
  gs.timer = 60; gs.timerAccum = 0; gs.gameOver = false; gs.started = false; gs.round = 1;
  document.getElementById('round-info').textContent = 'Round 1';
  document.getElementById('announcer').style.opacity = '0'; document.getElementById('announcer2').style.opacity = '0';
  document.getElementById('p1-label').textContent = 'P1 · AZURE'; document.getElementById('p2-label').textContent = 'CRIMSON · P2'; document.getElementById('p2-ctrl-name').textContent = 'Player 2';
  updateWinDots(); updateHUD(); document.getElementById('mode-screen').style.display = 'flex';
}

export function resetPlayerState(p, x, facing, keepWins) {
  const wins = p.wins;
  const charIdx = p.charIdx !== undefined && p.charIdx >= 0 ? p.charIdx : 0;
  Object.assign(p, makePlayer(x, facing, ROSTER[charIdx]));
  if (keepWins) p.wins = wins;
}

export function resetRound() {
  for (const fh of flyingHeads) scene.remove(fh.mesh); flyingHeads.length = 0;
  reattachHeads();
  resetPlayerState(gs.p1, -3.5, 1, true);
  if (campaignState.active && campaignState.currentEnemy) {
    const wins = gs.p2.wins;
    Object.assign(gs.p2, makePlayer(3.5, -1, campaignState.currentEnemy));
    gs.p2.wins = wins;
  } else {
    resetPlayerState(gs.p2, 3.5, -1, true);
  }
  gs.timer = 60; gs.timerAccum = 0; gs.gameOver = false; gs.round++;
  document.getElementById('round-info').textContent = `Round ${gs.round}`;
  document.getElementById('announcer').style.color = '#fff'; document.getElementById('announcer').style.filter = 'drop-shadow(0 0 30px rgba(255,220,0,.9))';
  document.getElementById('announcer').style.opacity = '0'; document.getElementById('announcer2').style.opacity = '0';
  updateHUD();
  beginCountdown(false);
}

function buildCharCards(containerId, playerKey) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const currentIdx = playerKey === 'p1' ? p1SelectedChar : p2SelectedChar;
  ROSTER.forEach((char, i) => {
    const card = document.createElement('div');
    card.className = 'char-card' + (i === currentIdx ? ' selected' : '');
    card.style.setProperty('--char-color', char.cssColor);
    const hpPct = Math.round(char.hpMult / ROSTER_MAX_HP_MULT * 100);
    const spdPct = Math.round(char.spdMult / ROSTER_MAX_SPD_MULT * 100);
    const pwrPct = Math.round(char.dmgMult / ROSTER_MAX_DMG_MULT * 100);
    card.innerHTML = `<div class="char-card-name">${char.name}</div><div class="char-card-role">${char.role}</div><div class="char-stat-bars"><div class="char-stat"><span class="char-stat-label">HP</span><div class="char-stat-track"><div class="char-stat-fill" style="width:${hpPct}%;background:${char.cssColor}"></div></div></div><div class="char-stat"><span class="char-stat-label">SPD</span><div class="char-stat-track"><div class="char-stat-fill" style="width:${spdPct}%;background:${char.cssColor}"></div></div></div><div class="char-stat"><span class="char-stat-label">PWR</span><div class="char-stat-track"><div class="char-stat-fill" style="width:${pwrPct}%;background:${char.cssColor}"></div></div></div></div>`;
    card.addEventListener('click', () => {
      if (playerKey === 'p1') setP1Char(i); else setP2Char(i);
      container.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
    container.appendChild(card);
  });
}

function showCharSelect(mode) {
  document.getElementById('mode-screen').style.display = 'none';
  const screen = document.getElementById('char-select-screen');
  screen.style.display = 'flex';
  screen.dataset.mode = mode;
  buildCharCards('p1-cards', 'p1');
  if (mode === 'ai' || mode === 'campaign') {
    document.getElementById('p2-panel').style.display = 'none';
    setP2Char(Math.floor(Math.random() * ROSTER.length));
  } else {
    document.getElementById('p2-panel').style.display = 'flex';
    buildCharCards('p2-cards', 'p2');
  }
}

export function startGame() {
  document.getElementById('char-select-screen').style.display = 'none';
  const p1char = ROSTER[p1SelectedChar], p2char = ROSTER[p2SelectedChar];
  Object.assign(gs.p1, makePlayer(-3.5, 1, p1char)); Object.assign(gs.p2, makePlayer(3.5, -1, p2char));
  p1Char.setColors(p1char.mainCol, p1char.accentCol); p2Char.setColors(p2char.mainCol, p2char.accentCol);
  document.getElementById('p1-label').textContent = `P1 · ${p1char.name}`;
  if (vsAI) {
    document.getElementById('p2-label').textContent = `${p2char.name} · CPU`;
    document.getElementById('p2-ctrl-name').textContent = 'CPU';
    document.getElementById('p2-ctrl-row').innerHTML = `<span style="color:${p2char.cssColor}">${p2char.name}</span> · <span style="color:rgba(255,255,255,.3)">${p2char.role}</span><br><span style="color:rgba(255,255,255,.3)">AI · ${aiDifficulty.toUpperCase()}</span>`;
  } else {
    document.getElementById('p2-label').textContent = `${p2char.name} · P2`;
  }
  gs.started = true;
  beginCountdown(true);
}

// Campaign mode functions
function showCampaignStageIntro(stageIdx, callback) {
  const enemy = CAMPAIGN_ENEMIES[stageIdx];
  document.getElementById('csi-stage').textContent = `STAGE ${stageIdx + 1} / ${CAMPAIGN_ENEMIES.length}`;
  document.getElementById('csi-title').textContent = enemy.title;
  const nameEl = document.getElementById('csi-enemy');
  nameEl.textContent = enemy.name; nameEl.style.color = enemy.cssColor; nameEl.style.textShadow = `0 0 40px ${enemy.cssColor}, 0 0 80px ${enemy.cssColor}`;
  const progress = document.getElementById('csi-progress');
  progress.innerHTML = CAMPAIGN_ENEMIES.map((e, i) =>
    `<div class="csi-dot${i < stageIdx ? ' done' : i === stageIdx ? ' current' : ''}" ${i === stageIdx ? `style="border-color:${e.cssColor};background:${e.cssColor}"` : ''}></div>`
  ).join('');
  document.getElementById('campaign-stage-intro').style.display = 'flex';
  setTimeout(() => { document.getElementById('campaign-stage-intro').style.display = 'none'; callback(); }, 2500);
}

function loadCampaignStage(stageIdx) {
  const enemy = CAMPAIGN_ENEMIES[stageIdx];
  campaignState.stage = stageIdx; campaignState.currentEnemy = enemy;
  for (const fh of flyingHeads) scene.remove(fh.mesh); flyingHeads.length = 0;
  reattachHeads();
  setAiDifficulty(enemy.aiDiff);
  const p1char = ROSTER[p1SelectedChar];
  Object.assign(gs.p1, makePlayer(-3.5, 1, p1char));
  Object.assign(gs.p2, makePlayer(3.5, -1, enemy));
  gs.p1.wins = 0; gs.p2.wins = 0;
  p1Char.setColors(p1char.mainCol, p1char.accentCol); p2Char.setColors(enemy.mainCol, enemy.accentCol);
  document.getElementById('p1-label').textContent = `P1 · ${p1char.name}`;
  document.getElementById('p2-label').textContent = `${enemy.name} · CPU`;
  document.getElementById('p2-ctrl-name').textContent = 'CPU';
  document.getElementById('p2-ctrl-row').innerHTML = `<span style="color:${enemy.cssColor}">${enemy.name}</span><br><span style="color:rgba(255,255,255,.3)">AI · ${enemy.aiDiff.toUpperCase()}</span>`;
  gs.round = 1; document.getElementById('round-info').textContent = 'Round 1';
  document.getElementById('announcer').style.opacity = '0'; document.getElementById('announcer2').style.opacity = '0';
  gs.timer = 60; gs.timerAccum = 0; gs.gameOver = false; gs.started = false;
  updateWinDots(); updateHUD();
  showCampaignStageIntro(stageIdx, () => { gs.started = true; beginCountdown(true); });
}

function advanceCampaignStage() {
  const next = campaignState.stage + 1;
  if (next >= CAMPAIGN_ENEMIES.length) { showCampaignComplete(); } else { loadCampaignStage(next); }
}

function showCampaignComplete() {
  document.getElementById('victory-title').textContent = 'Campaign Champion';
  const col = gs.p1.charCssColor;
  const vn = document.getElementById('victory-name');
  vn.textContent = gs.p1.charName; vn.style.color = col; vn.style.textShadow = `0 0 60px ${col},0 0 120px ${col}`;
  document.getElementById('victory-sub').textContent = '⚡ Arena Conquered ⚡';
  document.getElementById('victory-screen').style.display = 'flex';
  document.addEventListener('keydown', onCampaignCompleteKey);
}
function onCampaignCompleteKey(e) {
  if (e.code !== 'KeyR') return;
  document.removeEventListener('keydown', onCampaignCompleteKey);
  returnToMenu();
}

function showCampaignGameOver() {
  const enemy = CAMPAIGN_ENEMIES[campaignState.stage];
  const stageEl = document.getElementById('cgo-stage');
  stageEl.textContent = `Defeated at Stage ${campaignState.stage + 1} · ${enemy.name}`;
  stageEl.style.color = enemy.cssColor;
  document.getElementById('campaign-gameover').style.display = 'flex';
}

function startCampaign() {
  document.getElementById('char-select-screen').style.display = 'none';
  campaignState.active = true;
  setVsAI(true);
  loadCampaignStage(0);
}

// Menu button listeners
document.getElementById('btn-ai').addEventListener('click', () => { setVsAI(true); showCharSelect('ai'); });
document.getElementById('btn-human').addEventListener('click', () => { setVsAI(false); showCharSelect('human'); });
document.getElementById('btn-campaign').addEventListener('click', () => { setVsAI(true); showCharSelect('campaign'); });
document.getElementById('char-select-go').addEventListener('click', () => {
  const mode = document.getElementById('char-select-screen').dataset.mode;
  if (mode === 'campaign') startCampaign(); else startGame();
});
document.getElementById('char-select-back').addEventListener('click', () => {
  document.getElementById('char-select-screen').style.display = 'none';
  document.getElementById('mode-screen').style.display = 'flex';
});
document.getElementById('cgo-retry').addEventListener('click', () => {
  document.getElementById('campaign-gameover').style.display = 'none';
  loadCampaignStage(campaignState.stage);
});
document.getElementById('cgo-menu').addEventListener('click', () => {
  document.getElementById('campaign-gameover').style.display = 'none';
  returnToMenu();
});
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => { document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); setAiDifficulty(btn.dataset.diff); });
});