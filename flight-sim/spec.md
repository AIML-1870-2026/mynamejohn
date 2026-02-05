# Parallax Flight Simulator - Specifications

## Overview
A first-person cockpit flight simulator with parallax scrolling environment and lead-angle targeting computer for engaging moving targets.

## Controls

| Key | Action |
|-----|--------|
| W/S | Pitch up/down |
| A/D | Roll left/right |
| Q/E | Yaw left/right |
| SHIFT | Increase throttle |
| CTRL | Decrease throttle |
| SPACE | Fire projectile |
| R | Reset target position |

## Variables

### Targeting Computer
| Variable | Default | Range | Description |
|----------|---------|-------|-------------|
| `projectileVelocity` | 800 | 200-2000 m/s | Speed of fired rounds |
| `windSpeed` | 10 | 0-50 m/s | Crosswind velocity |
| `windDirection` | 90 | 0-360° | Wind bearing |

### Aircraft State (read-only)
- **Altitude**: 100 - 40,000 ft
- **Speed**: 100 - 800 knots
- **Heading**: 0 - 360°
- **Pitch**: -45° to +45°
- **Roll**: -60° to +60°

## Parallax System

Three depth layers with different scroll speeds:

1. **Clouds** (far layer, z: 2000-5000)
   - Parallax factor: 1.5x (slowest movement)
   - 30 cloud elements
   - Opacity fades with distance

2. **Mountains** (mid layer, z: 1000-3000)
   - Parallax factor: 1.2x
   - 20 mountain peaks
   - Triangle geometry

3. **Ground Features** (near layer, z: 200-1700)
   - Parallax factor: 1.0x (fastest movement)
   - 50 elements (trees and buildings)
   - Most pronounced parallax effect

## Targeting Physics

### Lead Calculation
```
timeToTarget = range / projectileVelocity
predictedPosition = currentPosition + (targetVelocity × timeToTarget)
windCompensation = windVector × timeToTarget
leadPoint = predictedPosition - windCompensation
```

### Displayed Data
- **TGT RANGE**: Distance to target in meters
- **TGT BEARING**: Compass direction to target
- **CLOSURE**: Rate of range change (m/s)
- **LEAD ANGLE**: Degrees between target and lead point

### Target Lock
- Activates when lead angle < 2° AND range < 3000m
- Flashing "TARGET LOCK" indicator

## Visual Elements

### HUD (Heads-Up Display)
- Altitude, Speed, Heading readouts
- Pitch/Roll indicators
- Artificial horizon with pitch ladder (10° increments)
- Center crosshair with velocity vector

### Targeting
- Red target aircraft marker
- Orange target bounding box
- Green lead indicator (circle + crosshair)
- Dashed line connecting target to lead point

### Projectiles
- Yellow tracer rounds
- Trail effect showing trajectory
- Hit detection with explosion particles

## Target Behavior
- Moves with constant velocity (vx, vy, vz)
- Resets when:
  - Z < 100m (passed player)
  - Z > 10,000m (too far)
  - |X| > 5,000m (off-screen)
  - Hit by projectile

## 3D Projection
Uses perspective projection with aircraft rotation applied:
1. Yaw rotation (heading)
2. Pitch rotation
3. Roll rotation
4. Perspective divide: `screenPos = center + (worldPos × FOV / depth)`
