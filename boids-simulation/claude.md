# Boids Flocking Simulation

A browser-based implementation of Craig Reynolds' Boids algorithm for simulating flocking behavior.

## Overview

Create an interactive canvas-based simulation where autonomous agents (boids) exhibit emergent flocking behavior through three simple steering rules: separation, alignment, and cohesion. Include mouse interaction modes and visual trails.

## Tech Stack

- HTML5 Canvas for rendering
- Vanilla JavaScript (single file)
- No external dependencies

## Core Boids Algorithm

Each boid follows three rules:

1. **Separation**: Steer to avoid crowding nearby boids
2. **Alignment**: Steer toward the average heading of nearby boids
3. **Cohesion**: Steer toward the average position of nearby boids

## Configurable Variables

Implement a control panel with the following adjustable parameters:

| Variable | Default | Range | Description |
|----------|---------|-------|-------------|
| `separationWeight` | 1.5 | 0 - 5 | Force multiplier for avoiding neighbors |
| `alignmentWeight` | 1.0 | 0 - 5 | Force multiplier for matching velocity |
| `cohesionWeight` | 1.0 | 0 - 5 | Force multiplier for moving toward group center |
| `neighborRadius` | 50 | 10 - 200 | Pixel distance to detect neighbors |
| `maxSpeed` | 4 | 1 - 15 | Maximum velocity magnitude |
| `tailLength` | 10 | 0 - 50 | Number of previous positions to draw as trail |
| `birdCount` | 100 | 10 - 500 | Total number of boids in simulation |
| `mouseMode` | "off" | "leader" / "predator" / "off" | Mouse interaction behavior |
| `hawkEnabled` | false | true / false | Enable autonomous hawk predator |
| `evasionIntensity` | 2.0 | 0 - 5 | Strength of evasive maneuvers |
| `panicFlockMultiplier` | 3.0 | 1 - 10 | How much tighter flock forms when threatened |

## Mouse Modes

- **off**: Mouse has no effect on boids
- **leader**: Boids are attracted toward mouse position (mouse acts as flock leader)
- **predator**: Boids flee from mouse position with evasive maneuvers

## Defensive Behaviors

### Hawk Predator
- Autonomous red hawk that hunts the flock
- Chases closest boid with predictive targeting
- Faster than boids (1.5x max speed)
- Visual: larger red triangle with glow effect

### Evasive Maneuvers
- When predator gets within 60px, boids execute sharp random turns
- Perpendicular escape direction with randomness
- Brief cooldown between maneuvers (15 frames)

### Panic Flocking
- Threat level (0-1) based on proximity to predators
- When threatened, cohesion and alignment multiply by panic multiplier
- Creates tight defensive clusters
- Birds turn from blue to red based on threat level

### Speed Boost
- Panicked birds can fly up to 50% faster than normal max speed

## Visual Design

### Boid Appearance
- Render as triangular shapes pointing in direction of velocity
- Size: ~10px length
- Color: Use a gradient or varied colors based on velocity or group membership
- Smooth rotation following heading

### Tail/Trail
- Draw fading trail behind each boid
- Trail opacity decreases with distance from current position
- Trail length determined by `tailLength` parameter

### Canvas
- Full viewport size, responsive to window resize
- Dark background (#0a0a0a or similar)
- Subtle grid or particle effect optional

## Control Panel UI

Position controls in a collapsible panel (top-right corner):

```
[Boids Simulation]

Separation: [====|======] 1.5
Alignment:  [===|=======] 1.0
Cohesion:   [===|=======] 1.0
Radius:     [=====|=====] 50
Max Speed:  [====|======] 4
Tail:       [==|========] 10
Count:      [=====|=====] 100

Mouse: [Leader] [Predator] [Off]

[Reset] [Randomize]
```

- Sliders for continuous values
- Button group for mouse mode
- Reset button: restore defaults
- Randomize button: scatter boids with random velocities

## Behavior Details

### Boundary Handling
- Wrap around edges (toroidal space) - boids exiting one side appear on opposite

### Separation Details
- Apply stronger repulsion force when very close (< 25% of neighbor radius)
- Smooth falloff based on distance

### Steering Forces
- Limit maximum steering force to prevent jarring movement
- Apply forces as accelerations, cap velocity at maxSpeed

### Performance
- Use spatial partitioning (grid or quadtree) if needed for large boid counts
- Target 60 FPS

## File Structure

```
boids-simulation/
├── index.html    # Single file with embedded CSS and JS
└── claude.md     # This specification
```

## Implementation Notes

1. Initialize boids with random positions and velocities
2. Main loop: clear canvas → update all boids → render all boids
3. Each boid stores position history for tail rendering
4. Smooth slider changes (no jarring transitions when adjusting parameters)
5. Display current FPS in corner for performance monitoring
