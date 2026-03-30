# Weather Dashboard — Project Specification

## Overview

A client-side weather dashboard that lets users look up current conditions, a 5-day forecast, and air quality data for any city in the world. Built as a static webpage with no backend required — API calls go directly from the browser to OpenWeatherMap.

**Platform:** Vanilla HTML/CSS/JavaScript — no build tools, no server. Open `index.html` directly in a browser.

**API:** [OpenWeatherMap](https://openweathermap.org/api) (free tier)

---

## Features

### Core
- City search by name (e.g. Omaha, Paris, London) via OpenWeatherMap Geocoding API
- Current weather display: temperature, feels like, weather description, humidity, wind speed, visibility, pressure, sunrise/sunset times
- Weather icon from OpenWeatherMap
- °F / °C unit toggle — switches units and re-fetches live data

### Stretch Challenge 1 — 5-Day Forecast
- Powered by `/data/2.5/forecast` endpoint
- Displays one card per day (nearest reading to noon) for the next 5 days
- Each card shows: day name, weather icon, high temp, low temp

### Stretch Challenge 2 — Air Quality Index
- Powered by `/data/2.5/air_pollution` endpoint
- Displays AQI rating (1–5) with plain-language label: Good, Fair, Moderate, Poor, Very Poor
- Color-coded label per AQI level
- Pollutant breakdown: PM2.5, PM10, O₃ (ozone), NO₂ (nitrogen dioxide) in µg/m³

---

## File Structure

```
weather-dashboard/
├── index.html
├── config.js            # API key — gitignored, never committed
├── config.example.js    # Placeholder template for the repo
├── .gitignore
├── scripts/
│   └── app.js
└── styles/
    └── main.css
```

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/geo/1.0/direct` | Convert city name to lat/lon |
| `/data/2.5/weather` | Current conditions |
| `/data/2.5/forecast` | 5-day / 3-hour forecast |
| `/data/2.5/air_pollution` | Air quality index + pollutants |

All four requests fire in parallel (via `Promise.all`) on each search.

---

## Security

API key is loaded from a local `config.js` file that is listed in `.gitignore`. A `config.example.js` template is committed to the repo in its place. The key is never pushed to GitHub.

This approach corresponds to **Security Level 1 (Static Page)** — the key is client-side and visible in DevTools, which is acceptable for a free-tier OpenWeatherMap key used in a class project.

---

## Running

```bash
open weather-dashboard/index.html
```

1. Copy `config.example.js` → `config.js`
2. Add your OpenWeatherMap API key to `config.js`
3. Open `index.html` in any browser
