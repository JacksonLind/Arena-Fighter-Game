// Game constants, player factory, shared game state, AI state, key tracking
const THREE = window.THREE;

export const MAX_HP = 200, MAX_SP = 100, MAX_AS = 100;
export const AS_PUNCH_COST = 18, AS_KICK_COST = 28, AS_REGEN_RATE = 22, AS_EXHAUST_CD = 1.8;
export const ARENA_R = 9.2, SPEED = 6.5, GRAVITY = -22;

export let vsAI = true;
export let aiDifficulty = 'easy';
export function setVsAI(v) { vsAI = v; }
export function setAiDifficulty(d) { aiDifficulty = d; }

export const roundTransition = { active: false, timer: 0, step: 0 };

export function makePlayer(x, facing) {
  return {
    hp: MAX_HP, sp: 0, as: MAX_AS, asExhaust: 0, x, z: 0, y: 0, vy: 0, vx: 0, vz: 0, kvx: 0, kvz: 0,
    onGround: true, facing, punching: 0, kicking: 0, special: 0, hitStun: 0, ragdoll: 0, wins: 0,
    blocking: false, blockStamina: 100, blockCooldown: 0, frozen: false
  };
}

export const gs = {
  p1: makePlayer(-3.5, 1), p2: makePlayer(3.5, -1),
  timer: 60, timerAccum: 0, round: 1, gameOver: false, started: false,
  announceTimer: 0, announce2Timer: 0
};

export const ai = { actionTimer: 0, state: 'approach', jumpCooldown: 0, retreatTimer: 0 };

export const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; if (['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.code] = false; });