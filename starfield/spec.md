# Hyperspace Starfield - Specifications

## Overview
An interactive particle system simulating hyperspace travel with customizable parameters and dancing stick figures.

## Features

### Core Starfield
- 3D perspective with stars flying toward viewer from center vanishing point
- Stars spawn at random distances and positions, reset when passing viewer
- Light streak 
- Glow effect 
- Motion blur 

### Adjustable Parameters
- **Star Size** (0.5 - 5): Controls thickness of stars and streaks
- **Trail Length** (10 - 150): Length of the light streak behind each star
- **Speed** (2 - 50): How fast stars travel toward viewer
- **Brightness** (20% - 100%): Overall opacity/intensity of stars
- **Dance Chance** (0% - 50%): Probability a star transforms into a dancer

### Dancing Stick Figures
- Stars have a configurable chance to transform into stick figures
- Transformation occurs when star reaches close proximity to viewer
- Dance animation featuring:
- Dancers persist for ~2 seconds before fading out
- Inherit color from parent star


## Browser Compatibility
- Modern browsers with Canvas 2D support
- Responsive to window resize
- No external dependencies

## File Structure
- Single self-contained HTML file