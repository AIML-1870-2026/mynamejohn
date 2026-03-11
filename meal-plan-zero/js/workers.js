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

  function makeWorker(x, y, patrolPath, angle, color, name) {
    return {
      x,
      y,
      radius: 14,
      angle,                          // facing direction in radians (0=right, PI/2=down)
      color: color || '#cc3300',      // body color — default red, security guard is blue
      name: name || 'Worker',         // displayed on alert/chase
      speed: 1.2,
      state: 'patrol',                // 'patrol' | 'suspicious' | 'investigate' | 'alert' | 'chase'
      visionRange: 150,
      visionAngle: Math.PI / 3,       // 60° cone
      patrolPath,
      pathIndex: 0,
      pathDir: 1,                     // 1=forward, -1=reverse along patrolPath
      suspicionTimer: 0,              // 0–80; fills while player is visible in patrol
      lastKnownX: null,               // player position when last seen
      lastKnownY: null,
      _distractTarget: null,          // { x, y } — distraction throw destination or null
      searchTarget: null,             // { x, y } — location to investigate
      searchTimer: 0,                 // frames remaining in search state
      searchTarget: null,             // { x, y } — location to investigate
      searchTimer: 0,                 // frames remaining in search state
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
  // Line-of-sight helpers
  // ---------------------------------------------------------------------------

  /** Returns true if segment (x1,y1)→(x2,y2) intersects AABB r. */
  function lineBlockedByRect(x1, y1, x2, y2, r) {
    const dx = x2 - x1, dy = y2 - y1;
    let tmin = 0, tmax = 1;

    const rMaxX = r.x + r.w, rMaxY = r.y + r.h;

    if (dx === 0) { if (x1 < r.x || x1 > rMaxX) return false; }
    else {
      let t1 = (r.x  - x1) / dx, t2 = (rMaxX - x1) / dx;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }

    if (dy === 0) { if (y1 < r.y || y1 > rMaxY) return false; }
    else {
      let t1 = (r.y  - y1) / dy, t2 = (rMaxY - y1) / dy;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }

    return true;
  }

  /** Returns false if any interior wall blocks the ray worker→player. */
  function hasLineOfSight(wx, wy, px, py) {
    const WW = GameState.worldWidth  || GameState.width;
    const WH = GameState.worldHeight || GameState.height;
    for (const wall of GameState.walls) {
      // Skip outer boundary walls (they touch the world edges)
      if (wall.x <= 0 || wall.y <= 0 ||
          wall.x + wall.w >= WW ||
          wall.y + wall.h >= WH) continue;
      if (lineBlockedByRect(wx, wy, px, py, wall)) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // init
  // ---------------------------------------------------------------------------

  function init() {
    const workers = [
      // A — kitchen chef: full-width horizontal sweep of the kitchen zone.
      makeWorker(200, 180,
        [{ x: 40, y: 180 }, { x: 680, y: 180 }],
        0, '#cc3300', 'Chef Kim'),

      // B — gap guard: vertical patrol through the serving counter gap (x=400).
      //     The most dangerous worker — blocks the only pass-through.
      makeWorker(400, 220,
        [{ x: 400, y: 40 }, { x: 400, y: 260 }],
        -Math.PI / 2, '#cc3300', 'Mgr. Reed'),

      // C — upper dining: full-width horizontal patrol between counter and divider.
      makeWorker(80, 460,
        [{ x: 60, y: 460 }, { x: 720, y: 460 }],
        0, '#cc3300', 'Maya'),

      // D — lower dining: starts far-right heading left (away from player spawn at y=1200).
      makeWorker(720, 800,
        [{ x: 60, y: 800 }, { x: 720, y: 800 }],
        Math.PI, '#cc3300', 'Carlos'),

      // E — lobby security guard: patrols the escape corridor south of the security checkpoint.
      makeWorker(640, 1220,
        [{ x: 80, y: 1220 }, { x: 640, y: 1220 }],
        Math.PI, '#225599', 'Sec. Patel'),
    ];
    GameState.workers = workers;
  }

  // ---------------------------------------------------------------------------
  // reset  (called between rounds — receives round number for difficulty scaling)
  // ---------------------------------------------------------------------------

  function reset(round) {
    round = round || GameState.round || 1;
    const r = Math.min(round, 4);

    // Per-round scaling (index 0 = round 1)
    const speedTable  = [1.2, 1.5, 1.8, 2.1];  // chase speed
    const rangeTable  = [150, 165, 182, 200];   // vision range
    const patrolTable = [1.0, 1.3, 1.6, 1.9];  // patrol speed

    const workerSpeed = speedTable[r - 1];
    const visionRange = rangeTable[r - 1];
    const patrolSpeed = patrolTable[r - 1];

    init();

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

    // --- 0. Tick distraction timer --------------------------------------
    const distr = GameState.distraction;
    if (distr) {
      distr.timer--;
      if (distr.timer <= 0) {
        GameState.distraction = null;
        workers.forEach(w => { w._distractTarget = null; });
      }
    }

    // --- 1. Vision cone + line-of-sight check ---------------------------
    workers.forEach(w => {
      const dx            = px - w.x;
      const dy            = py - w.y;
      const dist          = Math.sqrt(dx * dx + dy * dy);
      const angleToPlayer = Math.atan2(dy, dx);
      const angleDiff     = Math.abs(wrapAngle(angleToPlayer - w.angle));
      const inCone        = (dist <= w.visionRange) && (angleDiff <= w.visionAngle / 2);
      // Counters and tables block sight — must have clear line to detect
      w._seesPlayer = !GameState.hiding && inCone && (dist < 10 || hasLineOfSight(w.x, w.y, px, py));
      if (w._seesPlayer) { w.lastKnownX = px; w.lastKnownY = py; }

      // Hearing — workers detect running footsteps without LOS
      // Louder = faster detection (running = loud, crouching = silent)
      const noiseRadius = GameState.playerNoise || 0;
      if (noiseRadius > 0 && dist <= noiseRadius) {
        w.lastKnownX = px;
        w.lastKnownY = py;
        // Gain varies by volume: loud noise (running) = +3, normal = +1.5
        const noiseFactor = (noiseRadius > 100) ? 3 : 1.5;
        w.suspicionTimer = Math.min(80, w.suspicionTimer + noiseFactor);
        
        // If very loud and close, immediate alert
        if (noiseRadius > 110 && dist < noiseRadius * 0.5 && w.state === 'patrol') {
          w.state = 'alert';
          w.visionRange = 200;
          w.visionAngle = Math.PI / 2;
        }
      }

      // Distraction throw — lure patrol workers toward the noise source
      const d = GameState.distraction;
      if (d && d.timer > 0 && w.state === 'patrol' && !w._distractTarget) {
        const dDist = Math.hypot(d.x - w.x, d.y - w.y);
        if (dDist <= d.radius) {
          w._distractTarget = { x: d.x, y: d.y };
        }
      }
    });

    // --- 2. Suspicion timers + detection meter --------------------------
    let detectionGain = 0;

    workers.forEach(w => {
      if (w._seesPlayer) {
        w.suspicionTimer = Math.min(80, w.suspicionTimer + 3);
      } else {
        w.suspicionTimer = Math.max(0, w.suspicionTimer - 2);
      }

      if (w.state === 'investigate') {
        // Search the location where player was last seen
        const dx = w.searchTarget.x - w.x;
        const dy = w.searchTarget.y - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 25) {
          // At search location - stay and scan (w.searchTimer counts down)
          w.searchTimer--;
          if (w.searchTimer <= 0) {
            w.state = 'suspicious';
            w.searchTarget = null;
          }
        } else {
          // Move toward search location
          w.x += (dx / dist) * (w.speed * 0.8);
          w.y += (dy / dist) * (w.speed * 0.8);
          w.angle = Math.atan2(dy, dx);
        }

      if (w.state === 'investigate') {
        // Move to and search last-known position
        if (w.searchTarget) {
          const dx = w.searchTarget.x - w.x;
          const dy = w.searchTarget.y - w.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 25) {
            w.searchTimer--;
            if (w.searchTimer <= 0) {
              w.state = 'suspicious';
              w.searchTarget = null;
            }
          } else {
            w.x += (dx / dist) * w.speed * 0.8;
            w.y += (dy / dist) * w.speed * 0.8;
            w.angle = Math.atan2(dy, dx);
          }
        }
      } else       } else if (w.state === 'chase') {
        detectionGain += crouching ? 2 : 3;
      } else if (w.state === 'investigate') {
        // Searching indicator
        ctx.font      = 'bold 12px Arial';
        ctx.fillStyle = '#ffaa44';
        ctx.fillText('?!', w.x, w.y - w.radius - 6);
        
        // Draw search circle
        if (w.searchTarget) {
          ctx.beginPath();
          ctx.arc(w.searchTarget.x, w.searchTarget.y, 30, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

      } else if (w.state === 'alert') {
        detectionGain += crouching ? 1.5 : 2.5;
      } else if (w._seesPlayer && w.state === 'patrol') {
        // Suspicion ramp — full contribution only after ~1.3s of unbroken sight
        detectionGain += (crouching ? 0.8 : 1.6) * (w.suspicionTimer / 80);
      } else if (w.state === 'suspicious') {
        // Stopped and scanning — slow drain if player hides
        if (w._seesPlayer) detectionGain += crouching ? 0.8 : 1.6;
      }
    });

    if (detectionGain > 0) {
      GameState.detection += detectionGain;
    } else {
      GameState.detection -= 0.5;
    }
    // --- Worker Coordination Bonus ---
    // When multiple workers are alert/chase, they work together (tension increases)
    const alertWorkers = GameState.workers.filter(w => w.state === 'alert' || w.state === 'chase' || w.state === 'investigate').length;
    if (alertWorkers >= 2) {
      GameState.detection += (alertWorkers - 1) * 0.8;  // Extra pressure when multiple workers coordinating
    }
    
    GameState.detection = Math.max(0, Math.min(100, GameState.detection));

    // NOTE: detection >= 100 is now handled by engine.js (lives system).

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
      // Drop distraction target when detection escalates — real threats take priority
      if (det >= 40) w._distractTarget = null;

      if (det >= 80) {
        // High alert — chase nearest, all others alert
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
        // Alert threshold
        if (w === nearestWorker && w.state !== 'chase') {
          w.state       = 'alert';
          w.visionRange = 220;
          w.visionAngle = Math.PI / 2;
        }
      } else {
        // Low detection
        if (w.suspicionTimer >= 80) {
          // Full suspicion — this worker goes into investigate mode
          if (!w.searchTarget && w.lastKnownX !== null) {
            w.searchTarget = { x: w.lastKnownX, y: w.lastKnownY };
            w.searchTimer = 120;  // 2 seconds at 60fps
          }
          w.state       = 'investigate';
          w.visionRange = 200;
          w.visionAngle = Math.PI / 2;
        } else if (w.suspicionTimer > 0 && w.state === 'patrol') {
          // Building suspicion — stop and scan (Bob the Robber "?" moment)
          w.state       = 'suspicious';
          w.visionAngle = Math.PI / 2.5;
        } else if (w.suspicionTimer === 0 && (w.state === 'suspicious' || w.state === 'alert')) {
          // Suspicion drained — return to patrol
          w.state       = 'patrol';
          w.visionRange = w._patrolSpeed ? [150, 170, 190, 210][Math.min(GameState.round, 4) - 1] : 150;
          w.visionAngle = Math.PI / 3;
          w.speed       = w._patrolSpeed || 1.2;
        } else if (w.state === 'patrol') {
          w.visionRange = w._patrolSpeed ? [150, 170, 190, 210][Math.min(GameState.round, 4) - 1] : 150;
          w.visionAngle = Math.PI / 3;
          w.speed       = w._patrolSpeed || 1.2;
        }
      }
    });

    // --- 5. Alert propagation — chase triggers nearby patrol workers -----
    workers.forEach(w => {
      if (w.state === 'investigate') {
        // Search the location where player was last seen
        const dx = w.searchTarget.x - w.x;
        const dy = w.searchTarget.y - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 25) {
          // At search location - stay and scan (w.searchTimer counts down)
          w.searchTimer--;
          if (w.searchTimer <= 0) {
            w.state = 'suspicious';
            w.searchTarget = null;
          }
        } else {
          // Move toward search location
          w.x += (dx / dist) * (w.speed * 0.8);
          w.y += (dy / dist) * (w.speed * 0.8);
          w.angle = Math.atan2(dy, dx);
        }

      } else if (w.state === 'chase') {
        workers.forEach(other => {
          if (other !== w && other.state === 'patrol') {
            if (Math.hypot(other.x - w.x, other.y - w.y) < 280) {
              other.state       = 'alert';
              other.lastKnownX  = px;
              other.lastKnownY  = py;
              other.visionRange = 200;
              other.visionAngle = Math.PI / 2;
            }
          }
        });
      }
    });

    // --- 6. Move workers ------------------------------------------------
    workers.forEach(w => {
      if (w.state === 'investigate') {
        // Search the location where player was last seen
        const dx = w.searchTarget.x - w.x;
        const dy = w.searchTarget.y - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 25) {
          // At search location - stay and scan (w.searchTimer counts down)
          w.searchTimer--;
          if (w.searchTimer <= 0) {
            w.state = 'suspicious';
            w.searchTarget = null;
          }
        } else {
          // Move toward search location
          w.x += (dx / dist) * (w.speed * 0.8);
          w.y += (dy / dist) * (w.speed * 0.8);
          w.angle = Math.atan2(dy, dx);
        }

      } else if (w.state === 'chase') {
        // Move directly toward player
        const dx   = px - w.x;
        const dy   = py - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          w.x    += (dx / dist) * w.speed;
          w.y    += (dy / dist) * w.speed;
          w.angle = Math.atan2(dy, dx);
        }

      } else if (w.state === 'suspicious') {
        // Stop moving — slowly scan toward last known player position
        const tx = w.lastKnownX !== null ? w.lastKnownX : px;
        const ty = w.lastKnownY !== null ? w.lastKnownY : py;
        const targetAngle = Math.atan2(ty - w.y, tx - w.x);
        w.angle = rotateToward(w.angle, targetAngle, 0.03);

      } else if (w.state === 'investigate') {
        // Searching indicator
        ctx.font      = 'bold 12px Arial';
        ctx.fillStyle = '#ffaa44';
        ctx.fillText('?!', w.x, w.y - w.radius - 6);
        
        // Draw search circle
        if (w.searchTarget) {
          ctx.beginPath();
          ctx.arc(w.searchTarget.x, w.searchTarget.y, 30, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

      } else if (w.state === 'alert') {
        // Stop patrolling; slowly rotate toward player
        const dx          = px - w.x;
        const dy          = py - w.y;
        const targetAngle = Math.atan2(dy, dx);
        w.angle = rotateToward(w.angle, targetAngle, 0.05);

      } else {
        // 'patrol' — check distraction target first, then normal waypoints
        if (w._distractTarget) {
          const dx   = w._distractTarget.x - w.x;
          const dy   = w._distractTarget.y - w.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 5) {
            w._distractTarget = null;  // reached it — resume patrol
          } else {
            const speed = w._patrolSpeed || w.speed;
            w.x    += (dx / dist) * speed;
            w.y    += (dy / dist) * speed;
            w.angle = Math.atan2(dy, dx);
          }
        } else {
        // Normal waypoint patrol
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
        } // end else (_distractTarget not set)
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

      // --- Worker pixel-art sprite ---------------------------------------
      // w.x, w.y = worker center position
      const isGuard  = (w.color === '#225599');
      const bodyColor = isGuard ? '#1a3a66' : '#883300';
      const uniformColor = isGuard ? '#2a5599' : '#cc4400';
      const apronColor   = isGuard ? '#4488cc' : '#ffffff';

      // Walking animation: leg swing based on movement (patrol/chase move, alert/sus don't)
      const moving = (w.state === 'patrol' || w.state === 'chase');
      if (moving) w._walkT = (w._walkT || 0) + (w.state === 'chase' ? 0.22 : 0.14);
      const walk  = moving ? Math.sin((w._walkT || 0) * Math.PI * 2) * 3.5 : 0;
      const facing = w.angle; // radians; 0=right, PI/2=down, PI=left
      const fx = Math.cos(facing), fy = Math.sin(facing);
      // Side axis (perpendicular to facing for leg offset)
      const sx2 = -fy, sy2 = fx;

      const cx2 = w.x, cy2 = w.y;

      // Shadow
      ctx.beginPath(); ctx.arc(cx2 + 2, cy2 + 2, 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();

      // Legs — two small rects offset perpendicular to facing
      const legColors = ['#1a1a1a', '#2a2a2a'];
      for (let li = 0; li < 2; li++) {
        const side  = li === 0 ? 1 : -1;
        const swing = li === 0 ? walk : -walk;
        const legX  = cx2 + sx2 * side * 3.5 - fy * swing;
        const legY  = cy2 + sy2 * side * 3.5 + fx * swing;
        ctx.beginPath(); ctx.arc(legX, legY, 3, 0, Math.PI * 2);
        ctx.fillStyle = legColors[li]; ctx.fill();
      }

      // Body (uniform)
      ctx.beginPath(); ctx.arc(cx2, cy2, 8, 0, Math.PI * 2);
      ctx.fillStyle = uniformColor; ctx.fill();
      ctx.strokeStyle = bodyColor; ctx.lineWidth = 1.5; ctx.stroke();

      // Apron strip (vertical rect in facing direction)
      ctx.beginPath();
      ctx.arc(cx2 + fx * 2, cy2 + fy * 2, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = apronColor; ctx.fill();

      // Head
      const hx = cx2 + fx * 8, hy = cy2 + fy * 8;
      ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#c8906a'; ctx.fill();
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1; ctx.stroke();

      // Eyes — two dots facing same direction
      const ex1 = hx + sx2 * 1.8, ey1 = hy + sy2 * 1.8;
      const ex2 = hx - sx2 * 1.8, ey2 = hy - sy2 * 1.8;
      ctx.beginPath(); ctx.arc(ex1, ey1, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#111'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex2, ey2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // --- State label + name above worker ------------------------------
      ctx.textAlign = 'center';
      const now = Date.now();

      if (w.state === 'investigate') {
        // Search the location where player was last seen
        const dx = w.searchTarget.x - w.x;
        const dy = w.searchTarget.y - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 25) {
          // At search location - stay and scan (w.searchTimer counts down)
          w.searchTimer--;
          if (w.searchTimer <= 0) {
            w.state = 'suspicious';
            w.searchTarget = null;
          }
        } else {
          // Move toward search location
          w.x += (dx / dist) * (w.speed * 0.8);
          w.y += (dy / dist) * (w.speed * 0.8);
          w.angle = Math.atan2(dy, dx);
        }

      } else if (w.state === 'chase') {
        // Radial alarm glow
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.018);
        ctx.beginPath();
        ctx.arc(w.x, w.y, 18 + pulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,0,0,${0.18 + pulse * 0.15})`;
        ctx.fill();

        ctx.font      = 'bold 16px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('!!', w.x, w.y - w.radius - 6);

        // Spawn orange sparks toward player
        if (!GameState.particles) GameState.particles = [];
        if (Math.random() < 0.25) {
          const a = Math.random() * Math.PI * 2;
          GameState.particles.push({ x: w.x, y: w.y,
            vx: Math.cos(a) * (1.5 + Math.random() * 2),
            vy: Math.sin(a) * (1.5 + Math.random() * 2),
            r: 2 + Math.random() * 2, color: '#ff4400',
            alpha: 0.8, decay: 0.055 });
        }

        // Worker name
        ctx.font      = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(255,180,180,0.9)';
        ctx.fillText(w.name || '', w.x, w.y - w.radius - 18);

      } else if (w.state === 'investigate') {
        // Searching indicator
        ctx.font      = 'bold 12px Arial';
        ctx.fillStyle = '#ffaa44';
        ctx.fillText('?!', w.x, w.y - w.radius - 6);
        
        // Draw search circle
        if (w.searchTarget) {
          ctx.beginPath();
          ctx.arc(w.searchTarget.x, w.searchTarget.y, 30, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

      } else if (w.state === 'alert') {
        ctx.font      = 'bold 14px Arial';
        ctx.fillStyle = '#ff6600';
        ctx.fillText('!', w.x, w.y - w.radius - 6);

        // Spawn yellow sparks
        if (!GameState.particles) GameState.particles = [];
        if (Math.random() < 0.1) {
          const a = Math.random() * Math.PI * 2;
          GameState.particles.push({ x: w.x, y: w.y,
            vx: Math.cos(a) * (0.8 + Math.random()),
            vy: Math.sin(a) * (0.8 + Math.random()),
            r: 1.5 + Math.random(), color: '#ffaa00',
            alpha: 0.65, decay: 0.045 });
        }

        ctx.font      = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(255,220,150,0.9)';
        ctx.fillText(w.name || '', w.x, w.y - w.radius - 18);

      } else if (w.state === 'suspicious') {
        const alpha = 0.5 + 0.5 * Math.sin(now / 120);
        const fill  = Math.floor(w.suspicionTimer / 80 * 255);
        ctx.font      = 'bold 15px Arial';
        ctx.fillStyle = `rgba(255, ${255 - fill}, 50, ${alpha})`;
        ctx.fillText('?', w.x, w.y - w.radius - 6);

      } else if (w.suspicionTimer > 0) {
        ctx.font      = 'bold 13px Arial';
        ctx.fillStyle = `rgba(255, 200, 50, ${w.suspicionTimer / 80 * 0.7})`;
        ctx.fillText('?', w.x, w.y - w.radius - 6);
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
