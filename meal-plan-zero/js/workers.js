// =============================================================================
// Module 4 — Worker AI & Detection
// File: js/workers.js
// Exposes: window.Workers = { init, update, draw, reset }
// Reads/writes: GameState.workers, GameState.detection, GameState.phase
// =============================================================================

window.Workers = (function () {

  // ---------------------------------------------------------------------------
  // Worker factory
  // ---------------------------------------------------------------------------

  function makeWorker(x, y, patrolPath, angle) {
    return {
      x,
      y,
      radius: 14,
      angle,                          // facing direction in radians (0=right, PI/2=down)
      speed: 1.2,
      state: 'patrol',                // 'patrol' | 'alert' | 'chase'
      visionRange: 150,
      visionAngle: Math.PI / 3,       // 60° cone
      patrolPath,
      pathIndex: 0,
      pathDir: 1,                     // 1=forward, -1=reverse along patrolPath
    };
  }

  // ---------------------------------------------------------------------------
  // Angle helpers
  // ---------------------------------------------------------------------------

  /** Wrap an angle into the range (-PI, PI]. */
  function wrapAngle(a) {
    while (a >  Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  /** Move `current` angle toward `target` by at most `step` radians. */
  function rotateToward(current, target, step) {
    const diff = wrapAngle(target - current);
    if (Math.abs(diff) <= step) return target;
    return current + Math.sign(diff) * step;
  }

  // ---------------------------------------------------------------------------
  // init
  // ---------------------------------------------------------------------------

  function init() {
    const workers = [
      // Worker A — patrols along Counter A (top)
      makeWorker(200, 150, [{ x: 200, y: 150 }, { x: 600, y: 150 }], 0),
      // Worker B — patrols between counters
      makeWorker(150, 350, [{ x: 150, y: 350 }, { x: 650, y: 350 }], 0),
      // Worker C — guards the player start zone
      makeWorker(400, 420, [{ x: 400, y: 420 }, { x: 400, y: 560 }], Math.PI / 2),
    ];
    GameState.workers = workers;
  }

  // ---------------------------------------------------------------------------
  // reset  (called between rounds — receives round number for difficulty scaling)
  // ---------------------------------------------------------------------------

  function reset(round) {
    round = round || GameState.round || 1;

    // Clamp scaling to round 4 values
    const r = Math.min(round, 4);

    // Per-round base stats (index 0 = round 1)
    const speedTable  = [1.2, 1.5, 1.8, 2.0];
    const rangeTable  = [150, 170, 190, 210];
    const patrolTable = [1.2, 1.5, 1.7, 2.0];

    const workerSpeed  = speedTable[r - 1];
    const visionRange  = rangeTable[r - 1];
    const patrolSpeed  = patrolTable[r - 1];

    // Re-initialise at starting positions
    init();

    // Apply difficulty scaling
    GameState.workers.forEach(w => {
      w.speed        = patrolSpeed;
      w.visionRange  = visionRange;
      w._baseSpeed   = workerSpeed;
      w._patrolSpeed = patrolSpeed;
    });

    GameState.detection = 0;
  }

  // ---------------------------------------------------------------------------
  // update  (called every frame by the engine when phase === 'playing')
  // ---------------------------------------------------------------------------

  function update() {
    if (GameState.phase !== 'playing') return;

    const workers   = GameState.workers;
    const player    = GameState.player;
    const px        = player.x + player.width  / 2;
    const py        = player.y + player.height / 2;
    const crouching = player.crouching;

    // --- 1. Vision cone check -------------------------------------------
    let anyDetected = false;

    workers.forEach(w => {
      const dx            = px - w.x;
      const dy            = py - w.y;
      const dist          = Math.sqrt(dx * dx + dy * dy);
      const angleToPlayer = Math.atan2(dy, dx);
      const angleDiff     = Math.abs(wrapAngle(angleToPlayer - w.angle));

      w._seesPlayer = (dist <= w.visionRange) && (angleDiff <= w.visionAngle / 2);
      if (w._seesPlayer) anyDetected = true;
    });

    // --- 2. Detection meter ---------------------------------------------
    if (anyDetected) {
      if (crouching) {
        GameState.detection += 1.5;   // crouching reduces detection gain
      } else {
        GameState.detection += 3;     // normal detection gain
      }
    } else {
      GameState.detection -= 0.5;
    }
    GameState.detection = Math.max(0, Math.min(100, GameState.detection));

    // --- 3. Game over ---------------------------------------------------
    if (GameState.detection >= 100) {
      GameState.phase = 'gameover';
      return;
    }

    // --- 4. State transitions -------------------------------------------
    const det = GameState.detection;

    // Find nearest worker to player (used for alert/chase promotion)
    let nearestWorker = null;
    let nearestDist   = Infinity;
    workers.forEach(w => {
      const d = Math.hypot(px - w.x, py - w.y);
      if (d < nearestDist) { nearestDist = d; nearestWorker = w; }
    });

    workers.forEach(w => {
      if (det < 40) {
        // Return to patrol
        w.state       = 'patrol';
        w.visionRange = w._patrolSpeed ? [150, 170, 190, 210][Math.min(GameState.round, 4) - 1] : 150;
        w.visionAngle = Math.PI / 3;
        w.speed       = w._patrolSpeed || 1.2;
      } else if (det >= 80) {
        if (w === nearestWorker) {
          w.state       = 'chase';
          w.visionRange = 220;
          w.visionAngle = Math.PI / 2;
          w.speed       = w._baseSpeed || 2.5;
        } else {
          w.state       = 'alert';
          w.visionRange = 220;
          w.visionAngle = Math.PI / 2;
        }
      } else if (det >= 40) {
        if (w === nearestWorker && w.state !== 'chase') {
          w.state       = 'alert';
          w.visionRange = 220;
          w.visionAngle = Math.PI / 2;
        }
      }
    });

    // --- 5. Move workers ------------------------------------------------
    workers.forEach(w => {
      if (w.state === 'chase') {
        // Move directly toward player
        const dx   = px - w.x;
        const dy   = py - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          w.x    += (dx / dist) * w.speed;
          w.y    += (dy / dist) * w.speed;
          w.angle = Math.atan2(dy, dx);
        }

      } else if (w.state === 'alert') {
        // Stop patrolling; slowly rotate toward player
        const dx          = px - w.x;
        const dy          = py - w.y;
        const targetAngle = Math.atan2(dy, dx);
        w.angle = rotateToward(w.angle, targetAngle, 0.05);

      } else {
        // 'patrol' — move along waypoints, bounce
        const target = w.patrolPath[w.pathIndex];
        const dx     = target.x - w.x;
        const dy     = target.y - w.y;
        const dist   = Math.sqrt(dx * dx + dy * dy);
        const speed  = w._patrolSpeed || w.speed;

        if (dist < speed) {
          // Reached waypoint — advance or reverse
          w.x = target.x;
          w.y = target.y;
          w.pathIndex += w.pathDir;
          if (w.pathIndex >= w.patrolPath.length) {
            w.pathIndex = w.patrolPath.length - 2;
            w.pathDir   = -1;
          } else if (w.pathIndex < 0) {
            w.pathIndex = 1;
            w.pathDir   = 1;
          }
        } else {
          w.x    += (dx / dist) * speed;
          w.y    += (dy / dist) * speed;
          w.angle = Math.atan2(dy, dx);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // draw  (called every frame regardless of phase)
  // ---------------------------------------------------------------------------

  function draw(ctx) {
    if (GameState.phase !== 'playing') return;

    const workers = GameState.workers;
    if (!workers || workers.length === 0) return;

    workers.forEach(w => {

      // --- Vision cone ---------------------------------------------------
      let coneColor;
      if      (w.state === 'chase') coneColor = 'rgba(255, 0,   0,   0.38)';
      else if (w.state === 'alert') coneColor = 'rgba(255, 100, 0,   0.28)';
      else                          coneColor = 'rgba(255, 220, 100, 0.18)';

      ctx.beginPath();
      ctx.moveTo(w.x, w.y);
      ctx.arc(w.x, w.y, w.visionRange,
              w.angle - w.visionAngle / 2,
              w.angle + w.visionAngle / 2);
      ctx.closePath();
      ctx.fillStyle = coneColor;
      ctx.fill();

      // --- Worker body (circle) -----------------------------------------
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#cc3300';
      ctx.fill();
      ctx.strokeStyle = '#ff6644';
      ctx.lineWidth = 2;
      ctx.stroke();

      // --- Facing indicator (white dot 18px ahead) ----------------------
      const dotX = w.x + Math.cos(w.angle) * 18;
      const dotY = w.y + Math.sin(w.angle) * 18;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // --- Alert / chase label above worker -----------------------------
      if (w.state === 'alert') {
        ctx.font      = 'bold 14px Arial';
        ctx.fillStyle = '#ff6600';
        ctx.textAlign = 'center';
        ctx.fillText('!', w.x, w.y - w.radius - 4);
      } else if (w.state === 'chase') {
        ctx.font      = 'bold 16px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('!!', w.x, w.y - w.radius - 4);
      }
    });

    // Reset text align so other modules aren't affected
    ctx.textAlign = 'left';
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return { init, update, draw, reset };

})();
