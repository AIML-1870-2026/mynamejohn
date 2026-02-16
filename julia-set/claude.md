# Julia Set / Fractal Explorer

Interactive fractal visualization tool supporting Julia sets, Mandelbrot set, and Burning Ship fractals.

## Features

### Fractal Types
- **Julia Set**: f(z) = z² + c with fixed c parameter
- **Mandelbrot Set**: f(z) = z² + c where c varies per pixel
- **Burning Ship**: Uses |Re(z)| and |Im(z)| before squaring
- **Burning Ship Julia**: Burning Ship iteration with fixed c

### Controls
- **Scroll**: Zoom toward cursor
- **Drag**: Pan view
- **Double-click**: Zoom in at point
- **Right-click**: Trace iteration path (education mode)

### Parameter Selection
- Click on Mandelbrot preview to select c value
- 12 named presets (Dendrite, Spiral, Dragon, Lightning, etc.)
- Real-time sliders for Real(c) and Imag(c)

### Color System
- 12 built-in schemes: Electric, Fire, Ocean, Rainbow, Midnight, Gold, Neon, Plasma, Ice, Forest, Sunset, Grayscale
- Custom gradient editor with draggable color stops
- Color cycling animation
- Configurable interior color (black/white/gradient)

### Animation
- **Parameter morphing**: Animate c along paths (circle, cardioid, figure-8, spiral, random walk, preset interpolation)
- **Auto-zoom**: Continuous zoom with speed control
- **Zoom targets**: Pre-defined interesting locations in Mandelbrot set

### Export
- Quick save to PNG
- High-resolution rendering (up to 8K)
- Supersampling (2x, 4x) for anti-aliasing

### Educational Features
- **Split view**: Mandelbrot and Julia side-by-side
- **Info panel**: Explains current fractal type with formula
- **Iteration visualizer**: Shows orbit of individual points

## Technical Details

### Rendering
- Canvas 2D rendering with smooth coloring
- Escape-time algorithm with configurable max iterations
- Smooth iteration count for gradient coloring

### Performance
- Real-time parameter updates
- Chunked high-res rendering to prevent UI blocking

## File Structure
```
julia-set/
└── index.html    # Single-file application
```

## Mathematical Background

Julia sets are defined for complex quadratic polynomials f(z) = z² + c. For each value of c, the Julia set is the boundary between points whose orbits escape to infinity and those that remain bounded.

The Mandelbrot set is the set of c values for which the Julia set is connected (equivalently, for which z = 0 does not escape).

The Burning Ship fractal modifies the iteration to z → (|Re(z)| + i|Im(z)|)² + c, creating distinctive flame-like patterns.
