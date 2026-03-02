# Meal Plan Zero — Game Specification

## Overview

A top-down stealth game set in a college dining hall. Your meal plan ran out. You're hungry. The dining hall is open. Navigate the space, grab food off the counters, and reach the exit before cafeteria workers catch you. The more you steal, the higher your score. Get spotted and it's game over.

**Platform:** HTML5 Canvas, pure client-side JavaScript — no server required, deploys directly to GitHub Pages.

**Canvas size:** 800 × 600 px

---

## Team Structure

This game is built by 4 members. Each member owns one module and works on it independently using Claude. Modules communicate through a single shared global object (`window.GameState`). All modules must be built and tested in isolation first, then integrated into `index.html`.

| # | Module | File |
|---|--------|------|
| 1 | Engine, UI & Screens | `js/engine.js` + `js/state.js` + `js/ui.js` |
| 2 | Map & Dining Hall | `js/map.js` |
| 3 | Player Character | `js/player.js` |
| 4 | Worker AI & Detection | `js/workers.js` |

> **Prompt for Claude:** When starting your module, paste this entire spec into Claude and say: "I am building Module [N]: [name]. Build only this module. Use the GameState interface and the exposed window.[Module] API exactly as described in the spec."

---

## File Structure

```
meal-plan-zero/
├── index.html          ← entry point, loads all scripts in order
├── style.css           ← base page styles (black background, centered canvas)
├── js/
│   ├── state.js        ← shared game state (Module 1 writes, all modules read/write)
│   ├── engine.js       ← game loop, input handling, phase control (Module 1)
│   ├── ui.js           ← HUD, start/gameover/win screens, sound (Module 1)
│   ├── map.js          ← dining hall layout, food placement, rendering (Module 2)
│   ├── player.js       ← player movement, collision, food pickup (Module 3)
│   └── workers.js      ← worker AI, patrol routes, detection logic (Module 4)
└── assets/
    └── sounds/         ← optional WAV/MP3 files for sound effects
```

**Script load order in index.html:**
```html
<script src="js/state.js"></script>
<script src="js/map.js"></script>
<script src="js/player.js"></script>
<script src="js/workers.js"></script>
<script src="js/ui.js"></script>    <!-- Module 1, must load before engine -->
<script src="js/engine.js"></script> <!-- always last -->
```

---

## Shared Game State (`js/state.js`)

**Owner: Module 1.** All other modules read from and write to `window.GameState`. Do not store authoritative state in module-local variables — use GameState.

```javascript
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
    x: 388,          // starting x (pixels, top-left of hitbox)
    y: 500,          // starting y
    width: 20,
    height: 20,
    speed: 3,        // pixels per frame at 60fps
    crouching: false,
    inventory: [],   // array of food item objects grabbed this round
  },

  // Detection meter (0–100)
  detection: 0,

  // Map data (populated by Map.init())
  walls: [],         // [{ x, y, w, h }, ...]  — solid collision rects
  foods: [],         // [{ id, x, y, w, h, label, points, grabbed }, ...]
  exitZone: { x: 340, y: 20, w: 120, h: 30 },  // where player escapes

  // Workers (populated by Workers.init())
  workers: [],       // array of worker objects (defined in workers.js)

  // Input (set by engine.js keydown/keyup listeners)
  keys: {},          // e.g. { 'w': true, 'ArrowUp': true, 'Shift': true }
};
```

---

## Module 1 — Engine, UI & Screens

**Files:** `js/state.js`, `js/engine.js`, `js/ui.js`, `index.html`

### Responsibilities
- Define `window.GameState` (the full object above)
- Create and size the canvas (800 × 600), append to `#game-container`
- Set up `keydown` / `keyup` listeners that write to `GameState.keys`
- Run the main game loop via `requestAnimationFrame`
- Manage phase transitions: start → playing → gameover / win
- Call other module functions in the correct order each frame (see loop order below)
- Draw the in-game HUD (detection meter, score, inventory, round)
- Render the Start, Game Over, and Win screens
- Handle button clicks for start, retry, and next round
- (Optional) Play sound effects at key moments

### Game Loop Order (each frame)

```
1. Map.draw(ctx)
2. Player.update()
3. Player.draw(ctx)
4. Workers.update()
5. Workers.draw(ctx)
6. UI.draw(ctx)
```

> Update logic (steps 2 and 4) only runs when `GameState.phase === 'playing'`.
> Draw calls (1, 3, 5, 6) run every frame so screens render correctly.
> Clear the canvas at the start of every frame: `ctx.clearRect(0, 0, 800, 600)`.

