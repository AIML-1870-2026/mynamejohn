// Module 1 — Core Engine & Game Loop
// Owns: canvas setup, input, RAF loop, phase transitions, module orchestration.

window.Engine = (function () {
  let lastTime = 0;

  // ─── Main Loop ────────────────────────────────────────────────────────────

  function loop(timestamp) {
    if (lastTime === 0) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = timestamp;

    const gs = window.GameState;
    const ctx = gs.ctx;

    ctx.clearRect(0, 0, gs.width, gs.height);

    // Draw map every frame (visible behind all screens)
    Map.draw(ctx);

    // Update game logic only when playing
    if (gs.phase === 'playing') {
      Player.update(dt);
      Workers.update(dt);
    }

    // Draw game objects every frame
    Player.draw(ctx);
    Workers.draw(ctx);

    // UI always draws last (HUD or screen overlay on top)
    UI.draw(ctx);

    requestAnimationFrame(loop);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    const gs = window.GameState;

    // Create and mount canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.width = gs.width;
    canvas.height = gs.height;
    document.getElementById('game-container').appendChild(canvas);
    gs.canvas = canvas;
    gs.ctx = canvas.getContext('2d');

    // Keyboard input
    window.addEventListener('keydown', (e) => {
      gs.keys[e.key] = true;
      // Prevent page scrolling with game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      gs.keys[e.key] = false;
    });

    // Init all modules in order
    Map.init();
    Player.init();
    Workers.init();
    UI.init();

    requestAnimationFrame(loop);
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  // Called between rounds and on retry. Does NOT change phase or round number —
  // the UI button handlers set those before/after calling reset().

  function reset() {
    const gs = window.GameState;

    gs.score = 0;
    gs.detection = 0;
    gs.keys = {};
    gs.player.inventory = [];
    gs.player.x = 388;
    gs.player.y = 500;
    gs.player.crouching = false;

    Map.reset();
    Player.reset();
    Workers.reset(gs.round); // pass round for difficulty scaling
  }

  return { init, reset };
})();

window.addEventListener('load', () => Engine.init());
