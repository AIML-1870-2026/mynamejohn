// Module 2 — Map & Dining Hall
// STUB — replace this file with your team member's full implementation.
// This stub draws a minimal floor so Module 1 can be tested independently.

window.Map = {
  init() {
    // Minimal walls so player has something to collide with
    GameState.walls = [
      { x: 0,   y: 0,   w: 800, h: 20  }, // top
      { x: 0,   y: 580, w: 800, h: 20  }, // bottom
      { x: 0,   y: 0,   w: 20,  h: 600 }, // left
      { x: 780, y: 0,   w: 20,  h: 600 }, // right
    ];
    GameState.foods = [];
    // exitZone already set in state.js
  },

  draw(ctx) {
    // Placeholder floor
    ctx.fillStyle = '#c8b89a';
    ctx.fillRect(0, 0, GameState.width, GameState.height);

    // Exit zone
    const ez = GameState.exitZone;
    ctx.fillStyle = '#00cc66';
    ctx.fillRect(ez.x, ez.y, ez.w, ez.h);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ez.x + ez.w / 2, ez.y + ez.h / 2 + 4);
    ctx.textAlign = 'left';

    // Stub label
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ Map stub — Module 2 replaces this ]', 400, 300);
    ctx.textAlign = 'left';
  },

  reset() {
    GameState.foods.forEach(f => { f.grabbed = false; });
  },
};
