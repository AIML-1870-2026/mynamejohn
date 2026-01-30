# Assignment-01 - Stellar Web

## Project Overview
An interactive particle network simulation with periwinkle-colored particles. Features physics-based attraction/repulsion between positive and negative charged particles.

## Tech Stack
- HTML5 Canvas
- CSS3
- Vanilla JavaScript

## Project Structure
```
Assignment-01/
├── index.html           # Main entry point
├── styles/
│   └── main.css         # Styling for canvas and controls
├── scripts/
│   └── stellar.js       # Particle physics simulation
└── CLAUDE.md
```

## Configuration Variables
- **Connectivity Radius** - Distance threshold for particle connections
- **Edge Length** - Ideal distance between connected particles
- **Volatility** - Randomness/chaos in particle movement
- **Particle Count** - Total number of particles
- **Positive Ratio** - Percentage of positive vs negative particles

## Physics
- Positive particles (filled circles) and negative particles (hollow circles)
- Same charge = repel, opposite charge = attract
- Connections shown with colored lines (blue for attraction, red for repulsion)

## Development
- Open `index.html` in a browser to run
- No build step required - static site
- Controls panel in top-right corner
