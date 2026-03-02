# Spike Jumper Quest — Specification

## Overview
A single-page, canvas-based endless runner where a player character jumps over procedurally arranged obstacles to survive as long as possible. The game uses a single control (SPACE bar or tap) with tap-for-hop and hold-for-full-jump mechanics. Score is measured in meters traveled; speed increases continuously with distance. All assets are generated with code — no external images or audio files.

## Core Mechanics

### Player
- Fixed horizontal position at x = 100; the world scrolls rightward
- Physics: constant downward gravity (900 px/s²), vertical velocity only
- Two jump modes triggered by SPACE:
  - **Tap** (release < 0.15s): small hop, vy = −340 px/s, air time ≈ 0.76s
  - **Hold** (release ≥ 0.15s): full jump, vy boosted to −460 px/s, air time ≈ 1.02s
- Double jump allowed (max 2 jumps per airborne phase); resets on landing
- Squash/stretch animation: compress on land (scaleX 1.4, scaleY 0.6), stretch on jump (scaleX 0.7, scaleY 1.4); eases back to 1:1 at rate 12/s
- Motion trail: 8-frame ghost history, fading in alpha

### Collision
- AABB hitbox inset 4px on all sides from visual bounds
- Any overlap with a hazard triggers immediate death

### Scoring and Difficulty
- Score = distance traveled / 10 (displayed in meters)
- Speed ramps continuously: `speed = 250 + dist × 0.06` px/s (starts at 250, no hard cap)
- High score persisted to localStorage key `sjHi`
- Milestone chime every 50m

## Obstacles

### Hazard Types
| Type | Shape | Position |
|---|---|---|
| 0 — Spike | Triangle, tip up | Ground-anchored |
| 1 — Crusher | Horizontal bar with downward spikes | Floating at configurable height |

### Pattern Chunks
Obstacles are placed in pre-tested chunks rather than fully random positions. Each chunk is a small array of hazards with relative offsets:

| Chunk | Hazards | Notes |
|---|---|---|
| Single short spike | 1 spike (20 × 36) | Easiest — tap clears it |
| Single tall spike | 1 spike (18 × 50) | Requires full jump |
| Double spike | 2 spikes 70px apart | Sequential hops |
| Tall + short | Spike (20 × 60), spike (20 × 28) | Mixed heights |
| Floating bar | Crusher (60 × 18) at y −90 | Jump under or over |
| Spike + bar | Ground spike, floating crusher 50px ahead | Precise timing |
| Triple spike | 3 spikes at 0 / 55 / 110px | Single long jump clears all |
| Wide crusher | Crusher (80 × 12) at y −110 | High bar, must pass under |

### Spawn Gap
Gap between chunks is **time-based**, not pixel-fixed:
- `gapSeconds = 0.55 + random × 0.35` (range 0.55–0.90s)
- `gap pixels = max(speed × gapSeconds, 140)`

This ensures reaction time stays consistent regardless of current speed. At speed 250 the gap is ~170–280px; at speed 650 it grows to ~360–585px.

## Visual Effects ("Juice")

### Parallax Background (3 layers)
- **Layer 1 — Stars**: scroll at 5% of world speed; 60 procedural points
- **Layer 2 — Mountains**: scroll at 20%; triangle silhouettes
- **Layer 3 — Buildings**: scroll at 50%; rectangles with lit windows

### Screen Shake
- Death triggers shake amplitude 12, decay 0.85/frame, duration 0.4s
- Implemented as random canvas translate offset each frame

### Particle Bursts
- Death: 20 blue + 12 red particles in random directions, gravity-affected
- Combo milestone: 6 green particles
- Particles age out over 0.6–1.0s

## HUD
- **Top right**: current score (meters), personal best
- **Top left**: speed bar (fills left to right, color shifts blue → cyan as speed increases), SPD label
- **Below speed bar**: day/night icon (☀/☽) and weather icon (🌧/⚡) when active
- **Center top**: combo display (visible when combo ≥ 3)

## Screens
- **Start**: title, subtitle, best score, press-to-begin prompt
- **Playing**: full game loop
- **Dead**: semi-transparent overlay, score, NEW BEST flash if applicable, retry prompt

## Controls
| Input | Action |
|---|---|
| SPACE (tap) | Small hop |
| SPACE (hold) | Full jump / second jump boost |
| Touch tap | Same as SPACE tap |
| Touch hold | Same as SPACE hold |

---

## Stretch Features

### A — Day / Night Cycle
The sky transitions continuously through four phases — midnight, dawn, noon, and dusk — on a 90-second loop. Sky gradient top and bottom colors are interpolated between four RGB keyframes using linear blending. Star brightness tracks inversely with solar phase (fully visible at midnight, invisible at noon). Building windows glow warm yellow only when the sky is dark, fading out at dawn. A ☀ or ☽ icon in the HUD reflects the current phase with an appropriate tint.

### B — Combo System
Every hazard that passes behind the player without triggering death increments the combo counter. A `x{n} COMBO` label appears center-top of the canvas once the counter reaches 3, pulsing in brightness each frame and scaling in font size up to a cap. The counter turns gold at 10+. If no obstacle is cleared for 2.5 seconds, the combo resets. Every 5 consecutive clears triggers an ascending chime and a small burst of green particles. Combo resets to zero on death.

### C — Weather Effects
Weather cycles on a 30-second timer through three states: clear, rain, and storm. Rain spawns 70 angled line-segments falling from off-screen top, drifting slightly left to suggest wind; heavier in storm mode. Storm additionally flickers a faint white overlay approximately twice per minute to simulate lightning. A 🌧 or ⚡ icon appears in the HUD during active weather. Rain particles loop back to the top when they reach ground level.

---

## Technical Notes
- Single HTML file; no external dependencies
- Canvas 800 × 300, `image-rendering: pixelated`
- Audio via Web Audio API oscillators only (no audio files)
- All randomness via `Math.random()`; no seed — each run is unique
- Target 60 fps via `requestAnimationFrame`; delta-time capped at 50ms to prevent physics tunneling on tab-blur
- Deployed on GitHub Pages: `https://aiml-1870-2026.github.io/mynamejohn/spike-jumper/`
