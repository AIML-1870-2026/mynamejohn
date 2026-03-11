// =============================================================================
// Module 2 — Map & Dining Hall
// File: js/map.js
// Exposes: window.Map = { init, draw, reset }
// Reads/writes: GameState.walls, GameState.foods, GameState.exitZone
//
// World: 800 × 1400  (camera scrolls vertically; viewport is 800×600)
//
// Zone layout (y=0 is top):
//   KITCHEN      y=20   – y=270  (food, 2 workers: Chef A + Gap Guard B)
//   COUNTER      y=270  – y=298  (serving counter; gap x=320–480)
//   UPPER DINING y=298  – y=620  (3 dining tables; Worker C patrols)
//   DIVIDER 1    y=620  – y=642  (painted wall; gap x=360–440)
//   LOWER DINING y=642  – y=980  (tables + post; Worker D patrols)
//   DIVIDER 2    y=980  – y=1000 (lobby separator; gap x=280–520)
//   LOBBY        y=1000 – y=1380 (benches, EXIT at y=1350 — player spawns here)
// =============================================================================

window.Map = (function () {

  var _time       = 0;
  var _particles  = [];
  var _MAX_PARTICLES = 60;

  // ── Wall definitions ────────────────────────────────────────────────────────
  // Index groups:
  //   0–3   outer walls (skipped by LOS check)
  //   4–5   serving counter          (gap x=320–480)
  //   6–7   zone divider 1           (gap x=360–440)
  //   8–9   zone divider 2 / lobby   (gap x=280–520)
  //   10–12 upper dining tables
  //   13–15 lower dining tables + centre post
  //   16–17 kitchen prep stations
  //   18–19 lobby benches
  //   20    kitchen central island
  //   21–24 cover columns (upper + lower dining)
  //   25–26 lobby inner security wall  (gap x=260–540)
  //   27–30 dining zone wall stubs (partition cover, jut from side walls)
  //   31–32 kitchen wall shelves

  const WALL_DEFS = [
    // Outer boundary
    { x:0,   y:0,    w:800, h:20   },  // 0  top
    { x:0,   y:1380, w:800, h:20   },  // 1  bottom
    { x:0,   y:0,    w:20,  h:1400 },  // 2  left
    { x:780, y:0,    w:20,  h:1400 },  // 3  right

    // Serving counter (gap x=320–480 = 160px)
    { x:20,  y:270,  w:300, h:28   },  // 4  counter-left   (x=20–320)
    { x:480, y:270,  w:300, h:28   },  // 5  counter-right  (x=480–780)

    // Zone divider 1 — upper/lower dining (gap x=360–440 = 80px)
    { x:20,  y:620,  w:340, h:22   },  // 6  div1-left
    { x:440, y:620,  w:340, h:22   },  // 7  div1-right

    // Zone divider 2 — lobby separator (gap x=280–520 = 240px, wide and easy)
    { x:20,  y:980,  w:260, h:20   },  // 8  div2-left
    { x:520, y:980,  w:260, h:20   },  // 9  div2-right

    // Upper dining tables
    { x:90,  y:350,  w:110, h:55   },  // 10 table UL
    { x:340, y:350,  w:120, h:55   },  // 11 table UM
    { x:600, y:350,  w:110, h:55   },  // 12 table UR

    // Lower dining tables + cover post
    { x:120, y:710,  w:110, h:55   },  // 13 table LL
    { x:370, y:730,  w:60,  h:55   },  // 14 centre post
    { x:570, y:710,  w:110, h:55   },  // 15 table LR

    // Kitchen prep stations (solid stainless-steel equipment)
    { x:60,  y:80,   w:100, h:50   },  // 16 prep station left
    { x:640, y:80,   w:100, h:50   },  // 17 prep station right

    // Lobby benches
    { x:60,  y:1070, w:80,  h:28   },  // 18 bench left
    { x:660, y:1070, w:80,  h:28   },  // 19 bench right

    // Kitchen central island — splits kitchen into left lane (x<310) and right lane (x>490)
    // Forces player to choose a lane and creates tactical routing around Chef A
    { x:310, y:50,   w:180, h:90   },  // 20 kitchen central island

    // Cover columns in upper and lower dining — give player LOS-break spots mid-room
    { x:200, y:530,  w:22,  h:55   },  // 21 column upper-left
    { x:578, y:530,  w:22,  h:55   },  // 22 column upper-right
    { x:200, y:870,  w:22,  h:55   },  // 23 column lower-left
    { x:578, y:870,  w:22,  h:55   },  // 24 column lower-right

    // Lobby inner security wall — second choke point before EXIT (gap x=260–540 = 280px)
    // Worker E (lobby guard) patrols the zone south of this wall.
    { x:20,  y:1140, w:240, h:22   },  // 25 lobby inner wall left
    { x:540, y:1140, w:240, h:22   },  // 26 lobby inner wall right

    // Dining zone wall stubs — partition walls jutting from side walls; create cover lanes
    { x:20,  y:468,  w:55,  h:22   },  // 27 upper dining stub left
    { x:725, y:468,  w:55,  h:22   },  // 28 upper dining stub right
    { x:20,  y:790,  w:55,  h:22   },  // 29 lower dining stub left
    { x:725, y:790,  w:55,  h:22   },  // 30 lower dining stub right

    // Kitchen wall shelves — stainless steel storage units along back walls
    { x:20,  y:155,  w:60,  h:22   },  // 31 kitchen shelf left
    { x:720, y:155,  w:60,  h:22   },  // 32 kitchen shelf right
  ];

  // ── Food definitions ─────────────────────────────────────────────────────────
  // All food is in the kitchen zone (y < 270).
  // Counter food at y=240: player presses against counter from kitchen side
  //   → player.center.y ≈ 260, food.center.y ≈ 252, distance ≈ 8px ✓
  // Deep kitchen food: in the open kitchen area — higher risk/reward.

  const FOOD_DEFS = [
    // Left counter section (x=20–320, y=240)
    { id:0,  x:50,  y:240, label:'Pizza',    points:200, color:'#ff5555', glow:'#ff2020', icon:'🍕' },
    { id:1,  x:130, y:240, label:'Pasta',    points:180, color:'#f5c842', glow:'#e0a800', icon:'🍝' },
    { id:2,  x:210, y:240, label:'Soup',     points:120, color:'#f09030', glow:'#cc6600', icon:'🍜' },
    { id:3,  x:282, y:240, label:'Sandwich', points:100, color:'#d4a96a', glow:'#a07030', icon:'🥪' },
    // Deep kitchen — two lanes created by the central island (x=310–490, y=50–140)
    // Left-lane food: approach from x<310 (past left prep station)
    { id:4,  x:168, y:130, label:'Pizza',    points:150, color:'#ff5555', glow:'#ff2020', icon:'🍕' },
    // Below island — enter from either lane, requires both workers to be out of sight
    { id:5,  x:372, y:168, label:'Pasta',    points:140, color:'#f5c842', glow:'#e0a800', icon:'🍝' },
    // Right-lane food: approach from x>490 (past right prep station)
    { id:6,  x:588, y:130, label:'Coffee',   points:30, color:'#7a5030', glow:'#4a2800', icon:'☕' },
    // Right counter section (x=480–780, y=240)
    { id:7,  x:490, y:240, label:'Muffin',   points:60, color:'#c4693a', glow:'#8b3010', icon:'🧁' },
    { id:8,  x:570, y:240, label:'Coffee',   points:30, color:'#7a5030', glow:'#4a2800', icon:'☕' },
    { id:9,  x:650, y:240, label:'Apple',    points:50, color:'#e83030', glow:'#aa0000', icon:'🍎' },
    { id:10, x:727, y:240, label:'Cookies',  points:45, color:'#e0b060', glow:'#b07820', icon:'🍪' },
    // Opportunistic items outside the kitchen — low points, no need to enter restricted area
    { id:11, x:385, y:548, label:'Chips',    points:40,  color:'#e8d040', glow:'#c0a800', icon:'🍟' },  // upper dining, mid-room
    { id:12, x:710, y:1105, label:'Soda',   points:5,  color:'#4488cc', glow:'#2255aa', icon:'🧃' },  // lobby vending machine
  ];

  const STEAMY_IDS = new Set([1, 2, 5, 8]);   // Pasta, Soup, deep-Pasta, Coffee

  // ── Hiding spots — interactive lockers/cabinets on wall edges ───────────────
  // Not collision walls. Player presses E when within 35px of center to hide.
  // Indexed by id; occupied=true while player is inside.

  const HIDE_SPOT_DEFS = [
    { id:0, x:22,  y:370,  w:24, h:50, label:'Locker'  },  // upper dining, left wall
    { id:1, x:754, y:370,  w:24, h:50, label:'Locker'  },  // upper dining, right wall
    { id:2, x:22,  y:720,  w:24, h:50, label:'Cabinet' },  // lower dining, left wall
    { id:3, x:754, y:720,  w:24, h:50, label:'Cabinet' },  // lower dining, right wall
    { id:4, x:22,  y:1120, w:24, h:50, label:'Closet'  },  // lobby, left wall
    { id:5, x:754, y:1165, w:24, h:50, label:'Closet'  },  // lobby exit corridor, right wall
    { id:6, x:22,  y:1265, w:24, h:50, label:'Closet'  },  // lobby exit corridor, left wall
    { id:7, x:754, y:200,  w:24, h:50, label:'Pantry'  },  // kitchen right wall (risky!)
  ];

  const LIGHT_FIXTURES = [
    { x:200, y:35  }, { x:400, y:35  }, { x:600, y:35  },   // kitchen
    { x:200, y:440 }, { x:400, y:440 }, { x:600, y:440 },   // upper dining
    { x:200, y:790 }, { x:400, y:790 }, { x:600, y:790 },   // lower dining
    { x:250, y:1090}, { x:550, y:1090},                     // lobby entrance
    { x:400, y:1210},                                        // lobby exit corridor
  ];

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    GameState.walls = WALL_DEFS.map(function (r) {
      return { x: r.x, y: r.y, w: r.w, h: r.h };
    });
    GameState.foods = FOOD_DEFS.map(function (f) {
      return { id: f.id, x: f.x, y: f.y, w: 24, h: 24,
               label: f.label, points: f.points,
               color: f.color, glow: f.glow, icon: f.icon, grabbed: false };
    });
    GameState.exitZone = { x: 340, y: 1350, w: 120, h: 28 };
    GameState.hideSpots = HIDE_SPOT_DEFS.map(function (s) {
      return { id: s.id, x: s.x, y: s.y, w: s.w, h: s.h, label: s.label, occupied: false };
    });
    GameState.lights = LIGHT_FIXTURES.slice();
    _particles = [];
  }

  function reset() {
    GameState.foods.forEach(function (f) { f.grabbed = false; });
    GameState.hideSpots.forEach(function (s) { s.occupied = false; });
    _particles = [];
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  function draw(ctx) {
    _time++;
    _tickParticles();
    _spawnAmbientDust();
    _drawFloor(ctx);
    _drawWalls(ctx);
    _drawLightPools(ctx);
    _drawHeatLampGlow(ctx);
    _drawCounters(ctx);
    _drawDividers(ctx);
    _drawLobbyInnerWall(ctx);
    _drawTables(ctx);
    _drawColumns(ctx);
    _drawWallStubs(ctx);
    _drawPrepStations(ctx);
    _drawKitchenShelves(ctx);
    _drawKitchenIsland(ctx);
    _drawBenches(ctx);
    _drawHideSpots(ctx);
    _drawFoods(ctx);
    _drawExit(ctx);
    _drawParticles(ctx);
    _drawVignette(ctx);
  }

  // ── Floor ───────────────────────────────────────────────────────────────────
  // Viewport-culled tile drawing so we don't draw 600+ off-screen tiles.

  function _drawFloor(ctx) {
    var TW = 50, TH = 50;
    var cam = GameState.cam;

    // Only draw tiles currently on screen (+ one tile buffer)
    var startY = Math.floor(cam.y / TH) * TH;
    var endY   = startY + GameState.height + TH;

    for (var ty = startY; ty < endY; ty += TH) {
      for (var tx = 0; tx < 800; tx += TW) {
        var alt = ((tx / TW) + (ty / TH)) % 2 === 0;
        ctx.fillStyle = alt ? '#ddd0bc' : '#ccc0a8';
        ctx.fillRect(tx + 1, ty + 1, TW - 2, TH - 2);
        var g = ctx.createLinearGradient(tx, ty, tx + TW, ty + TH);
        g.addColorStop(0,   'rgba(255,255,255,0.14)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.03)');
        g.addColorStop(1,   'rgba(0,0,0,0.08)');
        ctx.fillStyle = g;
        ctx.fillRect(tx + 1, ty + 1, TW - 2, TH - 2);
      }
    }

    // Tile grid lines — only in visible range
    ctx.strokeStyle = '#9a8c7c'; ctx.lineWidth = 1;
    for (var gx = 0; gx <= 800; gx += TW) {
      ctx.beginPath(); ctx.moveTo(gx, startY); ctx.lineTo(gx, endY); ctx.stroke();
    }
    for (var gy = startY; gy <= endY; gy += TH) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(800, gy); ctx.stroke();
    }

    // Kitchen zone — warm orange tint (back of house, restricted)
    var kt = ctx.createLinearGradient(0, 20, 0, 270);
    kt.addColorStop(0,   'rgba(255,190,80,0.13)');
    kt.addColorStop(1,   'rgba(255,190,80,0.04)');
    ctx.fillStyle = kt;
    ctx.fillRect(20, 20, 760, 250);

    // Lobby zone — cool institutional tint (entrance feel)
    var lt = ctx.createLinearGradient(0, 1000, 0, 1380);
    lt.addColorStop(0,   'rgba(100,130,200,0.08)');
    lt.addColorStop(1,   'rgba(100,130,200,0.04)');
    ctx.fillStyle = lt;
    ctx.fillRect(20, 1000, 760, 380);
  }

  // ── Outer walls ─────────────────────────────────────────────────────────────

  function _drawWalls(ctx) {
    [WALL_DEFS[0], WALL_DEFS[1], WALL_DEFS[2], WALL_DEFS[3]].forEach(function (r) {
      var g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      g.addColorStop(0, '#1e1208'); g.addColorStop(1, '#2e1e10');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    // Inner trim lines along each wall
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(20, 16, 760, 4);      // top inner trim
    ctx.fillRect(20, 1380, 760, 4);    // bottom inner trim
    ctx.fillRect(16, 20, 4, 1360);     // left inner trim
    ctx.fillRect(780, 20, 4, 1360);    // right inner trim

    // Top wall ceiling stripe
    ctx.fillStyle = '#f0f0e0'; ctx.fillRect(22, 1, 756, 3);

    // "DINING SERVICES" banner on the kitchen back wall (top)
    _drawBanner(ctx, 400, 44, 'DINING  SERVICES');

    // "ENTRANCE" banner on the lobby front wall (bottom)
    _drawBanner(ctx, 400, 1364, 'ENTRANCE');
  }

  function _drawBanner(ctx, cx, cy, text) {
    var w = 280, h = 18;
    var g = ctx.createLinearGradient(cx - w/2, cy, cx + w/2, cy);
    g.addColorStop(0, '#1a0a00'); g.addColorStop(0.1, '#3a2200');
    g.addColorStop(0.5, '#4a3010'); g.addColorStop(0.9, '#3a2200'); g.addColorStop(1, '#1a0a00');
    ctx.fillStyle = g; ctx.fillRect(cx - w/2, cy - h/2, w, h);
    ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1; ctx.strokeRect(cx - w/2, cy - h/2, w, h);
    ctx.fillStyle = '#f0c840'; ctx.font = 'bold 10px serif'; ctx.textAlign = 'center';
    ctx.letterSpacing = '3px'; ctx.fillText(text, cx, cy + 4);
    ctx.textAlign = 'left'; ctx.letterSpacing = '0px';
  }

  // ── Light pools ─────────────────────────────────────────────────────────────

  function _drawLightPools(ctx) {
    var cam = GameState.cam;
    LIGHT_FIXTURES.forEach(function (lf) {
      // Skip fixtures far off-screen for performance
      if (lf.y + 180 < cam.y || lf.y - 60 > cam.y + 600) return;

      ctx.fillStyle = '#e8e8d8'; ctx.fillRect(lf.x - 28, lf.y, 56, 8);
      ctx.fillStyle = '#fffff0'; ctx.fillRect(lf.x - 22, lf.y + 2, 44, 4);
      var poolY = lf.y + 100;
      var pulse = 0.85 + 0.15 * Math.sin(_time * 0.02 + lf.x * 0.01);
      var g = ctx.createRadialGradient(lf.x, poolY, 0, lf.x, poolY, 120);
      g.addColorStop(0,   'rgba(255,245,200,' + (0.22 * pulse) + ')');
      g.addColorStop(0.6, 'rgba(255,235,160,' + (0.06 * pulse) + ')');
      g.addColorStop(1,   'rgba(255,220,120,0)');
      ctx.fillStyle = g; ctx.fillRect(lf.x - 120, poolY - 100, 240, 220);
    });
  }

  // ── Heat lamp glow (above serving counters) ───────────────────────────────

  function _drawHeatLampGlow(ctx) {
    [WALL_DEFS[4], WALL_DEFS[5]].forEach(function (r) {
      var pulse = 0.7 + 0.3 * Math.sin(_time * 0.04);
      var g = ctx.createLinearGradient(r.x, r.y - 30, r.x, r.y + r.h);
      g.addColorStop(0, 'rgba(255,80,0,0)');
      g.addColorStop(0.5, 'rgba(255,100,10,' + (0.09 * pulse) + ')');
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y - 30, r.w, r.h + 30);
    });
  }

  // ── Serving counter ───────────────────────────────────────────────────────

  function _drawCounters(ctx) {
    [WALL_DEFS[4], WALL_DEFS[5]].forEach(function (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      g.addColorStop(0, '#c8d8e0'); g.addColorStop(0.15, '#e8f0f4');
      g.addColorStop(0.4, '#b8c8d0'); g.addColorStop(0.7, '#a0b0b8'); g.addColorStop(1, '#889098');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
      for (var sy = r.y + 4; sy < r.y + r.h - 4; sy += 5) {
        ctx.beginPath(); ctx.moveTo(r.x+4, sy); ctx.lineTo(r.x+r.w-4, sy); ctx.stroke();
      }
      ctx.fillStyle = '#708090'; ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#506070'; ctx.fillRect(r.x, r.y+r.h-2, r.w, 2);
      // Glass sneeze guard above counter
      var glassH = 16;
      var glassG = ctx.createLinearGradient(r.x, r.y-glassH, r.x, r.y);
      glassG.addColorStop(0, 'rgba(160,210,240,0.06)'); glassG.addColorStop(1, 'rgba(160,210,240,0.20)');
      ctx.fillStyle = glassG; ctx.fillRect(r.x, r.y-glassH, r.w, glassH);
      ctx.strokeStyle = 'rgba(200,240,255,0.5)'; ctx.lineWidth = 1;
      ctx.strokeRect(r.x, r.y-glassH, r.w, glassH);
      ctx.fillStyle = '#607080'; ctx.fillRect(r.x, r.y+r.h, r.w, 4);
    });
    ctx.fillStyle = 'rgba(255,200,80,0.55)';
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('▼  PASS-THROUGH  ▼', 400, 266);
    ctx.textAlign = 'left';
  }

  // ── Zone divider walls ───────────────────────────────────────────────────────

  function _drawDividers(ctx) {
    // Divider 1 — between upper and lower dining (gap x=360–440)
    [WALL_DEFS[6], WALL_DEFS[7]].forEach(function (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
      g.addColorStop(0, '#8a7a6a'); g.addColorStop(1, '#6a5a4a');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(r.x, r.y+r.h-4, r.w, 4);
    });
    ctx.fillStyle = 'rgba(200,180,140,0.55)';
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PASSAGE', 400, 616);
    ctx.textAlign = 'left';

    // Divider 2 — lobby separator (gap x=280–520, wide and easy to cross)
    [WALL_DEFS[8], WALL_DEFS[9]].forEach(function (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
      g.addColorStop(0, '#7a8a9a'); g.addColorStop(1, '#5a6a7a');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#2a3a4a'; ctx.fillRect(r.x, r.y+r.h-4, r.w, 4);
    });
    ctx.fillStyle = 'rgba(160,200,255,0.45)';
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('LOBBY ENTRANCE  ▼', 400, 975);
    ctx.textAlign = 'left';
  }

  // ── Lobby inner security wall ─────────────────────────────────────────────────

  function _drawLobbyInnerWall(ctx) {
    var cam = GameState.cam;
    [WALL_DEFS[25], WALL_DEFS[26]].forEach(function (r) {
      if (r.y + r.h < cam.y || r.y > cam.y + 600) return;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
      g.addColorStop(0, '#6a7a8a'); g.addColorStop(1, '#4a5a6a');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#2a3a4a'; ctx.fillRect(r.x, r.y+r.h-3, r.w, 3);
      // Yellow security stripe
      ctx.setLineDash([8, 5]);
      ctx.strokeStyle = 'rgba(255,220,50,0.40)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x+4, r.y+r.h/2); ctx.lineTo(r.x+r.w-4, r.y+r.h/2); ctx.stroke();
      ctx.setLineDash([]);
    });
    if (WALL_DEFS[25].y + WALL_DEFS[25].h >= cam.y && WALL_DEFS[25].y <= cam.y + 600) {
      ctx.fillStyle = 'rgba(255,220,80,0.55)';
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('SECURITY  CHECKPOINT  ▼', 400, WALL_DEFS[25].y - 6);
      ctx.textAlign = 'left';
    }
  }

  // ── Dining tables ────────────────────────────────────────────────────────────

  function _drawTables(ctx) {
    // Upper dining tables [10–12], lower dining tables + centre post [13–15]
    WALL_DEFS.slice(10, 16).forEach(function (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; _rr(ctx, r.x+5, r.y+5, r.w, r.h, 6); ctx.fill();
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
      g.addColorStop(0, '#5c3820'); g.addColorStop(0.3, '#3e2210'); g.addColorStop(1, '#281508');
      ctx.fillStyle = g; _rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
      // Wood grain
      ctx.save(); ctx.beginPath(); _rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.clip();
      ctx.strokeStyle = 'rgba(255,200,100,0.06)'; ctx.lineWidth = 2;
      for (var gl = r.x - 10; gl < r.x + r.w + 10; gl += 14) {
        ctx.beginPath();
        ctx.moveTo(gl, r.y);
        ctx.bezierCurveTo(gl+3, r.y+r.h*0.3, gl-2, r.y+r.h*0.7, gl+1, r.y+r.h);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(180,120,60,0.45)'; ctx.lineWidth = 1.5;
      _rr(ctx, r.x+1, r.y+1, r.w-2, r.h-2, 5); ctx.stroke();
      // Chairs (skip narrow centre post)
      if (r.w >= 60 && r.h >= 50) {
        [[r.x+10, r.y-12, 28, 10], [r.x+r.w-38, r.y-12, 28, 10],
         [r.x+10, r.y+r.h+2, 28, 10], [r.x+r.w-38, r.y+r.h+2, 28, 10]
        ].forEach(function (c) {
          _rr(ctx, c[0], c[1], c[2], c[3], 3);
          ctx.fillStyle = '#3a2010'; ctx.fill();
          ctx.strokeStyle = 'rgba(255,180,80,0.2)'; ctx.lineWidth = 1; ctx.stroke();
        });
      }
      var gloss = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h*0.4);
      gloss.addColorStop(0, 'rgba(255,255,255,0.10)'); gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss; _rr(ctx, r.x, r.y, r.w, r.h*0.4, 6); ctx.fill();
    });
  }

  // ── Kitchen prep stations ────────────────────────────────────────────────────

  function _drawPrepStations(ctx) {
    [WALL_DEFS[16], WALL_DEFS[17]].forEach(function (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
      g.addColorStop(0, '#d0dde0'); g.addColorStop(0.4, '#b0bfc5'); g.addColorStop(1, '#8090a0');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      // Horizontal brushed lines
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
      for (var sy = r.y + 5; sy < r.y + r.h - 4; sy += 6) {
        ctx.beginPath(); ctx.moveTo(r.x+4, sy); ctx.lineTo(r.x+r.w-4, sy); ctx.stroke();
      }
      ctx.fillStyle = '#607080'; ctx.fillRect(r.x, r.y, r.w, 4);
      ctx.fillStyle = '#405060'; ctx.fillRect(r.x, r.y+r.h-3, r.w, 3);
      ctx.strokeStyle = 'rgba(200,220,255,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(r.x+1, r.y+1, r.w-2, r.h-2);
    });
    // Labels
    ctx.fillStyle = 'rgba(180,210,240,0.5)';
    ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PREP', WALL_DEFS[16].x + WALL_DEFS[16].w/2, WALL_DEFS[16].y + WALL_DEFS[16].h/2 + 4);
    ctx.fillText('PREP', WALL_DEFS[17].x + WALL_DEFS[17].w/2, WALL_DEFS[17].y + WALL_DEFS[17].h/2 + 4);
    ctx.textAlign = 'left';
  }

  // ── Lobby benches ────────────────────────────────────────────────────────────

  function _drawBenches(ctx) {
    [WALL_DEFS[18], WALL_DEFS[19]].forEach(function (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
      // Metal frame
      ctx.fillStyle = '#888888'; ctx.fillRect(r.x, r.y, r.w, r.h);
      // Seat upholstery
      _rr(ctx, r.x+4, r.y+3, r.w-8, r.h-6, 4);
      var ug = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
      ug.addColorStop(0, '#7a6a9a'); ug.addColorStop(1, '#4a4060');
      ctx.fillStyle = ug; ctx.fill();
      // Seat highlight
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; _rr(ctx, r.x+4, r.y+3, r.w-8, (r.h-6)*0.4, 4); ctx.fill();
    });
  }

  // ── Kitchen central island ───────────────────────────────────────────────────

  function _drawKitchenIsland(ctx) {
    var r = WALL_DEFS[20];
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(r.x+4, r.y+4, r.w, r.h);
    var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
    g.addColorStop(0, '#c8d8e0'); g.addColorStop(0.4, '#a8b8c0'); g.addColorStop(1, '#889098');
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    for (var sy = r.y+5; sy < r.y+r.h-4; sy += 6) {
      ctx.beginPath(); ctx.moveTo(r.x+4, sy); ctx.lineTo(r.x+r.w-4, sy); ctx.stroke();
    }
    ctx.fillStyle = '#607080'; ctx.fillRect(r.x, r.y, r.w, 4);
    ctx.fillStyle = '#405060'; ctx.fillRect(r.x, r.y+r.h-3, r.w, 3);
    ctx.strokeStyle = 'rgba(200,240,255,0.28)'; ctx.lineWidth = 1;
    ctx.strokeRect(r.x+1, r.y+1, r.w-2, r.h-2);
    ctx.fillStyle = 'rgba(180,220,250,0.5)';
    ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PREP ISLAND', r.x + r.w/2, r.y + r.h/2 + 4);
    ctx.textAlign = 'left';
  }

  // ── Tactical cover columns ────────────────────────────────────────────────────

  function _drawColumns(ctx) {
    [WALL_DEFS[21], WALL_DEFS[22], WALL_DEFS[23], WALL_DEFS[24]].forEach(function (r) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x+4, r.y+4, r.w, r.h);
      // Concrete body
      var g = ctx.createLinearGradient(r.x, r.y, r.x+r.w, r.y);
      g.addColorStop(0, '#9a9080'); g.addColorStop(0.5, '#b0a898'); g.addColorStop(1, '#7a7068');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      // Top cap
      ctx.fillStyle = '#c0b8a8'; ctx.fillRect(r.x-2, r.y, r.w+4, 5);
      ctx.fillStyle = '#c0b8a8'; ctx.fillRect(r.x-2, r.y+r.h-5, r.w+4, 5);
      // Vertical seam
      ctx.strokeStyle = 'rgba(80,70,60,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(r.x+r.w/2, r.y+5); ctx.lineTo(r.x+r.w/2, r.y+r.h-5); ctx.stroke();
    });
  }

  // ── Dining zone wall stubs (partition walls creating cover lanes) ─────────────

  function _drawWallStubs(ctx) {
    var cam = GameState.cam;
    [WALL_DEFS[27], WALL_DEFS[28], WALL_DEFS[29], WALL_DEFS[30]].forEach(function (r) {
      if (r.y + r.h < cam.y || r.y > cam.y + 600) return;
      var isLeft = r.x < 400;
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
      // Body gradient
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
      g.addColorStop(0, '#8a8070'); g.addColorStop(1, '#5a5040');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      // Top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(r.x, r.y, r.w, 2);
      // Outline
      ctx.strokeStyle = 'rgba(120,110,90,0.5)'; ctx.lineWidth = 1;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      // End cap (darker edge on the open side)
      ctx.fillStyle = '#6a5a40';
      if (isLeft) ctx.fillRect(r.x + r.w - 4, r.y, 4, r.h);
      else        ctx.fillRect(r.x, r.y, 4, r.h);
    });
  }

  // ── Kitchen wall shelves ──────────────────────────────────────────────────────

  function _drawKitchenShelves(ctx) {
    var cam = GameState.cam;
    [WALL_DEFS[31], WALL_DEFS[32]].forEach(function (r) {
      if (r.y + r.h < cam.y || r.y > cam.y + 600) return;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(r.x+3, r.y+3, r.w, r.h);
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y+r.h);
      g.addColorStop(0, '#b0c0c8'); g.addColorStop(0.5, '#909aa0'); g.addColorStop(1, '#606870');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      // Vertical shelf dividers
      ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1;
      for (var sx = r.x + 14; sx < r.x + r.w - 4; sx += 14) {
        ctx.beginPath(); ctx.moveTo(sx, r.y + 2); ctx.lineTo(sx, r.y + r.h - 2); ctx.stroke();
      }
      ctx.fillStyle = '#506070'; ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#405060'; ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);
      ctx.strokeStyle = 'rgba(180,210,240,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    });
  }

  // ── Hiding spots (lockers / cabinets / closets) ───────────────────────────────

  function _drawHideSpots(ctx) {
    if (!GameState.hideSpots) return;
    var cam = GameState.cam;
    GameState.hideSpots.forEach(function (spot) {
      // Viewport cull
      if (spot.y + spot.h < cam.y || spot.y > cam.y + 600) return;

      var isLeft = spot.x < 400;
      var ox     = isLeft ? 20 : 756;  // draw flush with inner wall edge
      var oy     = spot.y;
      var ow     = spot.w;
      var oh     = spot.h;
      var occ    = spot.occupied;

      // Frame / body
      ctx.fillStyle = occ ? '#1a2a1a' : '#222232';
      ctx.fillRect(ox, oy, ow, oh);

      // Inset door panel
      ctx.fillStyle = occ ? 'rgba(60,180,60,0.18)' : 'rgba(80,110,150,0.20)';
      ctx.fillRect(ox+3, oy+5, ow-6, oh-10);

      // Door outline
      ctx.strokeStyle = occ ? '#44aa44' : '#445566';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox+3, oy+5, ow-6, oh-10);

      // Handle knob
      var hx = isLeft ? ox+ow-5 : ox+4;
      var hy = oy + oh/2;
      ctx.beginPath(); ctx.arc(hx, hy, 2.5, 0, Math.PI*2);
      ctx.fillStyle = '#aaaaaa'; ctx.fill();

      // Outer border
      ctx.strokeStyle = occ ? '#336633' : '#334455';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, ow, oh);

      // Pulse glow when unoccupied (invites player to interact)
      if (!occ) {
        var pulse = 0.3 + 0.25 * Math.sin(_time * 0.05 + spot.id * 1.2);
        ctx.strokeStyle = 'rgba(100,160,230,' + pulse + ')';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox-2, oy-2, ow+4, oh+4);
      } else {
        // Occupied glow
        var gpulse = 0.4 + 0.3 * Math.sin(_time * 0.08);
        ctx.strokeStyle = 'rgba(60,220,60,' + gpulse + ')';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ox-2, oy-2, ow+4, oh+4);
      }

      // Label (tiny sideways text on the door)
      ctx.fillStyle = occ ? '#55cc55' : '#667788';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(ox + ow/2, oy + oh/2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(spot.label.toUpperCase(), 0, 0);
      ctx.restore();
      ctx.textAlign = 'left';

      // "E" prompt near unoccupied spots (only when visible — don't track player here)
      if (!occ) {
        ctx.fillStyle = 'rgba(200,230,255,0.55)';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[E]', ox + ow/2 + (isLeft ? 18 : -18), oy + oh/2 + 4);
        ctx.textAlign = 'left';
      }
    });
  }

  // ── Food items ───────────────────────────────────────────────────────────────

  function _drawFoods(ctx) {
    GameState.foods.forEach(function (food) {
      if (food.grabbed) return;
      var bob = Math.sin(_time * 0.05 + food.id * 0.9) * 2.5;
      var fy  = food.y + bob;
      var cx  = food.x + food.w / 2;
      var cy  = fy + food.h / 2;
      var pulse = 0.7 + 0.3 * Math.sin(_time * 0.06 + food.id * 0.7);
      // Halo
      var halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      halo.addColorStop(0,   hexAlpha(food.glow, 0.5 * pulse));
      halo.addColorStop(0.6, hexAlpha(food.glow, 0.15 * pulse));
      halo.addColorStop(1,   hexAlpha(food.glow, 0));
      ctx.fillStyle = halo; ctx.fillRect(cx-26, cy-26, 52, 52);
      // Floor reflection
      ctx.beginPath(); ctx.ellipse(cx, fy+food.h+4, 18, 5, 0, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      ctx.strokeStyle = 'rgba(200,200,200,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      // Body
      _rr(ctx, food.x, fy, food.w, food.h, 6);
      var bg = ctx.createLinearGradient(food.x, fy, food.x, fy+food.h);
      bg.addColorStop(0, _lighten(food.color, 40)); bg.addColorStop(1, food.color);
      ctx.fillStyle = bg; ctx.fill();
      // Gloss
      _rr(ctx, food.x+2, fy+2, food.w-4, food.h*0.45, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
      // Outline
      _rr(ctx, food.x, fy, food.w, food.h, 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
      // Icon
      ctx.font = '15px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(food.icon, cx, cy+1); ctx.textBaseline = 'alphabetic';
      // Label
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 3;
      ctx.fillText(food.label, cx, fy+food.h+12); ctx.shadowBlur = 0;
      // Points badge
      _drawPointsBadge(ctx, food.x+food.w-1, fy-1, food.points);
      ctx.textAlign = 'left';
      // Steam
      if (STEAMY_IDS.has(food.id)) _spawnSteam(food.x+12, fy);
    });
  }

  function _drawPointsBadge(ctx, x, y, points) {
    var bw = 20, bh = 11;
    _rr(ctx, x-bw, y, bw, bh, 3);
    ctx.fillStyle = '#ffcc00'; ctx.fill();
    ctx.fillStyle = '#3a1a00'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(points + 'pt', x-bw/2, y+8); ctx.textAlign = 'left';
  }

  // ── Exit zone ────────────────────────────────────────────────────────────────

  function _drawExit(ctx) {
    var ez = GameState.exitZone;
    var pulse = 0.6 + 0.4 * Math.sin(_time * 0.07);
    var cx = ez.x + ez.w/2, cy = ez.y + ez.h/2;
    var floorGlow = ctx.createRadialGradient(cx, cy-30, 0, cx, cy-30, 90);
    floorGlow.addColorStop(0, 'rgba(0,255,120,' + (0.25*pulse) + ')');
    floorGlow.addColorStop(1, 'rgba(0,255,120,0)');
    ctx.fillStyle = floorGlow; ctx.fillRect(cx-90, cy-100, 180, 120);
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 20 + 10*pulse;
    _rr(ctx, ez.x-2, ez.y-2, ez.w+4, ez.h+4, 6);
    ctx.fillStyle = 'rgba(0,30,15,0.9)'; ctx.fill();
    ctx.strokeStyle = '#00cc66'; ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowBlur = 0;
    _rr(ctx, ez.x, ez.y, ez.w, ez.h, 5);
    var neon = ctx.createLinearGradient(ez.x, ez.y, ez.x, ez.y+ez.h);
    neon.addColorStop(0, 'rgba(0,255,120,' + (0.18*pulse) + ')');
    neon.addColorStop(1, 'rgba(0,180,80,'  + (0.10*pulse) + ')');
    ctx.fillStyle = neon; ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,140,' + (0.6+0.4*pulse) + ')';
    ctx.lineWidth = 1.5; ctx.setLineDash([5,4]); ctx.lineDashOffset = -(_time*0.6 % 9);
    _rr(ctx, ez.x, ez.y, ez.w, ez.h, 5); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,255,140,' + (0.5+0.5*Math.sin(_time*0.12)) + ')';
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▼ EXIT ▼', cx, cy+5);
    // Sign above exit
    ctx.fillStyle = 'rgba(160,255,200,0.6)';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('← FRONT DOOR →', cx, ez.y - 10);
    ctx.textAlign = 'left';
  }

  // ── Particles ────────────────────────────────────────────────────────────────

  function _spawnAmbientDust() {
    if (_particles.length >= _MAX_PARTICLES || Math.random() > 0.25) return;
    var cam = GameState.cam;
    // Only spawn near on-screen light fixtures
    var visible = LIGHT_FIXTURES.filter(function (lf) {
      return lf.y > cam.y - 60 && lf.y < cam.y + 660;
    });
    if (!visible.length) return;
    var lf = visible[Math.floor(Math.random() * visible.length)];
    _particles.push({ type:'dust', x:lf.x+(Math.random()-0.5)*70, y:lf.y+10+Math.random()*40,
      vx:(Math.random()-0.5)*0.25, vy:-0.15-Math.random()*0.35,
      life:1.0, fade:0.004+Math.random()*0.006, r:0.8+Math.random()*1.5 });
  }

  function _spawnSteam(x, y) {
    if (_particles.length >= _MAX_PARTICLES || Math.random() > 0.15) return;
    _particles.push({ type:'steam', x:x+(Math.random()-0.5)*8, y:y,
      vx:(Math.random()-0.5)*0.4, vy:-0.5-Math.random()*0.6,
      life:1.0, fade:0.015+Math.random()*0.015, r:1.5+Math.random()*2 });
  }

  function _tickParticles() {
    for (var i = _particles.length-1; i >= 0; i--) {
      var p = _particles[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.life -= p.fade;
      if (p.life <= 0) _particles.splice(i, 1);
    }
  }

  function _drawParticles(ctx) {
    _particles.forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.type === 'dust'
        ? 'rgba(255,240,200,' + (p.life*0.55) + ')'
        : 'rgba(220,220,220,' + (p.life*0.35) + ')';
      ctx.fill();
    });
  }

  // ── Vignette — camera-aware so it always covers the viewport ─────────────────

  function _drawVignette(ctx) {
    var cam = GameState.cam;
    var vcx = cam.x + 400;   // viewport centre in world coords
    var vcy = cam.y + 300;
    var g = ctx.createRadialGradient(vcx, vcy, 180, vcx, vcy, 520);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = g; ctx.fillRect(cam.x, cam.y, 800, 600);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
  }

  function hexAlpha(hex, a) {
    return 'rgba(' + parseInt(hex.slice(1,3),16) + ',' + parseInt(hex.slice(3,5),16) + ',' + parseInt(hex.slice(5,7),16) + ',' + a + ')';
  }

  function _lighten(hex, amt) {
    return 'rgb(' + Math.min(255,parseInt(hex.slice(1,3),16)+amt) + ',' + Math.min(255,parseInt(hex.slice(3,5),16)+amt) + ',' + Math.min(255,parseInt(hex.slice(5,7),16)+amt) + ')';
  }

  return { init: init, draw: draw, reset: reset };

})();
