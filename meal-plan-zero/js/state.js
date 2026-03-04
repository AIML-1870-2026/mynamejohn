// Module 1 — Shared Game State
// All modules read from and write to window.GameState.
// Do NOT store authoritative game data in module-local variables.

window.GameState = {
  // Game phase
  phase: 'start',   // 'start' | 'playing' | 'gameover' | 'win'
  score: 0,
  round: 1,

  // Canvas (set by engine.js on init)
  canvas: null,
  ctx: null,
  width: 800,
  height: 600,

  // Player
  player: {
    x: 388,          // starting x (top-left of hitbox)
    y: 500,          // starting y
    width: 20,
    height: 20,
    speed: 3,        // pixels per frame at 60fps
    crouching: false,
    inventory: [],   // food items grabbed this round
  },

  // Detection meter 0–100 (hits 100 = game over)
  detection: 0,

  // Map data — populated by Map.init()
  walls: [],         // [{ x, y, w, h }, ...]
  foods: [],         // [{ id, x, y, w, h, label, points, grabbed }, ...]
  exitZone: { x: 340, y: 20, w: 120, h: 30 },

  // Workers — populated by Workers.init()
  workers: [],

  // Input — written by engine.js keydown/keyup listeners
  keys: {},          // { 'w': true, 'ArrowUp': true, 'Shift': true, ... }
};
