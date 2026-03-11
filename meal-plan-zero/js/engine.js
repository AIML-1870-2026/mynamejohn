// =============================================================================
// Module 1 — Core Engine & Game Loop
// File: js/engine.js
// Exposes: window.Engine = { init, reset }
// Orchestrates all modules. Owns canvas, input, RAF loop, camera, phase
// transitions, Web Audio music, round intro overlay, lives system.
// =============================================================================

window.Engine = (function () {

  let _lastTime = null; // null = first frame sentinel

  // ─── Audio ────────────────────────────────────────────────────────────────
  // 140-BPM trap beat: kick808, bass808, snare, hihat.
  // Started on first keydown/click (browser autoplay policy).

  let _ac = null, _masterGain = null, _bgStarted = false;

  function _ensureAudio() {
    if (_ac) return;
    try {
      _ac = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _ac.createGain();
      _masterGain.gain.value = 0.22;
      _masterGain.connect(_ac.destination);
    } catch (_) {}
  }

  function _startBgMusic() {
    if (_bgStarted || !_ac) return;
    _bgStarted = true;

    const BPM  = 140;
    const STEP = (60 / BPM / 4) * 1000; // 16th-note duration in ms

    const kickPat  = [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0];
    const snarePat = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
    const hihatPat = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1];
    const bassPat  = [1,0,0,1, 0,0,1,0, 0,0,1,0, 0,1,0,0];
    const bassFreqs= [55,55,55,41, 41,41,55,55, 55,55,41,41, 55,55,46,46];

    let step = 0;

    function _kick() {
      try {
        const osc = _ac.createOscillator();
        const g   = _ac.createGain();
        osc.connect(g); g.connect(_masterGain);
        const t = _ac.currentTime;
        osc.frequency.setValueAtTime(185, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        g.gain.setValueAtTime(1.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.start(t); osc.stop(t + 0.32);
      } catch (_) {}
    }

    function _snare() {
      try {
        const len  = Math.ceil(_ac.sampleRate * 0.14);
        const buf  = _ac.createBuffer(1, len, _ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = _ac.createBufferSource();
        const bpf = _ac.createBiquadFilter();
        const g   = _ac.createGain();
        src.buffer = buf;
        bpf.type = 'bandpass'; bpf.frequency.value = 1400; bpf.Q.value = 0.8;
        src.connect(bpf); bpf.connect(g); g.connect(_masterGain);
        const t = _ac.currentTime;
        g.gain.setValueAtTime(0.65, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        src.start(t);
      } catch (_) {}
    }

    function _hihat() {
      try {
        const len  = Math.ceil(_ac.sampleRate * 0.04);
        const buf  = _ac.createBuffer(1, len, _ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = _ac.createBufferSource();
        const hpf = _ac.createBiquadFilter();
        const g   = _ac.createGain();
        src.buffer = buf;
        hpf.type = 'highpass'; hpf.frequency.value = 8000;
        src.connect(hpf); hpf.connect(g); g.connect(_masterGain);
        const t = _ac.currentTime;
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        src.start(t);
      } catch (_) {}
    }

    function _bass(freq) {
      try {
        const osc = _ac.createOscillator();
        const lpf = _ac.createBiquadFilter();
        const g   = _ac.createGain();
        osc.connect(lpf); lpf.connect(g); g.connect(_masterGain);
        osc.type = 'sawtooth';
        lpf.type = 'lowpass'; lpf.frequency.value = 220;
        const t = _ac.currentTime;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.8, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
        osc.start(t); osc.stop(t + 0.12);
      } catch (_) {}
    }

    function _tick() {
      if (kickPat[step])  _kick();
      if (snarePat[step]) _snare();
      if (hihatPat[step]) _hihat();
      if (bassPat[step])  _bass(bassFreqs[step]);
      step = (step + 1) % 16;
      setTimeout(_tick, STEP);
    }
    _tick();
  }

  // ─── Round Intro Overlay ──────────────────────────────────────────────────
  // A countdown (3-2-1-GO!) shown at the start of each round.
  // Gameplay is frozen while it plays.

  let _introTime   = 0;   // 0 = not active; >0 = frames since intro started
  let _introActive = false;

  function _startIntro() {
    _introTime   = 0;
    _introActive = true;
  }

  function _tickIntro() {
    if (!_introActive) return;
    _introTime++;
    if (_introTime >= 130) _introActive = false;
  }

  function _drawIntro(ctx) {
    if (!_introActive) return;
    const t    = _introTime;
    const fade = t < 20 ? t / 20 : t > 110 ? (130 - t) / 20 : 1;
    const gs   = window.GameState;

    // dark band
    ctx.fillStyle = `rgba(0,0,0,${0.78 * fade})`;
    ctx.fillRect(0, 180, gs.width, 220);

    ctx.textAlign = 'center';

    // "ROUND X"
    ctx.fillStyle = `rgba(255,255,255,${fade})`;
    ctx.font      = 'bold 52px monospace';
    ctx.shadowColor = `rgba(80,180,255,${fade * 0.8})`;
    ctx.shadowBlur  = 18;
    ctx.fillText('ROUND ' + gs.round, gs.width / 2, 280);
    ctx.shadowBlur = 0;

    // Countdown number / GO!
    let label, color;
    if      (t < 35)  { label = '3'; color = `rgba(255,200,50,${fade})`; }
    else if (t < 70)  { label = '2'; color = `rgba(255,200,50,${fade})`; }
    else if (t < 105) { label = '1'; color = `rgba(255,200,50,${fade})`; }
    else              { label = 'GO!'; color = `rgba(80,255,120,${fade})`; }

    ctx.fillStyle = color;
    ctx.font      = 'bold 40px monospace';
    ctx.fillText(label, gs.width / 2, 352);
    ctx.textAlign = 'left';
  }

  // ─── Floating Score Popups (drawn in world space) ─────────────────────────

  function _drawPopups(ctx) {
    const gs = window.GameState;
    if (!gs.popups || gs.popups.length === 0) return;
    gs.popups = gs.popups.filter(p => p.alpha > 0);
    gs.popups.forEach(p => {
      ctx.globalAlpha = Math.min(1, p.alpha);
      ctx.fillStyle   = p.color || '#ffdd00';
      ctx.font        = 'bold 13px monospace';
      ctx.textAlign   = 'center';
      ctx.fillText(p.text, p.x, p.y);
      p.y     -= 1.1;
      p.alpha -= 0.016;
    });
    ctx.globalAlpha = 1;
    ctx.textAlign   = 'left';
  }

  // ─── Camera ───────────────────────────────────────────────────────────────

  function _updateCamera() {
    const gs = window.GameState;
    const p  = gs.player;
    const WW = gs.worldWidth;
    const WH = gs.worldHeight;
    gs.cam.x = Math.max(0, Math.min(WW - gs.width,  p.x + p.width  / 2 - gs.width  / 2));
    gs.cam.y = Math.max(0, Math.min(WH - gs.height, p.y + p.height / 2 - gs.height / 2));
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────

  function loop(timestamp) {
    if (_lastTime === null) _lastTime = timestamp;
    const dt = Math.min((timestamp - _lastTime) / 1000, 0.05);
    _lastTime = timestamp;

    const gs  = window.GameState;
    const ctx = gs.ctx;

    ctx.clearRect(0, 0, gs.width, gs.height);

    // ── Game logic update ───────────────────────────────────────────────────
    if (gs.phase === 'playing') {
      if (!_introActive) {
        Workers.update(dt);
        Player.update(dt);

        // ── Lives system: detection maxed → lose a life ──────────────────
        if (gs.detection >= 100) {
          gs.lives = Math.max(0, (gs.lives !== undefined ? gs.lives : 3) - 1);
          if (gs.lives <= 0) {
            gs.phase     = 'gameover';
            gs.highScore = Math.max(gs.highScore || 0, gs.score);
          } else {
            // Lose a life — partial reset (keeps round, score, inventory)
            gs.detection  = 0;
            gs.flashAlpha = 0.85;
            gs.shakeFrames = 22;
            gs.shakeMag    = 9;
            gs.player.x   = 50;
            gs.player.y   = 1200;
            gs.hiding      = false;
            gs.cam.x       = 0;
            gs.cam.y       = 0;
            gs.workers.forEach(w => {
              w.state          = 'patrol';
              w.suspicionTimer = 0;
            });
          }
        }
      }
      _tickIntro();
      _updateCamera();
    }

    // ── World layer — camera + optional shake ──────────────────────────────
    const shaking = gs.phase === 'playing' && gs.shakeFrames > 0;
    const sx = shaking ? (Math.random() - 0.5) * (gs.shakeMag || 5) : 0;
    const sy = shaking ? (Math.random() - 0.5) * (gs.shakeMag || 5) : 0;
    if (shaking) gs.shakeFrames--;

    ctx.save();
    ctx.translate(-gs.cam.x + sx, -gs.cam.y + sy);

    Map.draw(ctx);

    if (gs.phase === 'playing') {
      Workers.draw(ctx);
      Player.draw(ctx);
      _drawPopups(ctx);   // world-space floating score text
    }

    ctx.restore(); // ← back to canvas space before HUD / overlays

    // ── Red flash on lose-life ─────────────────────────────────────────────
    if (gs.flashAlpha > 0) {
      ctx.fillStyle = `rgba(200,0,0,${gs.flashAlpha})`;
      ctx.fillRect(0, 0, gs.width, gs.height);
      gs.flashAlpha = Math.max(0, gs.flashAlpha - 0.028);
    }

    // ── Round intro overlay ────────────────────────────────────────────────
    _drawIntro(ctx);

    // ── UI layer ───────────────────────────────────────────────────────────
    UI.draw(ctx);

    requestAnimationFrame(loop);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    const gs = window.GameState;

    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.width  = gs.width;
    canvas.height = gs.height;
    document.getElementById('game-container').appendChild(canvas);
    gs.canvas = canvas;
    gs.ctx    = canvas.getContext('2d');

    window.addEventListener('keydown', (e) => {
      gs.keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      // Trigger audio on first user interaction
      _ensureAudio();
      if (_ac && gs.phase === 'playing') {
        _ac.resume().catch(() => {});
        _startBgMusic();
      }
    });
    window.addEventListener('keyup', (e) => {
      gs.keys[e.key] = false;
    });

    // Also trigger audio on canvas click (start-screen button)
    canvas.addEventListener('mousedown', () => {
      _ensureAudio();
      if (_ac) _ac.resume().catch(() => {});
    });

    Map.init();
    Player.init();
    Workers.init();
    UI.init();

    requestAnimationFrame(loop);
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  // Called on retry / new round. Does NOT set phase — UI does that.

  function reset() {
    const gs = window.GameState;

    gs.lives        = 3;
    gs.detection    = 0;
    gs.keys         = {};
    gs.shakeFrames  = 0;
    gs.grabFlash    = 0;
    gs.flashAlpha   = 0;
    gs.popups       = [];
    gs.cam.x        = 0;
    gs.cam.y        = 0;
    gs.hiding       = false;
    gs.stamina      = 100;
    gs.playerNoise  = 0;
    gs.distractions = 3;
    gs.distraction  = null;
    gs.player.inventory = [];
    gs.player.x         = 50;
    gs.player.y         = 1200;
    gs.player.crouching = false;

    Map.reset();
    Player.reset();
    Workers.reset(gs.round);

    // Show round intro countdown
    _startIntro();

    // Start music (first time only)
    if (_ac) _startBgMusic();
  }

  return { init, reset };

})();

window.addEventListener('load', () => Engine.init());
