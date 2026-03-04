// Module 1 — UI, HUD & Screens
// Owns: HUD overlay, start/gameover/win screens, button clicks, sound cues.

window.UI = (function () {
  // Active button rects for click detection — updated each draw
  const btns = {};
  let frame = 0;

  // ─── Sound ────────────────────────────────────────────────────────────────
  // Optional. Wrap in try/catch so missing files never crash the game.
  let lastDetection = 0;

  function playSound(src) {
    try {
      const a = new Audio(src);
      a.volume = 0.4;
      a.play();
    } catch (_) {}
  }

  function checkSoundCues() {
    const d = GameState.detection;
    if (d >= 50 && lastDetection < 50) playSound('assets/sounds/alert.wav');
    lastDetection = d;
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    GameState.canvas.addEventListener('mousedown', (e) => {
      const rect = GameState.canvas.getBoundingClientRect();
      handleClick(e.clientX - rect.left, e.clientY - rect.top);
    });
  }

  function handleClick(mx, my) {
    const phase = GameState.phase;
    if (phase === 'start'    && hit(mx, my, btns.start)) { Engine.reset(); GameState.phase = 'playing'; }
    if (phase === 'gameover' && hit(mx, my, btns.retry)) { Engine.reset(); GameState.phase = 'playing'; }
    if (phase === 'win'      && hit(mx, my, btns.next))  { GameState.round++; Engine.reset(); GameState.phase = 'playing'; }
  }

  function hit(mx, my, r) {
    return r && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────

  function draw(ctx) {
    frame++;
    const phase = GameState.phase;

    if (phase === 'playing') {
      checkSoundCues();
      drawHUD(ctx);
    } else if (phase === 'start') {
      drawStartScreen(ctx);
    } else if (phase === 'gameover') {
      drawGameOverScreen(ctx);
    } else if (phase === 'win') {
      drawWinScreen(ctx);
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function drawHUD(ctx) {
    const gs = GameState;

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + gs.score, 20, 24);

    // Round
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('Round ' + gs.round, 20, 44);

    // Inventory count (center)
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gs.player.inventory.length + ' item' + (gs.player.inventory.length !== 1 ? 's' : ''), 400, 24);

    // Detection meter
    const mx = 578, my = 28, mw = 202, mh = 18;
    const pct = gs.detection / 100;

    // "BUSTED" label — flashes red when danger zone
    const flash = gs.detection > 80 && (frame % 30) < 15;
    ctx.fillStyle = flash ? '#ff4444' : '#cccccc';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('BUSTED', 780, my - 4);

    // Meter background
    ctx.fillStyle = '#333333';
    ctx.fillRect(mx, my, mw, mh);

    // Meter fill
    ctx.fillStyle = pct < 0.5 ? '#33cc33' : pct < 0.8 ? '#ff9900' : '#cc3300';
    ctx.fillRect(mx, my, mw * pct, mh);

    // Meter border
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);

    ctx.textAlign = 'left'; // reset
  }

  // ─── Screens ──────────────────────────────────────────────────────────────

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  function button(ctx, label, x, y, w, h, bg, key) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 5);
    btns[key] = { x, y, w, h };
  }

  function drawStartScreen(ctx) {
    const px = 160, py = 120, pw = 480, ph = 360;
    panel(ctx, px, py, pw, ph);
    const cx = px + pw / 2;

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('MEAL PLAN ZERO', cx, py + 60);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px monospace';
    ctx.fillText('Your meal plan ran out.', cx, py + 105);
    ctx.fillText("You're hungry.", cx, py + 125);
    ctx.fillText('The dining hall is open.', cx, py + 145);

    button(ctx, '[ START GAME ]', cx - 90, py + 172, 180, 36, '#336699', 'start');

    ctx.fillStyle = '#888888';
    ctx.font = '11px monospace';
    ctx.fillText('WASD — Move', cx, py + 243);
    ctx.fillText('Shift — Crouch  (harder to detect)', cx, py + 261);
    ctx.fillText('E — Grab food', cx, py + 279);
    ctx.fillText('Reach the EXIT to escape', cx, py + 297);

    ctx.textAlign = 'left';
  }

  function drawGameOverScreen(ctx) {
    const gs = GameState;
    const px = 190, py = 170, pw = 420, ph = 260;
    panel(ctx, px, py, pw, ph);
    const cx = px + pw / 2;

    ctx.textAlign = 'center';

    ctx.fillStyle = '#cc3300';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CAUGHT.', cx, py + 52);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px monospace';
    ctx.fillText('Banned from the dining hall.', cx, py + 92);
    ctx.fillText('Also still hungry.', cx, py + 112);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText('Food stolen: ' + gs.player.inventory.length + ' item' + (gs.player.inventory.length !== 1 ? 's' : ''), cx, py + 148);
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Score: ' + gs.score + ' pts', cx, py + 172);

    button(ctx, '[ TRY AGAIN ]', cx - 80, py + 196, 160, 36, '#993300', 'retry');

    ctx.textAlign = 'left';
  }

  function drawWinScreen(ctx) {
    const gs = GameState;
    const px = 190, py = 170, pw = 420, ph = 260;
    panel(ctx, px, py, pw, ph);
    const cx = px + pw / 2;

    ctx.textAlign = 'center';

    ctx.fillStyle = '#33cc66';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('ESCAPED.', cx, py + 52);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px monospace';
    ctx.fillText('Round ' + gs.round + ' complete.', cx, py + 92);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText('Food stolen: ' + gs.player.inventory.length + ' item' + (gs.player.inventory.length !== 1 ? 's' : ''), cx, py + 132);
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Score: ' + gs.score + ' pts', cx, py + 156);

    button(ctx, '[ NEXT ROUND ]', cx - 85, py + 196, 170, 36, '#336633', 'next');

    ctx.textAlign = 'left';
  }

  return { init, draw };
})();
