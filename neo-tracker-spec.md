# NEO Close Approach Tracker — Specification

## Overview
A single-page web dashboard displaying live near-Earth object (NEO) data from NASA and JPL's planetary defense APIs. Pulls real orbital data with no backend — all API calls made directly from the browser. Four tabs: a weekly asteroid summary, a filterable close-approach table, a Sentry impact-risk watch list, and a 3D interactive Earth globe.

## Data Sources

### NASA NeoWs (Near Earth Object Web Service)
- **Endpoint**: `https://api.nasa.gov/neo/rest/v1/feed`
- **API key**: `DEMO_KEY` (replace with personal key from api.nasa.gov for higher rate limits)
- **What it provides**: All asteroids with close approaches in a given date window — includes diameter estimates, miss distance (km/AU), relative velocity (km/s), and hazard classification
- **Used in**: Tab 1 (This Week), Tab 4 (3D Globe)

### JPL SBDB Close-Approach Data API
- **Endpoint**: `https://ssd-api.jpl.nasa.gov/cad.api`
- **No API key required**
- **What it provides**: Historical and future close approaches with filtering by max distance, sorting by date/velocity/size
- **Used in**: Tab 2 (Close Approaches)

### JPL Sentry
- **Endpoint**: `https://ssd-api.jpl.nasa.gov/sentry.api`
- **No API key required**
- **What it provides**: ~1,900 objects with non-zero Earth impact probability — includes Torino scale, Palermo scale, impact probability, estimated diameter
- **Used in**: Tab 3 (Sentry Watch)

## Tabs

### Tab 1 — This Week
- Fetches a 7-day window of approaching asteroids from NeoWs
- Stat row: total count, potentially hazardous count, closest approach (LD), fastest velocity (km/s), largest estimated diameter (m)
- Cards sorted by approach date
- Each card shows: asteroid name, approach date, size range (min–max meters), miss distance in lunar distances (LD), velocity in km/s
- Hazardous asteroids flagged with red left-border and "⚠ HAZARDOUS" badge
- Size visualized with proportional pip bar
- Miss distance < 5 LD highlighted in orange

### Tab 2 — Close Approaches
- Pulls upcoming close approaches from JPL SBDB
- Filter controls: max distance (0.05, 0.1, 0.2, 0.5 AU) and sort field (distance, date, velocity, H magnitude)
- Table columns: object name, date (UTC), distance in AU, distance in LD, velocity (km/s), absolute magnitude (H), uncertainty (±σ)
- Objects within 5 LD highlighted in orange
- Filters trigger a live re-fetch on change

### Tab 3 — Sentry Watch
- Loads full Sentry object list sorted by Palermo scale (highest risk first)
- Stat row: total monitored count, highest Torino score, highest Palermo scale value, cumulative impact probability across all objects
- Table columns: object designation, year range, number of impact scenarios, impact probability (%), Palermo scale, Torino scale, estimated diameter (m), risk meter bar
- Torino score color-coded: 0 = green, 1 = yellow, 2–4 = orange, 5–10 = red
- Palermo scale > −2 highlighted in orange
- Risk meter: normalized bar from Palermo −10 (lowest) to 0 (highest)
- Shows top 50 results

### Tab 4 — 3D Globe
- Built with globe.gl (WebGL)
- Renders Earth with dark texture and night-sky background
- Each asteroid from Tab 1 plotted as a colored point
  - Altitude scaled from miss distance in LD (divided by 40, capped at 2.5)
  - Point size scaled from estimated diameter
  - Red = potentially hazardous, cyan = non-hazardous
- Moon placed at reference position (alt = 1/40 ≈ 1 LD)
- Hover labels show name, distance in LD, approach date
- Lazy-loaded: waits for NeoWs data before rendering

## Measurement Conversions
- Miss distances displayed in **Lunar Distances (LD)**: 1 LD = 384,400 km = ~0.00257 AU
- Reference context: Moon = 1 LD, geostationary orbit ≈ 0.11 LD

## Visual Design
- Dark mission-control aesthetic: near-black background (#07070f), cyan accent (#00d4ff)
- Monospace font (Courier New) throughout
- Hazardous objects: red (#ff2244) left border and badge
- Approach within 5 LD: orange highlight (#ff7a00)
- Pulsing green "LIVE" indicator in header
- Tab panels lazy-load — SBDB, Sentry, and Globe only fetch data when their tab is first opened

## Technical Notes
- Single HTML file, no build tools or dependencies beyond globe.gl (CDN)
- `DEMO_KEY` is rate-limited to 30 requests/hour per IP from NASA
- All three APIs support CORS — no proxy or backend required
- Tabs track load state to prevent duplicate fetches
