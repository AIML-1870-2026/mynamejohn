# Snake Game

## Project Overview
A classic Snake game with a cosmic twist - featuring animated black hole obstacles that spawn randomly and must be avoided.

## Tech Stack
- HTML5 Canvas
- CSS3
- Vanilla JavaScript

## Features
- Classic snake gameplay with smooth controls
- **Black Holes**: Purple swirling obstacles that spawn every 3-6 seconds
  - Maximum 5 black holes at once
  - Each lives 5-10 seconds before disappearing
  - Animated rotating accretion disk effect
- Progressive difficulty (speed increases as you eat)
- High score saved to localStorage
- Pause functionality

## Controls
| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move snake |
| Space | Pause/Resume |
| Enter/Space | Start game |

## Visual Design
- Dark cosmic theme (#0f0f23 background)
- Teal/mint snake (#4ecca3) with gradient fade
- Red food with glow effect
- Purple black holes with swirling animation
- Snake head has animated eyes that follow direction

## Game Mechanics
- 20x20 grid (400x400 canvas)
- Starting speed: 100ms per tick
- Speed increases by 2ms per food eaten (min 50ms)
- Score: +10 per food
- Game over: wall collision, self collision, or black hole collision

## File Structure
```
snake-game/
├── index.html    # Complete game (single file)
└── claude.md     # This documentation
```
