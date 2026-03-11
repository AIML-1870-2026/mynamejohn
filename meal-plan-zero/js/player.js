// Module 3 — Player Character
// Owns: movement, AABB collision, food pickup, hiding, win detection, rendering.

window.Player = (function () {

  // Facing direction — updated whenever player moves
  let facingX = 0;
  let facingY = 1;   // default: facing down toward the dining hall

  // Previous key states for edge-detection (keydown, not held)
  let prevE = false;
  let prevQ = false;

  // Sprint state — shared between update() and draw()
  let sprinting = false;

  // Walk animation state — used by draw()
  let _walkT    = 0;
  let _isMoving = false;

  // Hiding state — reference to the occupied GameState.hideSpots entry, or null
  let hidingAt = null;

  // ─── Init / Reset ─────────────────────────────────────────────────────────

  function init() {
    const p = GameState.player;
    p.x = 50;
    p.y = 1200;   // entrance lobby — bottom-left
    p.crouching = false;
    p.inventory = [];
    facingX   = 0;
    facingY   = 1;
    prevE     = false;
    prevQ     = false;
    sprinting = false;
    _walkT    = 0;
    _isMoving = false;
    // Exit any hiding carried over from previous round
    if (hidingAt) { hidingAt.occupied = false; hidingAt = null; }
    GameState.hiding      = false;
    GameState.playerNoise = 0;
  }

  function reset() { init(); }

  // ─── Update ───────────────────────────────────────────────────────────────

  function update(dt) {
    if (GameState.phase !== 'playing') return;

    const p    = GameState.player;
    const keys = GameState.keys;

    // ── Crouch ──
    p.crouching = !!(keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight']);

    // ── Sprint (Space) — can't sprint while crouching; burns stamina ──
    const wantSprint = !!(keys[' ']) && !p.crouching;
    sprinting = wantSprint && GameState.stamina > 0;
    if (sprinting) {
      GameState.stamina = Math.max(0, GameState.stamina - 80 * dt);
    } else {
      GameState.stamina = Math.min(100, GameState.stamina + 25 * dt);
    }

    // ── Input vector ──
    let dx = 0, dy = 0;
    if (keys['w'] || keys['W'] || keys['ArrowUp'])    dy -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown'])  dy += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft'])  dx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

    // ── Hiding — movement or E exits; no movement or noise while hiding ──
    if (GameState.hiding) {
      GameState.playerNoise = 0;

      if (dx !== 0 || dy !== 0) {
        // Any movement key exits hiding (but no movement this frame)
        _exitHiding();
        prevE = !!(keys['e'] || keys['E']);
        prevQ = !!(keys['q'] || keys['Q']);
        return;
      }

      const eNow = !!(keys['e'] || keys['E']);
      if (eNow && !prevE) _exitHiding();
      prevE = eNow;
      prevQ = !!(keys['q'] || keys['Q']);
      return;
    }

    // ── Facing direction (for distraction throw direction) ──
    const moving = dx !== 0 || dy !== 0;
    _isMoving = moving;
    if (moving) { facingX = dx; facingY = dy; }

    // ── Noise footprint — workers hear running; crouching is silent ──
    GameState.playerNoise = (_isMoving && !p.crouching) ? (sprinting ? 130 : 55) : 0;

    // ── Move X + collisions ──
    const speedMult = sprinting ? 2.0 : (p.crouching ? 0.5 : 1.0);
    const spd       = p.speed * 60 * speedMult * dt;

    p.x += dx * spd;
    for (const wall of GameState.walls) {
      if (overlap(p, wall)) {
        if (dx > 0) p.x = wall.x - p.width;
        else if (dx < 0) p.x = wall.x + wall.w;
      }
    }

    // ── Move Y + collisions ──
    p.y += dy * spd;
    for (const wall of GameState.walls) {
      if (overlap(p, wall)) {
        if (dy > 0) p.y = wall.y - p.height;
        else if (dy < 0) p.y = wall.y + wall.h;
      }
    }

    // ── Clamp to world bounds ──
    const WW = GameState.worldWidth  || GameState.width;
    const WH = GameState.worldHeight || GameState.height;
    p.x = Math.max(20, Math.min(WW - p.width  - 20, p.x));
    p.y = Math.max(20, Math.min(WH - p.height - 20, p.y));

    // ── E key — enter hidespot OR grab food (hidespot takes priority) ──
    const eNow = !!(keys['e'] || keys['E']);
    if (eNow && !prevE) {
      const spot = _findNearHidespot();
      if (spot) {
        GameState.hiding = true;
        hidingAt         = spot;
        spot.occupied    = true;
      } else {
        grabNearestFood();
      }
    }
    prevE = eNow;

    // ── Q key — throw distraction ──
    const qNow = !!(keys['q'] || keys['Q']);
    if (qNow && !prevQ && GameState.distractions > 0) {
      const pcx  = p.x + p.width  / 2;
      const pcy  = p.y + p.height / 2;
      const flen = Math.hypot(facingX, facingY) || 1;
      GameState.distraction = {
        x:      pcx + (facingX / flen) * 160,
        y:      pcy + (facingY / flen) * 160,
        radius: 100,
        timer:  180,
      };
      GameState.distractions--;
    }
    prevQ = qNow;

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

  // ─── Hidespot helpers ─────────────────────────────────────────────────────

  function _findNearHidespot() {
    const p   = GameState.player;
    const pcx = p.x + p.width  / 2;
    const pcy = p.y + p.height / 2;
    for (const spot of (GameState.hideSpots || [])) {
      if (spot.occupied) continue;
      const scx = spot.x + spot.w / 2;
      const scy = spot.y + spot.h / 2;
      if (Math.hypot(pcx - scx, pcy - scy) < 38) return spot;
    }
    return null;
  }

  function _exitHiding() {
    GameState.hiding = false;
    if (hidingAt) { hidingAt.occupied = false; hidingAt = null; }
  }

  // ─── Food pickup ──────────────────────────────────────────────────────────

  function grabNearestFood() {
    const p   = GameState.player;
    const pcx = p.x + p.width  / 2;
    const pcy = p.y + p.height / 2;

    let nearest = null, nearestDist = Infinity;

    for (const food of GameState.foods) {
      if (food.grabbed) continue;
      const fcx  = food.x + food.w / 2;
      const fcy  = food.y + food.h / 2;
      const dist = Math.hypot(pcx - fcx, pcy - fcy);
      if (dist <= 40 && dist < nearestDist) { nearest = food; nearestDist = dist; }
    }

    if (nearest) {
      nearest.grabbed     = true;
      p.inventory.push(nearest);
      GameState.score    += nearest.points;
      GameState.grabFlash = 12;
      // Floating score popup in world space
      if (!GameState.popups) GameState.popups = [];
      GameState.popups.push({
        text:  '+' + nearest.points + ' ' + nearest.label,
        x:     nearest.x + nearest.w / 2,
        y:     nearest.y - 4,
        alpha: 1,
        color: nearest.color || '#ffdd00',
      });
    }
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────

  function draw(ctx) {
    if (GameState.phase !== 'playing') return;

    const p  = GameState.player;
    const cx = p.x + p.width  / 2;
    const cy = p.y + p.height / 2;

    // Distraction indicator (drawn regardless of hiding state)
    const distr = GameState.distraction;
    if (distr && distr.timer > 0) {
      const fade = distr.timer / 180;
      ctx.beginPath();
      ctx.arc(distr.x, distr.y, distr.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,220,80,${fade * 0.28})`;
      ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
      const pR = 3 + Math.sin(Date.now() * 0.012) * 2;
      ctx.beginPath(); ctx.arc(distr.x, distr.y, pR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,80,${fade * 0.9})`; ctx.fill();
    }

    // ── While hiding: draw a faint ghost dot inside the locker ──
    if (GameState.hiding && hidingAt) {
      const hcx = hidingAt.x + hidingAt.w / 2;
      const hcy = hidingAt.y + hidingAt.h / 2;
      ctx.beginPath(); ctx.arc(hcx, hcy, 5, 0, Math.PI * 2);
      ctx.fillStyle   = 'rgba(51,153,255,0.28)'; ctx.fill();
      ctx.strokeStyle = 'rgba(80,220,80,0.75)'; ctx.lineWidth = 1.5; ctx.stroke();
      return;
    }

    // ── Walk animation ──
    if (_isMoving) _walkT += sprinting ? 0.22 : (p.crouching ? 0.08 : 0.15);
    const walk      = Math.sin(_walkT * Math.PI * 2);
    const walkSwing = p.crouching ? walk * 1.8 : walk * 3.5;

    const flen = Math.hypot(facingX, facingY) || 1;
    const fx   = facingX / flen;
    const fy   = facingY / flen;
    // Perpendicular axis for leg offset
    const sx2 = -fy, sy2 = fx;

    // Noise footprint ring
    const nr = GameState.playerNoise || 0;
    if (nr > 0) {
      ctx.beginPath(); ctx.arc(cx, cy, nr, 0, Math.PI * 2);
      ctx.strokeStyle = sprinting ? 'rgba(255,140,40,0.22)' : 'rgba(255,255,80,0.15)';
      ctx.lineWidth   = sprinting ? 2 : 1;
      ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);
    }

    // Crouch detection radius ring
    if (p.crouching) {
      ctx.beginPath(); ctx.arc(cx, cy, detectionRadius(), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,180,255,0.18)'; ctx.lineWidth = 1; ctx.stroke();
    }

    // Grab flash ring
    const gf = GameState.grabFlash || 0;
    if (gf > 0) {
      const expandR = 14 + (12 - gf) * 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, expandR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,220,0,${gf/12})`; ctx.lineWidth = 3; ctx.stroke();
      GameState.grabFlash--;
    }

    // Shadow
    ctx.beginPath(); ctx.arc(cx + 2, cy + 3, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();

    if (p.crouching) {
      // ── Crouching: compact form ──────────────────────────────────────
      // Body blob (lower, wider)
      ctx.beginPath(); ctx.arc(cx, cy + 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#1a55cc'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

      // Head (tucked in)
      ctx.beginPath(); ctx.arc(cx + fx * 5, cy + fy * 5 - 2, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#c8906a'; ctx.fill();
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1; ctx.stroke();

    } else {
      // ── Standing: full pixel-art person ─────────────────────────────
      // Legs (two dots swinging opposite)
      for (let li = 0; li < 2; li++) {
        const side  = li === 0 ? 1 : -1;
        const swing = li === 0 ? walkSwing : -walkSwing;
        const lx    = cx + sx2 * side * 3.5 - fy * swing;
        const ly    = cy + sy2 * side * 3.5 + fx * swing + 5;
        ctx.beginPath(); ctx.arc(lx, ly, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#1a2255'; ctx.fill();
        // Shoe
        ctx.beginPath(); ctx.arc(lx + fx * 1.5, ly + fy * 1.5, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#111111'; ctx.fill();
      }

      // Torso
      ctx.beginPath(); ctx.arc(cx, cy + 1, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#2266bb'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

      // Backpack / detail strip
      ctx.beginPath(); ctx.arc(cx - fx * 3.5, cy + 1 - fy * 3.5, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#335588'; ctx.fill();

      // Arms (small dots on sides)
      for (let ai = 0; ai < 2; ai++) {
        const side  = ai === 0 ? 1 : -1;
        const swing = ai === 0 ? -walkSwing * 0.6 : walkSwing * 0.6;
        const ax    = cx + sx2 * side * 7 - fy * swing * 0.5;
        const ay    = cy + sy2 * side * 7 + fx * swing * 0.5;
        ctx.beginPath(); ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#1a4488'; ctx.fill();
      }

      // Head
      const hx = cx + fx * 7, hy = cy + fy * 7 - 4;
      ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#c8906a'; ctx.fill();
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1; ctx.stroke();

      // Eyes (two small dots in facing direction)
      const ex1 = hx + sx2 * 2,  ey1 = hy + sy2 * 2;
      const ex2 = hx - sx2 * 2,  ey2 = hy - sy2 * 2;
      ctx.beginPath(); ctx.arc(ex1, ey1, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = '#111'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex2, ey2, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inventory badge
    if (p.inventory.length > 0) {
      ctx.fillStyle = '#ffdd00'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(p.inventory.length, cx + 11, cy - 12);
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
