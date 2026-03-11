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
  width: 800,     // viewport / canvas size
  height: 600,

  // World dimensions (larger than viewport — camera scrolls to show a portion)
  worldWidth:  800,
  worldHeight: 1400,

  // Camera — top-left corner of the viewport in world coordinates
  // Updated each frame by engine.js based on player position.
  cam: { x: 0, y: 0 },

  // Player
  player: {
    x: 50,           // starting position — lobby, bottom-left
    y: 1200,
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
  exitZone: { x: 340, y: 1350, w: 120, h: 28 },  // front door, bottom of lobby

  // Workers — populated by Workers.init()
  workers: [],

  // Input — written by engine.js keydown/keyup listeners
  keys: {},          // { 'w': true, 'ArrowUp': true, 'Shift': true, ... }

  // Hiding — true when player is inside a locker/cabinet hidespot
  hiding: false,

  // Hidespot objects — populated by Map.init(); each has { id, x, y, w, h, label, occupied }
  hideSpots: [],

  // Sprint resource — depleted by holding Space, regens when not sprinting
  stamina: 100,      // 0–100

  // Noise footprint — set by player.js each frame (radius in px, 0 = silent)
  playerNoise: 0,

  // Distraction throw — set by Q key; workers in radius walk toward it
  distractions: 3,   // charges remaining
  distraction: null, // { x, y, radius, timer } or null

  // Lives system — 3 hearts; lose one when detection hits 100
  lives: 3,
  highScore: 0,

  // Light fixtures — populated by Map.init() from LIGHT_FIXTURES
  lights: [],

  // Particle system — world-space visual effects
  particles: [],   // [{ x,y,vx,vy,r,color,alpha,decay }]

  // Combo multiplier — grab food quickly to chain points
  combo: 0,
  comboTimer: 0,   // frames remaining; >0 = combo active

  // Stealth tracking — accumulated detection exposure (lower = better grade)
  detectionExposure: 0,

  // Elapsed run timer (seconds)
  runTime: 0,

  // Visual effects
  shakeFrames: 0,    // screen shake countdown (frames)
  shakeMag: 5,       // shake intensity (pixels)
  grabFlash: 0,      // food-grab flash ring countdown (frames)
  flashAlpha: 0,     // full-screen red flash (0–1, fades out on lose-life)
  popups: [],        // floating score text: [{ text, x, y, alpha, color }, ...]
};