### Phase Transitions
- `'start'` → `'playing'`: triggered by UI start button click
- `'playing'` → `'gameover'`: triggered by Workers module when `GameState.detection >= 100`
- `'playing'` → `'win'`: triggered by Player module when player exits with food
- `'gameover'` or `'win'` → `'playing'`: triggered by UI restart/next-round button

### init() startup sequence
```
Engine.init()
  → create canvas, set GameState.canvas + GameState.ctx
  → Map.init()
  → Player.init()
  → Workers.init()
  → UI.init()
  → requestAnimationFrame(loop)
```

### Notes for Claude (Engine)
- Use `delta time` if possible: `const dt = (timestamp - lastTime) / 1000` — pass dt to update functions or use it internally.
- Canvas should be styled with `display: block; margin: 0 auto;` centered on the page.
- The engine does not handle collision or detection — those belong to the Player and Workers modules.

### HUD Elements (`js/ui.js`, drawn over gameplay each frame)

| Element | Position | Details |
|---------|----------|---------|
| Detection meter | Top-right, x=580 y=12 w=200 h=18 | Background `#333`, fill color scaled by `detection/100`. Label "BUSTED" in white above bar |
| Score | Top-left, x=20 y=24 | White, 16px, `"Score: " + GameState.score` |
| Inventory | Top-center, x=340 y=24 | White, 14px, `GameState.player.inventory.length + " items"` |
| Round | Top-left, x=20 y=44 | Gray `#aaa`, 12px, `"Round " + GameState.round` |

Detection meter color transitions:
- 0–49%: `#33cc33` (green)
- 50–79%: `#ff9900` (orange)
- 80–100%: `#cc3300` (red) — flash the "BUSTED" label when above 80

### Start Screen

Drawn as a centered 480×320 dark box (`rgba(0,0,0,0.88)`) at x=160, y=140:

```
MEAL PLAN ZERO               (white, 32px bold, centered)

Your meal plan ran out.      (gray #aaa, 14px, centered)
You're hungry.
The dining hall is open.

[ START GAME ]               (button — white text on #336699 bg)

WASD — Move                  (gray #888, 11px)
Shift — Crouch (less visible)
E — Grab food
Reach the EXIT to escape
```

### Game Over Screen

Centered 420×260 dark box at x=190, y=170:

```
CAUGHT.                      (red #cc3300, 28px bold)

Banned from the dining hall. (gray #aaa, 14px)
Also still hungry.

Food stolen: N items         (white, 14px)
Score: N pts                 (white, 16px bold)

[ TRY AGAIN ]                (button — white on #993300)
```

### Win Screen

Centered 420×260 dark box at x=190, y=170:

```
ESCAPED.                     (green #33cc66, 28px bold)

Round N complete.            (gray #aaa, 14px)

Food stolen: N items         (white, 14px)
Score: N pts                 (white, 16px bold)

[ NEXT ROUND ]               (button — white on #336633)
```

### Button Interaction
- Store button rects as `{ x, y, w, h }` when drawing them
- Add a `'mousedown'` listener to the canvas on `UI.init()`
- On click: check if `(mx, my)` falls within any active button rect
  - Start button → `Engine.reset()` then `GameState.phase = 'playing'`
  - Try Again button → `Engine.reset()` then `GameState.phase = 'playing'`
  - Next Round button → `GameState.round++`, `Engine.reset()`, `GameState.phase = 'playing'`

### Sound Effects (Optional)

Use `new Audio(src)` for simplicity. Trigger only on threshold crossings, not every frame.

| Event | File | Notes |
|-------|------|-------|
| Food grabbed | `assets/sounds/grab.wav` | Short click/rustle |
| Detection spike (>50) | `assets/sounds/alert.wav` | Sting sound |
| Game over | `assets/sounds/caught.wav` | Buzzer/stinger |
| Win | `assets/sounds/escape.wav` | Positive chime |

If no sound files are available, skip — do not let missing audio break the game.

### Exposed API

```javascript
window.Engine = {
  init(),    // sets up canvas, listeners, calls all module inits, starts loop
  reset(),   // resets GameState values, calls Map/Player/Workers reset
};

window.UI = {
  init(),      // attach canvas mousedown listener
  draw(ctx),   // draw HUD during 'playing', or correct screen based on phase
};
```

### Notes for Claude (UI)
- All screens are drawn on canvas — no HTML `<div>` overlays.
- Draw screens on top of the partially rendered game frame using semi-transparent backgrounds.
- `UI.draw()` is called last in the game loop so it renders on top of everything.

---

## Module 2 — Map & Dining Hall

**File:** `js/map.js`

