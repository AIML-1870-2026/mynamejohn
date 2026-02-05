# Hyperspace Starfield Simulation

## Overview
A 3D perspective starfield effect simulating hyperspace travel, with stars streaking toward the viewer. Features an easter egg where some stars transform into dancing stick figures.

## Variables

| Variable | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `size` | float | 2 | 0.5 - 5 | Base star size multiplier |
| `trail` | int | 50 | 10 - 150 | Length of star streak/trail in z-depth units |
| `speed` | float | 15 | 2 - 50 | How fast stars move toward viewer (z units/frame) |
| `brightness` | int | 100 | 20 - 100 | Global brightness percentage |
| `danceChance` | int | 5 | 0 - 50 | Percentage chance a star becomes a dancing stick figure |

## Core Mechanics

### 3D Perspective Projection
- Stars exist in 3D space (x, y, z coordinates)
- Z-depth ranges from 0 (viewer) to 2000 (far)
- Projection formula: `screenPos = center + (pos * 500 / z)`
- Stars reset when z < 1 (passed the viewer)

### Star Properties
- 6 color variations: white, blue-white, warm white, red-tinted, blue-tinted, yellow-tinted
- Size scales inversely with distance
- Trail rendered as gradient from transparent to opaque
- Glow effect added when z < 300

### Dancing Stick Figures
- Triggered when star z-depth enters 50-200 range
- Only spawns if on-screen (50px margin from edges)
- Lifespan: 120 frames with 30-frame fade out
- Animation: jive-style dancing with:
  - Vertical bounce (sine wave)
  - Body sway
  - Alternating arm swings
  - High-stepping leg kicks

## Rendering

### Frame Update
1. Clear with semi-transparent black (motion blur effect)
2. Update all star z-positions
3. Check for dance transformations
4. Draw star trails (gradient strokes)
5. Draw star heads (filled circles)
6. Draw glow for close stars
7. Update and draw active dancers

### Trail Rendering
```
gradient: prevPosition -> currentPosition
  0%: fully transparent
  50%: half alpha
  100%: full alpha
lineWidth: scales with star size
```

## Controls
- All sliders update in real-time
- Reset button restores default values
- No pause/play (continuous animation)

## Technical Notes
- Canvas resizes with window
- ~400 stars maintained in pool
- Stars distributed across full z-range on init
- RAF-based animation loop
- Motion blur via `rgba(0, 0, 0, 0.3)` clear
