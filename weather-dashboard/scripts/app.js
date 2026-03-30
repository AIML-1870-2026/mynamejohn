const BASE = 'https://api.openweathermap.org';

let unit = 'imperial'; // 'imperial' = °F, 'metric' = °C
let lastCoords = null; // { lat, lon } from last successful search

// --- Unit toggle ---
document.getElementById('btn-f').addEventListener('click', () => setUnit('imperial'));
document.getElementById('btn-c').addEventListener('click', () => setUnit('metric'));

function setUnit(u) {
  unit = u;
  document.getElementById('btn-f').classList.toggle('active', u === 'imperial');
  document.getElementById('btn-c').classList.toggle('active', u === 'metric');
  if (lastCoords) fetchAll(lastCoords.lat, lastCoords.lon);
}

// --- Search ---
document.getElementById('search-btn').addEventListener('click', doSearch);
document.getElementById('city-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

async function doSearch() {
  const city = document.getElementById('city-input').value.trim();
  if (!city) return;
  clearError();
  try {
    const geo = await fetchJson(
      `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${WEATHER_API_KEY}`
    );
    if (!geo.length) { showError(`City "${city}" not found.`); return; }
    const { lat, lon } = geo[0];
    lastCoords = { lat, lon };
    await fetchAll(lat, lon);
  } catch (err) {
    showError('Something went wrong. Check your API key or connection.');
    console.error(err);
  }
}

async function fetchAll(lat, lon) {
  const [current, forecast, aqi] = await Promise.all([
    fetchJson(`${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${WEATHER_API_KEY}`),
    fetchJson(`${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${WEATHER_API_KEY}`),
    fetchJson(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`)
  ]);
  renderCurrent(current);
  renderForecast(forecast);
  renderAQI(aqi);
}

// --- Current weather ---
function renderCurrent(d) {
  const unitLabel = unit === 'imperial' ? '°F' : '°C';
  const windUnit = unit === 'imperial' ? 'mph' : 'm/s';

  document.getElementById('city-name').textContent = `${d.name}, ${d.sys.country}`;
  document.getElementById('temp-value').textContent = Math.round(d.main.temp);
  document.getElementById('temp-unit').textContent = unitLabel;
  document.getElementById('weather-desc').textContent = d.weather[0].description;
  document.getElementById('weather-icon').src =
    `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`;
  document.getElementById('weather-icon').alt = d.weather[0].description;
  document.getElementById('feels-like').textContent = `${Math.round(d.main.feels_like)}${unitLabel}`;
  document.getElementById('humidity').textContent = `${d.main.humidity}%`;
  document.getElementById('wind').textContent = `${Math.round(d.wind.speed)} ${windUnit}`;
  document.getElementById('visibility').textContent = `${(d.visibility / 1000).toFixed(1)} km`;
  document.getElementById('pressure').textContent = `${d.main.pressure} hPa`;

  const sunrise = formatTime(d.sys.sunrise, d.timezone);
  const sunset = formatTime(d.sys.sunset, d.timezone);
  document.getElementById('sun-times').textContent = `${sunrise} / ${sunset}`;

  document.getElementById('current-weather').classList.remove('hidden');
}

function formatTime(unixUtc, tzOffsetSeconds) {
  const date = new Date((unixUtc + tzOffsetSeconds) * 1000);
  const h = date.getUTCHours();
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

// --- 5-day forecast (one entry per day at ~noon) ---
function renderForecast(data) {
  const daily = {};
  for (const item of data.list) {
    const date = item.dt_txt.split(' ')[0];
    const hour = parseInt(item.dt_txt.split(' ')[1]);
    if (!daily[date] || Math.abs(hour - 12) < Math.abs(parseInt(daily[date].dt_txt.split(' ')[1]) - 12)) {
      daily[date] = item;
    }
  }

  const days = Object.values(daily).slice(0, 5);
  const unitLabel = unit === 'imperial' ? '°F' : '°C';
  const container = document.getElementById('forecast-cards');
  container.innerHTML = '';

  for (const day of days) {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const high = Math.round(day.main.temp_max);
    const low = Math.round(day.main.temp_min);
    const icon = day.weather[0].icon;
    const desc = day.weather[0].description;

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="day">${dayName}</div>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}">
      <div class="f-temp-high">${high}${unitLabel}</div>
      <div class="f-temp-low">${low}${unitLabel}</div>
    `;
    container.appendChild(card);
  }

  document.getElementById('forecast-section').classList.remove('hidden');
}

// --- Air quality ---
const AQI_LABELS = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
const AQI_COLORS = ['', '#4ade80', '#a3e635', '#facc15', '#fb923c', '#f87171'];

function renderAQI(data) {
  const { main, components } = data.list[0];
  const idx = main.aqi;

  document.getElementById('aqi-index').textContent = idx;
  const label = document.getElementById('aqi-label');
  label.textContent = AQI_LABELS[idx];
  label.style.color = AQI_COLORS[idx];

  document.getElementById('aqi-pm25').textContent = `${components.pm2_5.toFixed(1)} µg/m³`;
  document.getElementById('aqi-pm10').textContent = `${components.pm10.toFixed(1)} µg/m³`;
  document.getElementById('aqi-o3').textContent = `${components.o3.toFixed(1)} µg/m³`;
  document.getElementById('aqi-no2').textContent = `${components.no2.toFixed(1)} µg/m³`;

  document.getElementById('air-quality-section').classList.remove('hidden');
}

// --- Helpers ---
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearError() {
  document.getElementById('error-msg').classList.add('hidden');
}
