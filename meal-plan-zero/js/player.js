// Module 3 — Player Character
// STUB — replace this file with your team member's full implementation.
// This stub draws a placeholder dot so Module 1 can be tested independently.

window.Player = {
  init() {
    GameState.player.x = 388;
    GameState.player.y = 500;
    GameState.player.inventory = [];
    GameState.player.crouching = false;
  },

  update(_dt) {
    // Stub: no-op — Module 3 implements movement, collision, pickup, win
  },

  draw(ctx) {
    if (GameState.phase !== 'playing') return;
    const p = GameState.player;
    // Placeholder circle
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#3399ff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Stub label
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P3', p.x + p.width / 2, p.y + p.height / 2 + 3);
    ctx.textAlign = 'left';
  },

  reset() {
    this.init();
  },

  getHitbox() {
    const p = GameState.player;
    return { x: p.x, y: p.y, w: p.width, h: p.height };
  },

  detectionRadius() {
    return GameState.player.crouching ? 35 : 60;
  },
};
