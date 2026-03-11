// Module 1 — UI, HUD & Screens
// Owns: HUD overlay, start/gameover/win screens, button clicks, sound cues.

window.UI = (function () {
  const btns = {};
  let frame = 0;
  let lastDetection = 0;
  let lastPhase = 'start';
  let prevGrabFlash = 0;

  // ─── Web Audio Sound Engine ───────────────────────────────────────────────
  let _ac = null;
  function getAC() {
    if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
    return _ac;
  }

  function playNotes(notes) {
    try {
      const ac = getAC();
      let t = ac.currentTime;
      notes.forEach(({ f, d, v, type }) => {
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = type || 'square';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(v || 0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);
        osc.start(t);
        osc.stop(t + d + 0.01);
        t += d;
      });
    } catch (_) {}
  }

  const SOUNDS = {
    grab:     () => playNotes([{ f: 880,  d: 0.05 }, { f: 1320, d: 0.07 }]),
    alert:    () => playNotes([{ f: 330,  d: 0.13, type: 'sawtooth' }, { f: 495,  d: 0.15, type: 'sawtooth' }]),
    chase:    () => playNotes([{ f: 520,  d: 0.06 }, { f: 520, d: 0.06 }, { f: 520, d: 0.10 }]),
    gameover: () => playNotes([{ f: 400,  d: 0.18 }, { f: 300, d: 0.18 }, { f: 180, d: 0.35 }]),
    win:      () => playNotes([{ f: 523,  d: 0.09 }, { f: 659, d: 0.09 }, { f: 784, d: 0.15 }]),
  };

  function checkSoundCues() {
    const d   = GameState.detection;
    const phase = GameState.phase;
    const gf  = GameState.grabFlash || 0;

    if (phase === 'playing') {
      if (d >= 50 && lastDetection < 50) { SOUNDS.alert(); GameState.shakeFrames = 6;  GameState.shakeMag = 3; }
      if (d >= 80 && lastDetection < 80) { SOUNDS.chase(); GameState.shakeFrames = 12; GameState.shakeMag = 5; }
    }

    if (gf > 0 && prevGrabFlash === 0) SOUNDS.grab();

    if (phase === 'gameover' && lastPhase === 'playing') { SOUNDS.gameover(); GameState.shakeFrames = 20; GameState.shakeMag = 8; }
    if (phase === 'win'      && lastPhase === 'playing')   SOUNDS.win();

    lastDetection = d;
    lastPhase     = phase;
    prevGrabFlash = gf;
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    GameState.canvas.addEventListener('mousedown', (e) => {
      const rect = GameState.canvas.getBoundingClientRect();
      handleClick(e.clientX - rect.left, e.clientY - rect.top);
      // Resume AudioContext on first interaction (browser autoplay policy)
      try { getAC().resume(); } catch (_) {}
    });
  }

  function handleClick(mx, my) {
    const phase = GameState.phase;
    if (phase === 'start'    && hit(mx, my, btns.start)) {
      GameState.score = 0; GameState.round = 1;
      Engine.reset(); GameState.phase = 'playing';
    }
    if (phase === 'start'    && hit(mx, my, btns.help))  { GameState.phase = 'help'; }
    if (phase === 'help'     && hit(mx, my, btns.back))  { GameState.phase = 'start'; }
    if (phase === 'gameover' && hit(mx, my, btns.retry)) {
      GameState.score = 0; GameState.round = 1;
      Engine.reset(); GameState.phase = 'playing';
    }
    if (phase === 'win'      && hit(mx, my, btns.next))  { GameState.round++; Engine.reset(); GameState.phase = 'playing'; }
  }

  function hit(mx, my, r) {
    return r && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────

  function draw(ctx) {
    frame++;
    const phase = GameState.phase;
    checkSoundCues();

    if (phase === 'playing') {
      drawHUD(ctx);
    } else if (phase === 'start') {
      drawStartScreen(ctx);
    } else if (phase === 'help') {
      drawHelpScreen(ctx);
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

    // "BUSTED" label — flashes red in danger zone
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

    // Lives (hearts) — center-top beside item count
    const lives = gs.lives !== undefined ? gs.lives : 3;
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    const heartsStr = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives));
    ctx.fillStyle = lives > 1 ? '#ff4466' : (frame % 30 < 15 ? '#ff0000' : '#880000');
    ctx.fillText(heartsStr, 400, 44);

    // Hiding indicator
    if (gs.hiding) {
      const hpulse = 0.7 + 0.3 * Math.sin(frame * 0.12);
      ctx.fillStyle = `rgba(60,220,80,${hpulse})`;
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      ctx.fillText('● HIDING — press E or move to exit', 400, 580);
      ctx.textAlign = 'left';
    }

    // Stamina bar (Sprint resource — Space key)
    const stx = 578, sty = 54, stw = 202, sth = 10;
    const stPct = (gs.stamina || 0) / 100;
    ctx.fillStyle = '#888888'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'right';
    ctx.fillText('SPRINT', 575, sty + 9);
    ctx.fillStyle = '#333333'; ctx.fillRect(stx, sty, stw, sth);
    ctx.fillStyle = stPct > 0.3 ? '#4488ff' : '#ff4444';
    ctx.fillRect(stx, sty, stw * stPct, sth);
    ctx.strokeStyle = '#555555'; ctx.lineWidth = 1; ctx.strokeRect(stx, sty, stw, sth);

    // Distraction charges (Q key) — 3 dots, yellow=available grey=spent
    const charges = gs.distractions !== undefined ? gs.distractions : 3;
    ctx.fillStyle = '#888888'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'right';
    ctx.fillText('THROW  Q', 575, sty + 25);
    for (let i = 0; i < 3; i++) {
      const bx = stx + i * 16 + 6, by = sty + 18;
      ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < charges ? '#ffcc00' : '#333333'; ctx.fill();
      ctx.strokeStyle = '#666666'; ctx.lineWidth = 1; ctx.stroke();
    }

    ctx.textAlign = 'left'; // reset
  }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.90)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  function button(ctx, label, x, y, w, h, bg, key) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 5);
    btns[key] = { x, y, w, h };
  }

  // ─── Start Screen (3-column layout) ───────────────────────────────────────

  function _sectionHeader(ctx, label, x, y, w) {
    ctx.fillStyle = '#2255aa';
    ctx.fillRect(x, y, w, 22);
    ctx.strokeStyle = '#3366cc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + 15);
  }

  function drawStartScreen(ctx) {
    // Full backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, GameState.width, GameState.height);

    const pulse = 0.7 + 0.3 * Math.sin(frame * 0.06);

    // Title
    ctx.textAlign = 'center';
    ctx.shadowColor = `rgba(60,160,255,${pulse * 0.9})`;
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 42px monospace';
    ctx.fillText('MEAL PLAN ZERO', 400, 70);
    ctx.shadowBlur  = 0;

    // Tagline
    ctx.fillStyle = `rgba(80,220,140,${0.6 + 0.4 * pulse})`;
    ctx.font      = '13px monospace';
    ctx.fillText('sneak in.  grab food.  get out.', 400, 96);

    // High score (if set)
    const hs = GameState.highScore || 0;
    if (hs > 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '11px monospace';
      ctx.fillText('Best: ' + hs + ' pts', 400, 114);
    }

    // ── 3 columns ─────────────────────────────────────────────────────
    const colY  = 126, colH = 320, colPad = 12;
    const col1x = 20,  col1w = 228;
    const col2x = 260, col2w = 228;
    const col3x = 500, col3w = 280;

    // Column 1: Objective
    ctx.fillStyle = 'rgba(15,20,35,0.92)';
    ctx.fillRect(col1x, colY, col1w, colH);
    ctx.strokeStyle = '#2244aa'; ctx.lineWidth = 1;
    ctx.strokeRect(col1x, colY, col1w, colH);
    _sectionHeader(ctx, 'OBJECTIVE', col1x, colY, col1w);

    const objLines = [
      'Your meal plan ran out.',
      "You're hungry.",
      'The dining hall is open.',
      '',
      '① Sneak past workers',
      '② Grab food (E key)',
      '③ Reach the green EXIT',
      '   in the lobby.',
      '',
      '3 lives per run.',
      'Detection hits 100% =',
      '  lose a life.',
      'Lose all 3 = CAUGHT.',
    ];
    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    let oy = colY + 36;
    objLines.forEach(line => {
      ctx.fillStyle = line.startsWith('①') || line.startsWith('②') || line.startsWith('③')
        ? '#aaddff' : '#cccccc';
      ctx.fillText(line, col1x + colPad, oy);
      oy += 17;
    });

    // Column 2: Controls
    ctx.fillStyle = 'rgba(15,20,35,0.92)';
    ctx.fillRect(col2x, colY, col2w, colH);
    ctx.strokeStyle = '#2244aa'; ctx.lineWidth = 1;
    ctx.strokeRect(col2x, colY, col2w, colH);
    _sectionHeader(ctx, 'CONTROLS', col2x, colY, col2w);

    const controls = [
      ['WASD',     'Move'],
      ['Shift',    'Crouch (quiet)'],
      ['Space',    'Sprint (2×, loud)'],
      ['E',        'Grab food / Hide'],
      ['Q',        'Throw distraction'],
    ];
    let cy2 = colY + 38;
    controls.forEach(([key, desc]) => {
      ctx.fillStyle = '#ffdd88';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(key, col2x + colPad, cy2);
      ctx.fillStyle = '#bbbbbb';
      ctx.font = '11px monospace';
      ctx.fillText('→ ' + desc, col2x + colPad + 52, cy2);
      cy2 += 20;
    });

    cy2 += 8;
    ctx.fillStyle = '#555555'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
    ctx.fillText('──────────────────', col2x + colPad, cy2); cy2 += 16;
    ctx.fillStyle = '#aaaaaa'; ctx.font = 'bold 11px monospace';
    ctx.fillText('TIPS', col2x + colPad, cy2); cy2 += 16;
    const tips2 = [
      '? = suspicious',
      '! = alert — hide!',
      '!! = chase — run!',
      'Walls block vision',
      'Q buys you time',
    ];
    ctx.font = '10px monospace';
    tips2.forEach(t => {
      ctx.fillStyle = '#999999';
      ctx.fillText(t, col2x + colPad, cy2);
      cy2 += 15;
    });

    // Column 3: Detection legend
    ctx.fillStyle = 'rgba(15,20,35,0.92)';
    ctx.fillRect(col3x, colY, col3w, colH);
    ctx.strokeStyle = '#2244aa'; ctx.lineWidth = 1;
    ctx.strokeRect(col3x, colY, col3w, colH);
    _sectionHeader(ctx, 'DETECTION', col3x, colY, col3w);

    const levels = [
      ['#33cc33', '0–49%',   'Safe'],
      ['#ff9900', '50–79%',  'Suspicious'],
      ['#cc3300', '80–99%',  'DANGER'],
      ['#ff0000', '100%',    'Lose a life!'],
    ];
    let ly = colY + 38;
    levels.forEach(([color, pct, label]) => {
      ctx.fillStyle = color;
      ctx.fillRect(col3x + colPad, ly - 10, 12, 12);
      ctx.fillStyle = '#dddddd';
      ctx.font = '11px monospace'; ctx.textAlign = 'left';
      ctx.fillText(pct + '  ' + label, col3x + colPad + 18, ly);
      ly += 22;
    });

    ly += 6;
    ctx.fillStyle = '#555555'; ctx.font = '11px monospace';
    ctx.fillText('─────────────────', col3x + colPad, ly); ly += 14;
    ctx.fillStyle = '#aaaaaa'; ctx.font = 'bold 11px monospace';
    ctx.fillText('WORKERS', col3x + colPad, ly); ly += 16;
    const winfo = [
      ['#cc4400', 'Kitchen chef'],
      ['#cc4400', 'Gap guard (hardest)'],
      ['#cc4400', 'Upper dining patrol'],
      ['#cc4400', 'Lower dining patrol'],
      ['#225599', 'Lobby security'],
    ];
    winfo.forEach(([c, name]) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(col3x + colPad + 6, ly - 4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cccccc'; ctx.font = '10px monospace';
      ctx.fillText(name, col3x + colPad + 18, ly);
      ly += 16;
    });

    // ── Buttons ────────────────────────────────────────────────────────
    // Start
    const btnY = colY + colH + 18;
    ctx.shadowColor = `rgba(60,160,255,${pulse * 0.6})`;
    ctx.shadowBlur = 12;
    button(ctx, '▶  START GAME', 264, btnY, 180, 40, '#1a4488', 'start');
    ctx.shadowBlur = 0;
    button(ctx, '? HOW TO PLAY', 456, btnY, 140, 40, '#2a2a2a', 'help');

    ctx.textAlign = 'left';
  }

  // ─── Help / Controls Screen ───────────────────────────────────────────────

  function drawHelpScreen(ctx) {
    const px = 140, py = 60, pw = 520, ph = 480;
    panel(ctx, px, py, pw, ph);
    const cx = px + pw / 2;
    ctx.textAlign = 'center';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('HOW TO PLAY', cx, py + 36);

    ctx.fillStyle = '#444444';
    ctx.fillText('────────────────────────────────', cx, py + 56);

    // Controls
    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('CONTROLS', cx, py + 78);

    const controls = [
      ['WASD / Arrows', 'Move'],
      ['Shift (hold)',  'Crouch — silent, slower, harder to detect'],
      ['Space (hold)',  'Sprint — 2× speed, loud, drains stamina'],
      ['E',            'Grab food when close to a counter'],
      ['Q',            'Throw distraction — lures nearby workers'],
    ];
    let y = py + 100;
    controls.forEach(([key, desc]) => {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffdd88';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(key, cx - 8, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px monospace';
      ctx.fillText('→  ' + desc, cx + 8, y);
      y += 20;
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#444444';
    ctx.fillText('────────────────────────────────', cx, y + 6);
    y += 22;

    // Objective
    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('OBJECTIVE', cx, y);
    y += 20;

    const steps = ['① Sneak past the cafeteria workers', '② Grab food from the kitchen counters (E key)', '③ Return to the lobby — reach the green EXIT'];
    steps.forEach(s => {
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px monospace';
      ctx.fillText(s, cx, y);
      y += 18;
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#444444';
    ctx.fillText('────────────────────────────────', cx, y + 4);
    y += 20;

    // Detection meter guide
    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('DETECTION METER', cx, y);
    y += 20;

    const levels = [
      ['#33cc33', '0–49%   Safe — keep moving'],
      ['#ff9900', '50–79%  Suspicious — hide behind cover'],
      ['#cc3300', '80–100% DANGER — you will be caught'],
    ];
    levels.forEach(([color, text]) => {
      ctx.fillStyle = color;
      ctx.fillRect(cx - 160, y - 10, 12, 12);
      ctx.fillStyle = '#cccccc';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(text, cx - 143, y);
      ctx.textAlign = 'center';
      y += 18;
    });

    ctx.fillStyle = '#444444';
    ctx.fillText('────────────────────────────────', cx, y + 4);
    y += 20;

    // Tips
    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TIPS', cx, y);
    y += 18;

    const tips = [
      '?  = worker spotted something — duck behind cover',
      '!  = worker is alert — stay out of their cone',
      '!! = worker is chasing — run!',
      'Counters and tables BLOCK worker vision',
      'Food glows yellow when you\'re close enough to grab',
      'Workers HEAR running — the dashed ring = your noise',
      'Q throw sends workers to wrong location — use it wisely',
      'Blue guard patrols the lobby — time your dash to the EXIT',
      'Low-risk snacks hide in the dining hall & lobby vending',
      'Kitchen pantry (right wall, E) = risky hide near workers',
    ];
    tips.forEach(t => {
      ctx.fillStyle = '#999999';
      ctx.font = '11px monospace';
      ctx.fillText(t, cx, y);
      y += 17;
    });

    button(ctx, '[ BACK TO MENU ]', cx - 80, py + ph - 44, 160, 32, '#222233', 'back');
    ctx.textAlign = 'left';
  }

  // ─── Game Over Screen ─────────────────────────────────────────────────────

  function drawGameOverScreen(ctx) {
    const gs = GameState;

    // Dark + red vignette
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, gs.width, gs.height);
    ctx.fillStyle = 'rgba(160,0,0,0.18)';
    ctx.fillRect(0, 0, gs.width, gs.height);

    const px = 180, py = 130, pw = 440, ph = 340;
    panel(ctx, px, py, pw, ph);
    const cx = px + pw / 2;

    ctx.textAlign = 'center';

    // "CAUGHT." with red glow
    const flash = (frame % 40) < 20;
    ctx.shadowColor = flash ? 'rgba(255,0,0,0.9)' : 'rgba(180,0,0,0.5)';
    ctx.shadowBlur  = flash ? 28 : 14;
    ctx.fillStyle   = flash ? '#ff2200' : '#cc1100';
    ctx.font        = 'bold 48px monospace';
    ctx.fillText('CAUGHT.', cx, py + 70);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('Banned from the dining hall. Also still hungry.', cx, py + 104);

    // Stats panel
    ctx.fillStyle = 'rgba(40,0,0,0.6)';
    ctx.fillRect(px + 30, py + 120, pw - 60, 120);

    const stolen = gs.player.inventory.length;
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px monospace';
    ctx.fillText(
      stolen > 0
        ? 'Grabbed ' + stolen + ' item' + (stolen !== 1 ? 's' : '') + ' before getting caught.'
        : "Didn't even get anything.",
      cx, py + 148
    );
    ctx.font = 'bold 18px monospace';
    ctx.fillText('Score: ' + gs.score + ' pts', cx, py + 176);

    ctx.fillStyle = '#666666';
    ctx.font = '11px monospace';
    ctx.fillText('Round ' + gs.round, cx, py + 198);

    const hs = gs.highScore || 0;
    if (hs > 0) {
      ctx.fillStyle = hs === gs.score ? '#ffdd00' : '#555555';
      ctx.fillText('Best: ' + hs + ' pts' + (hs === gs.score ? '  ★ NEW!' : ''), cx, py + 214);
    }

    button(ctx, '[ TRY AGAIN ]', cx - 85, py + 272, 170, 40, '#881100', 'retry');

    ctx.textAlign = 'left';
  }

  // ─── Win Screen ───────────────────────────────────────────────────────────

  function drawWinScreen(ctx) {
    const gs  = GameState;
    const inv = gs.player.inventory;
    const px = 160, py = 110, pw = 480, ph = 380;
    panel(ctx, px, py, pw, ph);
    const cx = px + pw / 2;

    ctx.textAlign = 'center';

    ctx.fillStyle = '#33cc66';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('ESCAPED.', cx, py + 52);

    ctx.fillStyle = '#888888';
    ctx.font = '13px monospace';
    ctx.fillText('Round ' + gs.round + ' complete.', cx, py + 78);

    // Food haul list
    ctx.fillStyle = '#555555';
    ctx.font = '11px monospace';
    ctx.fillText('──────────  STOLEN  ──────────', cx, py + 106);

    const shown = inv.slice(0, 6);
    let yy = py + 128;

    if (shown.length === 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '12px monospace';
      ctx.fillText('(nothing stolen)', cx, yy);
      yy += 20;
    } else {
      shown.forEach(food => {
        ctx.fillStyle = food.color || '#cccccc';
        ctx.font = '12px monospace';
        ctx.fillText('+ ' + food.label + '   (' + food.points + ' pts)', cx, yy);
        yy += 20;
      });
      if (inv.length > 6) {
        ctx.fillStyle = '#666666';
        ctx.font = '11px monospace';
        ctx.fillText('...and ' + (inv.length - 6) + ' more', cx, yy);
        yy += 18;
      }
    }

    ctx.fillStyle = '#555555';
    ctx.font = '11px monospace';
    ctx.fillText('──────────────────────────────', cx, yy + 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Score: ' + gs.score + ' pts', cx, yy + 28);

    button(ctx, '[ NEXT ROUND ]', cx - 85, yy + 46, 170, 36, '#336633', 'next');

    ctx.textAlign = 'left';
  }

  return { init, draw };
})();
