# Hypersonic Jet Simulator - Specifications

## Overview
A fixed-camera simulation of a jet aircraft at various Mach speeds, featuring aerodynamic heating, shock waves, and plasma sheath formation at hypersonic velocities.

## Variables

| Variable | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `mach` | float | 1.0 | 0.1 - 25 | Mach number (multiples of speed of sound) |
| `airDensity` | float | 1.0 | 0.01 - 2.0 | Air density in kg/m³ (sea level ~1.225) |
| `emField` | float | 0 | 0 - 5 | Electromagnetic field strength in Tesla |
| `fuelType` | enum | kerosene | see below | Engine fuel/propulsion type |

### Fuel Types
- **JP-8 Kerosene**: Orange exhaust, standard intensity
- **Liquid Hydrogen**: Blue exhaust, higher intensity, hotter burn
- **Scramjet**: Yellow-orange exhaust, air-breathing hypersonic
- **Plasma Drive**: Violet exhaust, extremely hot, sci-fi propulsion

## Physics Model

### Stagnation Temperature
Temperature at nose/leading edges from ram compression:
```
T_stagnation = T_ambient × (1 + (γ-1)/2 × M²)
```
Where γ = 1.4 (ratio of specific heats for air), M = Mach number

### Flight Regimes
- **Subsonic**: M < 0.8
- **Transonic**: 0.8 ≤ M < 1.2
- **Supersonic**: 1.2 ≤ M < 5
- **Hypersonic**: 5 ≤ M < 10
- **High Hypersonic**: M ≥ 10

### Mach Cone
Shock wave angle for supersonic flight:
```
θ = arcsin(1/M)
```
Only visible when M > 1

### Plasma Formation
- Ionization begins at ~3000 K stagnation temperature
- Typically occurs around Mach 10+ at sea level density
- Lower air density delays plasma formation
- EM field affects plasma particle motion and color

## Visual Elements

### Air Particles
- Stream past from right to left
- Stretch based on Mach number
- Color shifts: white/blue → orange → violet (plasma)
- Density affects particle count/opacity

### Shock Cone
- Appears at M > 1
- Angle narrows as Mach increases
- Two lines emanating from nose

### Nose Heating Glow
- Begins visible around 800 K
- Orange/red at high temps
- Violet/white in plasma regime

### Plasma Sheath
- Envelope around aircraft at extreme speeds
- Flickering plasma arcs
- EM field shifts hue (violet → magenta → pink)
- Ionization percentage displayed in readout

### Exhaust
- Color determined by fuel type
- Intensity affected by fuel properties
- Particles with fade-out trails

## Readouts
- Temperature (K)
- Velocity (m/s)
- Dynamic Pressure (kPa)
- Flight Regime
- Plasma State (None / % ionized)

## Real-World Context
- Plasma sheath causes "radio blackout" during reentry
- SR-71 Blackbird cruised at Mach 3.2
- Space Shuttle reentry peaked around Mach 25
- X-43A scramjet reached Mach 9.6
