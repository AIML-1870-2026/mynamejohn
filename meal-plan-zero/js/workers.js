// Module 4 — Worker AI & Detection
// STUB — replace this file with your team member's full implementation.
// This stub does nothing so Module 1 can be tested independently.

window.Workers = {
  init() {
    GameState.workers = [];
    // Module 4 will populate with 3 worker objects + patrol routes
  },

  update(_dt) {
    // Stub: no-op — Module 4 implements patrol AI, vision cones, detection meter
  },

  draw(ctx) {
    if (GameState.phase !== 'playing') return;
    // Stub label
    ctx.fillStyle = 'rgba(204,51,0,0.4)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ Workers stub — Module 4 replaces this ]', 400, 320);
    ctx.textAlign = 'left';
  },

  reset(_round) {
    // Module 4 uses round number for difficulty scaling
    GameState.workers = [];
    this.init();
  },
};
