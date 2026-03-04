// Module 2 — Map & Dining Hall
// Owns: dining hall layout, wall/food data, rendering.

window.Map = (function () {

  // ─── Data definitions ────────────────────────────────────────────────────

  const WALL_DEFS = [
    // Outer walls
    { x: 0,   y: 0,   w: 800, h: 20  },  // top
    { x: 0,   y: 580, w: 800, h: 20  },  // bottom
    { x: 0,   y: 0,   w: 20,  h: 600 },  // left
    { x: 780, y: 0,   w: 20,  h: 600 },  // right
    // Counters
    { x: 80,  y: 60,  w: 640, h: 40  },  // Counter A (top)
    { x: 80,  y: 280, w: 640, h: 40  },  // Counter B (middle)
    // Tables
    { x: 100, y: 160, w: 120, h: 60  },
    { x: 340, y: 160, w: 120, h: 60  },
    { x: 580, y: 160, w: 120, h: 60  },
    { x: 100, y: 380, w: 120, h: 60  },
    { x: 340, y: 380, w: 120, h: 60  },
    { x: 580, y: 380, w: 120, h: 60  },
  ];

  const FOOD_DEFS = [
    { id: 0,  x: 100, y: 95,  label: 'Pizza',    points: 50, color: '#e84040' },
    { id: 1,  x: 180, y: 95,  label: 'Pasta',    points: 45, color: '#f0c060' },
    { id: 2,  x: 260, y: 95,  label: 'Soup',     points: 35, color: '#e09030' },
    { id: 3,  x: 340, y: 95,  label: 'Sandwich', points: 30, color: '#c8a060' },
    { id: 4,  x: 420, y: 95,  label: 'Muffin',   points: 25, color: '#8b4513' },
    { id: 5,  x: 500, y: 95,  label: 'Coffee',   points: 20, color: '#4a2c0a' },
    { id: 6,  x: 580, y: 95,  label: 'Apple',    points: 10, color: '#cc2200' },
    { id: 7,  x: 660, y: 95,  label: 'Cookies',  points: 15, color: '#d4a050' },
    { id: 8,  x: 140, y: 315, label: 'Pizza',    points: 50, color: '#e84040' },
    { id: 9,  x: 300, y: 315, label: 'Pasta',    points: 45, color: '#f0c060' },
    { id: 10, x: 460, y: 315, label: 'Sandwich', points: 30, color: '#c8a060' },
    { id: 11, x: 620, y: 315, label: 'Coffee',   points: 20, color: '#4a2c0a' },
  ];

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    GameState.walls = WALL_DEFS.map(w => ({ ...w }));
    GameState.foods = FOOD_DEFS.map(f => ({
      id: f.id, x: f.x, y: f.y, w: 24, h: 24,
      label: f.label, points: f.points, color: f.color, grabbed: false,
    }));
    // exitZone already set in state.js
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────

  function draw(ctx) {
    drawFloor(ctx);
    drawWallsAndCounters(ctx);
    drawTables(ctx);
    drawExitZone(ctx);
    drawFood(ctx);
  }

  function drawFloor(ctx) {
    // Base floor color
    ctx.fillStyle = '#c8b89a';
    ctx.fillRect(0, 0, GameState.width, GameState.height);

    // Subtle tile grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    const tileSize = 40;
    for (let x = 0; x <= GameState.width; x += tileSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GameState.height); ctx.stroke();
    }
    for (let y = 0; y <= GameState.height; y += tileSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GameState.width, y); ctx.stroke();
    }
  }

  function drawWallsAndCounters(ctx) {
    // Outer walls (indices 0–3) and counters (4–5)
    for (let i = 0; i < 6; i++) {
      const w = WALL_DEFS[i];
      const isCounter = i >= 4;

      // Main fill
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(w.x, w.y, w.w, w.h);

      if (isCounter) {
        // Lighter top surface stripe
        ctx.fillStyle = '#6e5a48';
        ctx.fillRect(w.x, w.y, w.w, 8);
        // Counter label
        ctx.fillStyle = '#9a8a7a';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(i === 4 ? 'COUNTER A' : 'COUNTER B', w.x + w.w - 10, w.y + w.h / 2 + 4);
        ctx.textAlign = 'left';
      }
    }
  }

  function drawTables(ctx) {
    for (let i = 6; i < WALL_DEFS.length; i++) {
      const t = WALL_DEFS[i];
      // Table surface
      ctx.fillStyle = '#8b6f47';
      ctx.fillRect(t.x, t.y, t.w, t.h);
      // Inner inset detail
      ctx.strokeStyle = '#7a5e3a';
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x + 5, t.y + 5, t.w - 10, t.h - 10);
      // Subtle highlight on top edge
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(t.x, t.y, t.w, 4);
    }
  }

  function drawExitZone(ctx) {
    const ez = GameState.exitZone;
    // Glow effect
    ctx.fillStyle = 'rgba(0, 204, 102, 0.25)';
    ctx.fillRect(ez.x - 4, ez.y - 4, ez.w + 8, ez.h + 8);
    // Main zone
    ctx.fillStyle = '#00cc66';
    ctx.fillRect(ez.x, ez.y, ez.w, ez.h);
    // Label
    ctx.fillStyle = '#003322';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ez.x + ez.w / 2, ez.y + ez.h / 2 + 4);
    ctx.textAlign = 'left';
  }

  function drawFood(ctx) {
    for (const food of GameState.foods) {
      if (food.grabbed) continue;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(food.x + 2, food.y + 2, food.w, food.h);

      // Food square
      ctx.fillStyle = food.color;
      ctx.fillRect(food.x, food.y, food.w, food.h);

      // Highlight on top-left
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(food.x, food.y, food.w, 4);

      // Outline
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(food.x, food.y, food.w, food.h);

      // Label above
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(food.label, food.x + food.w / 2, food.y - 2);
    }
    ctx.textAlign = 'left';
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  function reset() {
    GameState.foods.forEach(f => { f.grabbed = false; });
  }

  return { init, draw, reset };
})();
