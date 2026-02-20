# RGB Color Studio — Specification

## Overview
An interactive RGB Color Studio that teaches color mixing through an animated spotlight explorer where draggable red, green, and blue light circles blend additively on a dark stage, paired with a palette generator that creates harmonious color schemes (complementary, analogous, triadic, split-complementary) from any selected color — plus WCAG accessibility tools including a contrast checker and color blindness simulator.

## Features

### Animated Color Explorer
- Three draggable spotlight circles (Red, Green, Blue) on a dark stage
- Additive light blending where spotlights overlap (R+G=Yellow, G+B=Cyan, R+B=Magenta, R+G+B=White)
- RGB sliders to control each spotlight's intensity (0–255)
- Subtle pulsing/breathing glow animation on each spotlight
- Mixed color result display with hex code and RGB values
- Smooth animated transitions when values change
- Particle effects in overlap zones

### Palette Generator
- Base color picker (click on explorer result or use a color wheel input)
- Harmony types: Complementary, Analogous, Triadic, Split-Complementary, Tetradic
- Palette swatches with hex codes, RGB values, and approximate color names
- Click-to-copy hex codes to clipboard
- "Randomize" button for inspiration
- Animated swatch reveal (staggered fade-in)
- Visual preview: mini UI mockup showing palette applied to a card layout

### Accessibility Tools (Stretch)
- **Contrast Checker**: Select any two colors, calculate WCAG contrast ratio, show AA/AAA pass/fail badges
- **Color Blindness Simulator**: Toggle protanopia, deuteranopia, tritanopia views of the current palette
- **Accessible Palette Mode**: Option to auto-adjust palette so all colors meet minimum contrast with a background

## Layout
- **Header**: "RGB Color Studio" title with a subtle RGB gradient underline
- **Two-panel layout** (side by side on desktop, stacked on mobile):
  - **Left panel**: Animated Color Explorer (spotlight stage + sliders)
  - **Right panel**: Palette Generator (harmony selector + swatches + preview)
- **Bottom section**: Accessibility tools (contrast checker + color blindness sim)
- Dark mode by default (#0a0a0a background) — light circles pop against dark

## Explorer Details
- **Visual metaphor**: Theater spotlights on a dark stage floor
- **Controls**: Three vertical sliders (R, G, B) on the left side of the stage, each color-coded
- **Blending**: CSS mix-blend-mode: screen on semi-transparent radial gradients to simulate additive light mixing
- **Animations**: Each spotlight has a gentle pulse (scale 1.0–1.05, opacity 0.8–1.0) on a 3s cycle, offset for each color
- **Interaction**: Drag spotlights around the stage; overlap zones show real-time additive blending
- **Result display**: Box below stage showing the mixed color at center overlap point, with hex/RGB

## Palette Generator Details
- **Harmony calculations**: Convert base RGB to HSL, rotate hue by appropriate degrees
  - Complementary: +180°
  - Analogous: -30°, 0°, +30°
  - Triadic: 0°, +120°, +240°
  - Split-complementary: +150°, +210°
  - Tetradic: 0°, +90°, +180°, +270°
- **Swatch display**: Rounded rectangles with color fill, hex code below, click to copy
- **Preview**: Small card UI (header, body, button, accent) using palette colors
- **Color naming**: Simple algorithm mapping HSL ranges to common color names

## Interactions
- Drag spotlights → blending updates in real-time
- Adjust sliders → spotlight intensity changes with smooth CSS transition
- Click "Use This Color" on explorer → sets palette generator base color
- Select harmony type → palette swatches animate in with staggered delay
- Click swatch → copies hex to clipboard with toast notification
- Toggle color blindness mode → all colors on page transform through simulation matrices
- Enter two colors in contrast checker → instant ratio display with pass/fail badges

## Visual Style
- **Background**: Very dark (#0a0a0a) with subtle noise texture
- **Typography**: System font stack, clean sans-serif
- **Accent colors**: Soft white text, subtle borders (#222)
- **Spotlights**: Vibrant, glowing radial gradients with soft edges
- **Cards/panels**: Dark glass-morphism (rgba backgrounds, subtle blur)
- **Animations**: Smooth, not distracting — easing functions, 300ms transitions
- **Responsive**: Flexbox layout, panels stack on screens < 900px

## Technical Notes
- Single HTML file with embedded CSS and JavaScript (no frameworks)
- Canvas API for spotlight blending (more accurate than CSS blend modes)
- No external dependencies
- Works in all modern browsers
- requestAnimationFrame for smooth spotlight animations
- Pointer events for drag interaction
- Clipboard API for copy-to-clipboard
