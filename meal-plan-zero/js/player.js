// Module 3 — Player Character
// Owns: movement, AABB collision, food pickup, win detection, rendering.

window.Player = (function () {

  // Facing direction — updated whenever player moves
  let facingX = 0;
  let facingY = 1;   // default: facing down toward the dining hall

  // Previous E key state for keydown detection (not held)
  let prevE = false;

  // ─── Init / Reset ─────────────────────────────────────────────────────────

  function init() {
    const p = GameState.player;
    p.x = 388;
    p.y = 500;
    p.crouching = false;
    p.inventory = [];
    facingX = 0;
    facingY = 1;
    prevE = false;
  }

  function reset() { init(); }

  // ─── Update ───────────────────────────────────────────────────────────────

  function update(dt) {
    if (GameState.phase !== 'playing') return;

    const p = GameState.player;
    const keys = GameState.keys;

    // Crouch state
    p.crouching = !!(keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight']);

    // Speed this frame (spec: 3px/frame at 60fps = 180px/s)
    const pxPerSec = p.speed * 60 * (p.crouching ? 0.5 : 1);
    const spd = pxPerSec * dt;

    // Input vector
    let dx = 0, dy = 0;
    if (keys['w'] || keys['W'] || keys['ArrowUp'])    dy -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown'])  dy += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft'])  dx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

    // Track facing direction for the direction dot
    if (dx !== 0 || dy !== 0) { facingX = dx; facingY = dy; }

    // ── Move X then resolve collisions ──
    p.x += dx * spd;
    for (const wall of GameState.walls) {
      if (overlap(p, wall)) {
        if (dx > 0) p.x = wall.x - p.width;
        else if (dx < 0) p.x = wall.x + wall.w;
      }
    }

    // ── Move Y then resolve collisions ──
    p.y += dy * spd;
    for (const wall of GameState.walls) {
      if (overlap(p, wall)) {
        if (dy > 0) p.y = wall.y - p.height;
        else if (dy < 0) p.y = wall.y + wall.h;
      }
    }

    // Clamp to canvas
    p.x = Math.max(20, Math.min(GameState.width  - p.width  - 20, p.x));
    p.y = Math.max(20, Math.min(GameState.height - p.height - 20, p.y));

    // ── Food pickup on E keydown ──
    const eNow = !!(keys['e'] || keys['E']);
    if (eNow && !prevE) grabNearestFood();
    prevE = eNow;

    // ── Win condition ──
    const ez = GameState.exitZone;
    if (overlap(p, ez) && p.inventory.length > 0) {
      GameState.phase = 'win';
    }
  }

  // ─── AABB helpers ─────────────────────────────────────────────────────────

  function overlap(a, b) {
    const aw = a.width  ?? a.w;
    const ah = a.height ?? a.h;
    return a.x < b.x + b.w  &&
           a.x + aw > b.x   &&
           a.y < b.y + b.h  &&
           a.y + ah > b.y;
  }

  // ─── Food pickup ──────────────────────────────────────────────────────────

  function grabNearestFood() {
    const p = GameState.player;
    const pcx = p.x + p.width  / 2;
    const pcy = p.y + p.height / 2;

    let nearest = null;
    let nearestDist = Infinity;

    for (const food of GameState.foods) {
      if (food.grabbed) continue;
      const fcx = food.x + food.w / 2;
      const fcy = food.y + food.h / 2;
      const dist = Math.hypot(pcx - fcx, pcy - fcy);
      if (dist <= 40 && dist < nearestDist) {
        nearest = food;
        nearestDist = dist;
      }
    }

    if (nearest) {
      nearest.grabbed = true;
      p.inventory.push(nearest);
      GameState.score += nearest.points;
    }
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────

  function draw(ctx) {
    if (GameState.phase !== 'playing') return;

    const p = GameState.player;
    const cx = p.x + p.width  / 2;
    const cy = p.y + p.height / 2;
    const r  = p.crouching ? 7 : 10;

    // Optional: show detection radius ring when crouching
    if (p.crouching) {
      ctx.beginPath();
      ctx.arc(cx, cy, detectionRadius(), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Player body shadow
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // Player body
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = p.crouching ? '#1a66cc' : '#3399ff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Direction dot
    const flen = Math.hypot(facingX, facingY) || 1;
    const nx = facingX / flen;
    const ny = facingY / flen;
    ctx.beginPath();
    ctx.arc(cx + nx * (r - 3), cy + ny * (r - 3), 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Inventory badge
    if (p.inventory.length > 0) {
      ctx.fillStyle = '#ffdd00';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.inventory.length, cx + r + 2, cy + r + 2);
      ctx.textAlign = 'left';
    }
  }

  // ─── Exposed helpers ──────────────────────────────────────────────────────

  function getHitbox() {
    const p = GameState.player;
    return { x: p.x, y: p.y, w: p.width, h: p.height };
  }

  function detectionRadius() {
    return GameState.player.crouching ? 35 : 60;
  }

  return { init, update, draw, reset, getHitbox, detectionRadius };
})();
