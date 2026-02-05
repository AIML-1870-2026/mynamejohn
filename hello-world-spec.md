# Hello World Landing Page - Specifications

## Overview
A cosmic/space-themed "Hello World" landing page featuring a starry night sky, moon, and werewolf visual.

## Visual Elements

### Background
- **Gradient**: Vertical gradient transitioning through deep space colors
  - `#0a0a1a` → `#1a1a3a` → `#2a1a4a` → `#3a2a5a` → `#1a1a3a` → `#0a0a1a`
- Dark purple/blue color scheme

### Stars
Three layers with different sizes and twinkle animations:

| Layer | Size | Animation Duration | Effect |
|-------|------|-------------------|--------|
| Small | 1px | 3s | Opacity 1 → 0.5 |
| Medium | 2px | 4s | Opacity 0.8 → 0.3 |
| Large | 3-4px | 5s | Opacity 1 → 0.4 → 0.9 |

- Stars have subtle color variations (white, blue-white, yellow, cyan)
- Created using CSS `radial-gradient` backgrounds

### Milky Way Band
- Semi-transparent diagonal band across screen
- 200% width, 300px height
- Rotated -20 degrees
- 30px blur filter
- Gradient from transparent → white → purple → white → transparent

### Moon
- Position: Top-right (10% from top, 15% from right)
- Size: 120px diameter (80px on mobile)
- Gradient: Yellow-gold tones (`#ffffd0` → `#f0e68c` → `#daa520`)
- Features:
  - Multiple glow layers (box-shadow)
  - Inset shadow for 3D depth
  - Two crater overlays (::before, ::after pseudo-elements)

### Text Message
- Content: "Hello World, I'm ready to rock!"
- Font: Georgia, serif
- Size: 3.5rem (2rem on mobile)
- Color: White with animated glow
- **textGlow animation**: 3s cycle
  - Glow expands/contracts between 10-20px and 20-60px blur radii
  - Purple/white color scheme

### Werewolf Image
- Position: Fixed, bottom-center
- Width: 400px
- Source: `wolf.jpg`
- Filter: Blue drop-shadow glow
- **wolfPulse animation**: 4s cycle
  - Scale: 1.0 → 1.02
  - Glow intensity pulsates

## Animations

| Animation | Duration | Target | Effect |
|-----------|----------|--------|--------|
| `twinkle1` | 3s | Small stars | Opacity fade |
| `twinkle2` | 4s | Medium stars | Opacity fade |
| `twinkle3` | 5s | Large stars | Triple-phase opacity |
| `textGlow` | 3s | Message | Glow intensity pulse |
| `wolfPulse` | 4s | Wolf image | Scale + glow pulse |

## Responsive Design
- Mobile breakpoint: 768px
- Adjustments:
  - Message: 2rem font, added padding
  - Moon: 80px, repositioned
  - Wolf: 150px width

## Technical Details
- Single HTML file with embedded CSS
- No JavaScript required
- No external dependencies (except wolf.jpg image)
- CSS animations only (no JS animation)
- Flexbox centering for main content

## File Requirements
- `index.html` - Main page
- `wolf.jpg` - Werewolf image asset
