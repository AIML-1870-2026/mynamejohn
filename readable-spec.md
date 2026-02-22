# Readable Explorer — Specification

## Overview
An interactive single-page web tool that lets users explore the readability of different background color, text color, and font size combinations. Displays contrast ratio and luminosity values calculated according to WCAG 2.1 guidelines, with live preview of how chosen colors appear — including simulations for common types of color vision deficiency.

## Required Features

### Background Color Controls
- Three RGB sliders (0–255) for Red, Green, Blue channels
- Each slider is synchronized with a paired integer input field
- Changes update the text display area in real time
- Color strip preview shows the selected color with its hex code

### Text Color Controls
- Three RGB sliders (0–255) for Red, Green, Blue channels
- Each slider is synchronized with a paired integer input field
- Changes update the text display area in real time
- Color strip preview shows the selected color with its hex code

### Text Size Control
- Single slider (8–72 px range) with synchronized integer input
- Live display of current size value in pixels
- Changes apply immediately to the text display area

### Text Display Area
- Shows a sample heading and body paragraph
- Rendered with the selected background color, text color, and font size
- Updates in real time as controls change
- When a vision simulation is active, colors in this area reflect the simulated view

### Contrast Ratio Display
- Calculated per WCAG 2.1: `(L1 + 0.05) / (L2 + 0.05)`
  - L1 = relative luminance of the lighter color
  - L2 = relative luminance of the darker color
- Displayed as `X.XX:1`

### Luminosity Displays
- Background luminosity shown as a decimal (0.000–1.000)
- Text luminosity shown as a decimal (0.000–1.000)
- Both calculated using the WCAG relative luminance formula

## Stretch Features

### Option A — Vision Type Simulation
Radio button group with five options:
- Normal Vision
- Protanopia (red-blind — missing red cones)
- Deuteranopia (green-blind — missing green cones)
- Tritanopia (blue-blind — missing blue cones)
- Monochromacy (complete color blindness — grayscale only)

Color transformations use simulation matrices applied in linear RGB space (Viénot, Brettel, Mollon / Machado). Color controls and preset buttons are disabled while a simulation is active. All stats (contrast ratio, luminosity) reflect the simulated colors.

### Option B — WCAG 2.1 Compliance Indicator
Two pass/fail indicators displayed with color coding:
- **Normal Text**: requires 4.5:1 minimum — green PASS / red FAIL badge
- **Large Text**: requires 3.0:1 minimum — green PASS / red FAIL badge
- A label indicates which standard applies at the current font size (large text threshold: ≥ 24 px)

### Option C — Preset Color Schemes
Eight preset buttons in a 2-column grid, each showing color swatches:
- Black on White (high contrast)
- White on Black
- GitHub / Docs (near-black on white)
- Ocean Dark (light blue on very dark navy)
- Warm Cream (dark brown on cream)
- Navy on Ice Blue
- Fails AA ✗ (gray on gray — intentionally bad)
- Problematic Red (dark red on bright red — intentionally bad)

Loading a preset syncs all sliders and number inputs to the preset values.

## Layout
- **Header**: title + subtitle
- **Two-column layout** (stacked on screens < 860 px):
  - **Left panel (controls)**: Background Color, Text Color, Text Size, Preset Schemes, Vision Simulation
  - **Right panel (preview)**: Text Display Area, Stats Row (bg luminosity, contrast ratio, text luminosity), WCAG Compliance

## Technical Notes
- Single HTML file — embedded CSS and JavaScript, no frameworks or dependencies
- Contrast ratio and luminosity calculated from simulated colors when a vision mode is active
- Color blindness matrices applied in linear RGB space (gamma-corrected input → linear → matrix → gamma-correct back)
- Responsive via CSS Grid; panels stack below 860 px viewport width
- Smooth transitions on text display area color changes