### Responsibilities
- Define the dining hall layout as a set of walls and counters
- Place food items at fixed counter positions on `init()`
- Populate `GameState.walls` and `GameState.foods` and confirm `GameState.exitZone`
- Draw the map: floor, walls, counters, ungrabbed food items

### Dining Hall Layout

```
+----------------------------------------------+  y=0
|  [EXIT DOOR — top center, x=340 w=120]       |
|  [====== FOOD COUNTER A (top) ===========]   |  y=60
|                                               |
|  [tables]              [tables]              |
|                                               |
|  [====== FOOD COUNTER B (middle) ========]   |  y=280
|                                               |
|  [tables]              [tables]              |
|                                               |
|             [PLAYER START ZONE]               |  y=500
+----------------------------------------------+  y=600
```

### Wall Rects (add to `GameState.walls`)

| Label | x | y | w | h |
|-------|---|---|---|---|
| Top wall | 0 | 0 | 800 | 20 |
| Bottom wall | 0 | 580 | 800 | 20 |
| Left wall | 0 | 0 | 20 | 600 |
| Right wall | 780 | 0 | 20 | 600 |
| Counter A | 80 | 60 | 640 | 40 |
| Counter B | 80 | 280 | 640 | 40 |
| Table 1 | 100 | 160 | 120 | 60 |
| Table 2 | 340 | 160 | 120 | 60 |
| Table 3 | 580 | 160 | 120 | 60 |
| Table 4 | 100 | 380 | 120 | 60 |
| Table 5 | 340 | 380 | 120 | 60 |
| Table 6 | 580 | 380 | 120 | 60 |

> Counter A separates the exit area from the main floor. Counter B separates the lower zone. The player starts below Counter B and must navigate around/between tables to reach Counter A food, then exit.

### Food Items (add to `GameState.foods`)

Place all food items on or just in front of the two counters. Each food item is a 24×24 hitbox.

| id | x | y | label | points |
|----|---|---|-------|--------|
| 0 | 100 | 95 | Pizza | 50 |
| 1 | 180 | 95 | Pasta | 45 |
| 2 | 260 | 95 | Soup | 35 |
| 3 | 340 | 95 | Sandwich | 30 |
| 4 | 420 | 95 | Muffin | 25 |
| 5 | 500 | 95 | Coffee | 20 |
| 6 | 580 | 95 | Apple | 10 |
| 7 | 660 | 95 | Cookies | 15 |
| 8 | 140 | 315 | Pizza | 50 |
| 9 | 300 | 315 | Pasta | 45 |
| 10 | 460 | 315 | Sandwich | 30 |
| 11 | 620 | 315 | Coffee | 20 |

Food item structure:
```javascript
{ id: 0, x: 100, y: 95, w: 24, h: 24, label: 'Pizza', points: 50, grabbed: false }
```

### Draw Instructions
- Floor: fill canvas with `#c8b89a` (warm tile color)
- Walls/counters: fill `#5a4a3a` (dark wood)
- Tables: fill `#8b6f47` (medium wood)
- Food items (not grabbed): draw a 24×24 colored square with a 10px label above in white, 9px sans-serif
  - Pizza: `#e84040`, Pasta: `#f0c060`, Soup: `#e09030`, Sandwich: `#c8a060`
  - Muffin: `#8b4513`, Coffee: `#4a2c0a`, Apple: `#cc2200`, Cookies: `#d4a050`
- Exit zone: draw a `#00cc66` rectangle at `GameState.exitZone` with label "EXIT" in black

### Exposed API

```javascript
window.Map = {
  init(),      // populate GameState.walls and GameState.foods
  draw(ctx),   // render floor, walls, tables, ungrabbed food
  reset(),     // set all foods grabbed = false, re-populate GameState.foods
};
```

### Notes for Claude
- Do not draw food items where `food.grabbed === true`.
- Draw order: floor first, then walls/counters/tables, then food items, then exit zone.
- `reset()` should restore all food items to `grabbed: false` (do not recreate from scratch — just reset the grabbed flag and re-assign `GameState.foods`).

---

## Module 3 — Player Character

**File:** `js/player.js`

### Responsibilities
- Read `GameState.keys` and move the player each frame
- Collide with all rects in `GameState.walls` (AABB — no passing through counters or tables)
- Detect food pickup when player overlaps a food item (press E or auto-grab on overlap)
- Detect win condition: player is in `GameState.exitZone` with at least one item in inventory
- Implement crouch: hold Shift to halve speed and shrink detection radius
- Draw the player

### Controls

| Key | Action |
|-----|--------|
| W or ArrowUp | Move up |
| A or ArrowLeft | Move left |
| S or ArrowDown | Move down |
| D or ArrowRight | Move right |
| Shift | Crouch (hold) |
| E | Grab nearby food |

