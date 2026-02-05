# Snake Game

A classic Snake game built with HTML5 Canvas and JavaScript.

## How to Play

1. Open `index.html` in any modern web browser
2. Click **Start Game** or press **Space/Enter** to begin
3. Use **Arrow Keys** or **WASD** to control the snake
4. Eat the red food pellets to grow and score points
5. Avoid hitting the walls, yourself, and the black holes!
6. Press **Space** to pause/unpause

## Features

- Classic snake gameplay on a 20x20 grid
- Smooth gradient visuals with a dark theme
- Snake head has eyes that follow the direction of movement
- Score tracking with persistent high score (saved to localStorage)
- Game speeds up as you eat more food
- Pause functionality

### Black Holes

- Spawn every 3-6 seconds at random locations
- Maximum of 5 black holes on screen at once
- Each black hole lasts 5-10 seconds before disappearing
- They fade out during their last second as a warning
- Touching a black hole ends the game

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move snake |
| Space | Pause / Start game |
| Enter | Start game |

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses HTML5 Canvas for rendering
- No external dependencies
- Single file, self-contained application

## Files

- `index.html` - The complete game (HTML + CSS + JS)
- `CLAUDE.md` - This documentation file
