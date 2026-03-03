// Game constants, player factory, shared game state, AI state, key tracking
const THREE = window.THREE;

export const MAX_HP = 200, MAX_SP = 100, MAX_AS = 100;
export const AS_PUNCH_COST = 18, AS_KICK_COST = 28, AS_REGEN_RATE = 22, AS_EXHAUST_CD = 1.8;
export const ARENA_R = 9.2, SPEED = 6.5, GRAVITY = -22;

export const ROSTER = [
  { id: 'azure',   name: 'AZURE',   mainCol: 0x0099cc, accentCol: 0x00e5ff, cssColor: '#00e5ff', hpMult: 1.0,  spdMult: 1.0,  dmgMult: 1.0,  role: 'Balanced',  special: 'AZURE SURGE'   },
  { id: 'phantom', name: 'PHANTOM', mainCol: 0x550099, accentCol: 0xcc44ff, cssColor: '#cc44ff', hpMult: 0.75, spdMult: 1.4,  dmgMult: 0.85, role: 'Speedster', special: 'PHANTOM RUSH'  },
  { id: 'titan',   name: 'TITAN',   mainCol: 0x334455, accentCol: 0x6699cc, cssColor: '#6699cc', hpMult: 1.6,  spdMult: 0.65, dmgMult: 1.4,  role: 'Heavy',     special: 'TITAN CRASH'   },
  { id: 'inferno', name: 'INFERNO', mainCol: 0x991100, accentCol: 0xff5500, cssColor: '#ff5500', hpMult: 1.1,  spdMult: 1.1,  dmgMult: 1.2,  role: 'Striker',   special: 'INFERNO BURST' },
];

export const CAMPAIGN_ENEMIES = [
  { name: 'GRUNT',     title: 'The First Test',   mainCol: 0x557744, accentCol: 0x88cc55, cssColor: '#88cc55', hpMult: 0.7,  spdMult: 0.85, dmgMult: 0.8,  aiDiff: 'easy',   special: 'POWER SLAM'    },
  { name: 'SERPENT',   title: 'Venom Strike',     mainCol: 0x115533, accentCol: 0x00ff88, cssColor: '#00ff88', hpMult: 0.9,  spdMult: 1.3,  dmgMult: 0.9,  aiDiff: 'easy',   special: 'VENOM RUSH'    },
  { name: 'BRAWLER',   title: 'Iron Fists',       mainCol: 0x553311, accentCol: 0xff8833, cssColor: '#ff8833', hpMult: 1.2,  spdMult: 0.9,  dmgMult: 1.3,  aiDiff: 'medium', special: 'CRUSHER'       },
  { name: 'WRAITH',    title: 'Shadow of Death',  mainCol: 0x330055, accentCol: 0xcc00ff, cssColor: '#cc00ff', hpMult: 0.85, spdMult: 1.45, dmgMult: 1.1,  aiDiff: 'medium', special: 'GHOST STRIKE'  },
  { name: 'WARLORD',   title: 'The Iron Tyrant',  mainCol: 0x443322, accentCol: 0xffaa00, cssColor: '#ffaa00', hpMult: 1.5,  spdMult: 0.75, dmgMult: 1.45, aiDiff: 'medium', special: 'TYRANT CRASH'  },
  { name: 'NEMESIS',   title: 'Mirror of Doom',   mainCol: 0x002255, accentCol: 0x0099ff, cssColor: '#0099ff', hpMult: 1.3,  spdMult: 1.2,  dmgMult: 1.35, aiDiff: 'hard',   special: 'NEMESIS SURGE' },
  { name: 'VOID LORD', title: 'The Final Boss',   mainCol: 0x110011, accentCol: 0xff00ff, cssColor: '#ff00ff', hpMult: 1.8,  spdMult: 1.2,  dmgMult: 1.6,  aiDiff: 'hard',   special: 'VOID COLLAPSE' },
];

export const campaignState = { active: false, stage: 0, currentEnemy: null };

export let vsAI = true;
export let aiDifficulty = 'easy';
export function setVsAI(v) { vsAI = v; }
export function setAiDifficulty(d) { aiDifficulty = d; }

export let p1SelectedChar = 0, p2SelectedChar = 0;
export function setP1Char(i) { p1SelectedChar = i; }
export function setP2Char(i) { p2SelectedChar = i; }

export const roundTransition = { active: false, timer: 0, step: 0 };

export function makePlayer(x, facing, charData) {
  const char = charData || ROSTER[0];
  const maxHp = Math.round(MAX_HP * char.hpMult);
  return {
    hp: maxHp, maxHp,
    sp: 0, as: MAX_AS, asExhaust: 0, x, z: 0, y: 0, vy: 0, vx: 0, vz: 0, kvx: 0, kvz: 0,
    onGround: true, facing, punching: 0, kicking: 0, special: 0, hitStun: 0, ragdoll: 0, wins: 0,
    blocking: false, blockStamina: 100, blockCooldown: 0, frozen: false,
    spdMult: char.spdMult, dmgMult: char.dmgMult, charIdx: ROSTER.indexOf(char),
    charName: char.name, charSpecial: char.special, charCol: char.accentCol, charCssColor: char.cssColor,
    comboCount: 0, comboTimer: 0,
  };
}

export const gs = {
  p1: makePlayer(-3.5, 1, ROSTER[0]), p2: makePlayer(3.5, -1, ROSTER[0]),
  timer: 60, timerAccum: 0, round: 1, gameOver: false, started: false,
  announceTimer: 0, announce2Timer: 0
};

export const ai = { actionTimer: 0, state: 'approach', jumpCooldown: 0, retreatTimer: 0 };

export const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; if (['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.code] = false; });