### Movement & Collision
- Normal speed: `GameState.player.speed` (3 px/frame)
- Crouch speed: `GameState.player.speed * 0.5`
- Set `GameState.player.crouching = true` when Shift is held
- AABB collision resolution: move in X and Y separately — if collision after X move, revert X; same for Y. This prevents wall sticking.
- Player cannot walk through any rect in `GameState.walls`

### Food Pickup
- On `E` keypress (or overlap with any food): find the nearest `food` in `GameState.foods` where `food.grabbed === false` and distance from player center to food center ≤ 40px
- If found: set `food.grabbed = true`, push food into `GameState.player.inventory`, add `food.points` to `GameState.score`
- Only grab one food per keypress

### Win Condition
- Each frame: check if player hitbox overlaps `GameState.exitZone`
- If yes AND `GameState.player.inventory.length > 0`: set `GameState.phase = 'win'`

### Player Visuals
- Draw a 20×20 circle (use `ctx.arc`) at player center
  - Normal: `#3399ff` (blue)
  - Crouching: `#1a66cc` (darker blue, slightly smaller — 14px radius)
- Draw a 6px white dot indicating facing direction (track last non-zero movement vector)
- Draw a small inventory badge: number of items grabbed, bottom-right of player, yellow `#ffdd00` text

### Exposed API

```javascript
window.Player = {
  init(),              // set player to start position, clear inventory
  update(),            // read keys, move, check pickups, check win
  draw(ctx),           // render player
  reset(),             // same as init — called between rounds
  getHitbox(),         // returns { x, y, w, h } — player's current collision rect
  detectionRadius(),   // returns 60 normally, 35 when crouching
};
```

### Notes for Claude
- Use `GameState.keys['e']` for E key. Track a `prevKeys` snapshot to detect keydown (not held).
- `detectionRadius()` is called by the Workers module — return the correct value based on `GameState.player.crouching`.
- On `'win'` or `'gameover'` phase, `update()` should do nothing (engine only calls update when phase is `'playing'`, but guard anyway).

---

## Module 4 — Worker AI & Detection

**File:** `js/workers.js`

### Responsibilities
- Create 3 cafeteria workers with patrol routes
- Move workers along their patrol paths each frame
- Cast a vision cone from each worker — detect if the player is inside it
- Raise or lower `GameState.detection` based on whether player is seen
- Escalate worker state based on detection level
- Trigger game over when `GameState.detection >= 100`
- Draw workers and their vision cones

### Worker Object Structure

```javascript
{
  x: 200,               // current x (center)
  y: 150,               // current y (center)
  radius: 14,           // draw size
  angle: Math.PI / 2,   // facing direction in radians (0 = right, PI/2 = down)
  speed: 1.2,           // patrol speed px/frame
  state: 'patrol',      // 'patrol' | 'alert' | 'chase'
  visionRange: 150,     // px
  visionAngle: Math.PI / 3,  // 60° cone
  patrolPath: [         // waypoints to loop through
    { x: 200, y: 150 },
    { x: 200, y: 420 },
  ],
  pathIndex: 0,
  pathDir: 1,           // 1 = forward, -1 = reverse
}
```

### Three Workers & Patrol Routes

| Worker | Patrol Path | Notes |
|--------|-------------|-------|
| Worker A | (200, 150) ↔ (600, 150) | Patrols along Counter A (top) |
| Worker B | (150, 350) ↔ (650, 350) | Patrols between counters |
| Worker C | (400, 420) ↔ (400, 560) | Guards the player start zone |

Workers patrol back and forth along their path (bounce at each endpoint — reverse `pathDir`).

### Detection Logic

Each frame while `phase === 'playing'`:

1. For each worker, check if player is in vision cone:
   - Compute vector from worker center to player center
   - `dist` = vector magnitude
   - `angleToPlayer` = `Math.atan2(dy, dx)`
   - `angleDiff` = absolute difference between `angleToPlayer` and `worker.angle` (wrapped to -PI..PI)
   - **Detected** if: `dist <= worker.visionRange` AND `Math.abs(angleDiff) <= worker.visionAngle / 2`

2. Detection meter update per frame:
   - Any worker detects player (normal): `GameState.detection += 3`
   - Any worker detects player (player crouching): `GameState.detection += 1.5`
   - No worker detects player: `GameState.detection -= 0.5`
   - Clamp: `GameState.detection = Math.max(0, Math.min(100, GameState.detection))`

3. Worker state transitions:
   - `detection < 40`: all workers stay in `'patrol'`
   - `detection >= 40`: nearest worker enters `'alert'` — visionRange increases to 220, visionAngle to PI/2
   - `detection >= 80`: nearest worker enters `'chase'` — moves toward player position at speed 2.5
   - `detection >= 100`: set `GameState.phase = 'gameover'`

4. In `'alert'` state: worker stops patrolling and slowly rotates toward player
5. In `'chase'` state: worker moves directly toward player; other workers enter `'alert'`

### Worker Visuals

- Worker body: 14px radius circle, `#cc3300` (red)
- Vision cone: semi-transparent filled triangle, apex at worker center
  - Patrol state: `rgba(255, 220, 100, 0.18)` (yellow tint)
  - Alert state: `rgba(255, 100, 0, 0.28)` (orange tint)
  - Chase state: `rgba(255, 0, 0, 0.38)` (red tint)
- Facing indicator: small white dot 18px ahead of worker center
- Alert state: draw `!` above worker in orange `#ff6600`, 14px bold
- Chase state: draw `!!` above worker in red, 16px bold

Vision cone drawing:
```javascript
ctx.beginPath();
ctx.moveTo(worker.x, worker.y);
ctx.arc(worker.x, worker.y, worker.visionRange,
  worker.angle - worker.visionAngle / 2,
  worker.angle + worker.visionAngle / 2);
ctx.closePath();
ctx.fillStyle = coneColor;
ctx.fill();
```

### Exposed API

```javascript
window.Workers = {
  init(),      // create the 3 worker objects, assign to GameState.workers
  update(),    // move workers, run detection, update GameState.detection
  draw(ctx),   // render workers and vision cones
  reset(),     // reset workers to starting positions and patrol state
};
```

### Notes for Claude
- Call `Player.detectionRadius()` if you want to also check whether the player is "hiding" behind something (stretch goal: wall occlusion). For the base game, skip occlusion — just use the cone check.
- Detection should only run when `GameState.phase === 'playing'`. Guard at the top of `update()`.
- Worker angle updates smoothly toward their patrol direction: `worker.angle = Math.atan2(dy, dx)` where dy/dx is the direction toward next waypoint.

---

## Difficulty Scaling (Round 2+)

When `GameState.round > 1`, the engine passes round number to `Workers.reset()`. Workers module should scale:

| Round | Worker speed | Vision range | Patrol speed |
|-------|-------------|--------------|--------------|
| 1 | 1.2 | 150px | 1.2 |
| 2 | 1.5 | 170px | 1.5 |
| 3 | 1.8 | 190px | 1.7 |
| 4+ | 2.0 | 210px | 2.0 |

Apply formula: `baseValue + (round - 1) * increment`, capped at round 4 values.

---

## Integration Checklist

When all modules are done and ready to merge:

- [ ] Scripts load in correct order (`state.js` first, `engine.js` last)
- [ ] `Engine.init()` calls `Map.init()`, `Player.init()`, `Workers.init()`, `UI.init()`
- [ ] Canvas clears each frame before drawing
- [ ] Player collides with all walls (cannot walk through counters or tables)
- [ ] Food is grabbable and disappears when grabbed
- [ ] Detection meter rises when player is in vision cone
- [ ] Detection meter drains when player is out of sight
- [ ] Game over triggers at detection 100
- [ ] Win triggers when player exits with food
- [ ] Crouching reduces speed and detection gain
- [ ] Start screen shows on load; game starts on button click
- [ ] Game over screen shows score and retry button
- [ ] Win screen shows score and next round button
- [ ] Round counter increments; workers get slightly harder
- [ ] No console errors in browser DevTools

---

## Deployment

1. Create a folder `meal-plan-zero/` in the class GitHub org repo
2. Push all files — `index.html`, `style.css`, `js/`, `assets/`
3. Enable GitHub Pages (Settings → Pages → branch: main, root folder)
4. Game runs at: `https://[class-org].github.io/[repo-name]/meal-plan-zero/`
5. Test in a fresh browser tab (incognito) to confirm all assets load via relative paths

**No server required — 100% static, 100% client-side.**

---

## Stretch Goals

- **Wall occlusion**: workers cannot see through Counter A or Counter B — add raycast check against wall rects
- **Noise mechanic**: running (no crouch) emits a radius that alert workers can hear even without line of sight
- **Multiple exits**: two escape routes, one guarded more heavily
- **Leaderboard**: top 5 scores stored in `localStorage`, shown on win screen
- **Animated sprites**: replace circles with spritesheet characters
- **Background music**: looping ambient cafeteria audio via Web Audio API

---

*Deployed at: `https://aiml-1870-2026.github.io/mynamejohn/meal-plan-zero/`*
