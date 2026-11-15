// Slicesky — client logic (R1, R2, R4, R5, R7 + developer JSON view)

const els = {
  form: document.getElementById("search-form"),
  input: document.getElementById("search-input"),
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  errorMessage: document.getElementById("error-message"),
  retry: document.getElementById("retry-button"),
  card: document.getElementById("weather-card"),
  locationName: document.getElementById("location-name"),
  locationRegion: document.getElementById("location-region"),
  localTime: document.getElementById("local-time"),
  conditionEmoji: document.getElementById("condition-emoji"),
  conditionText: document.getElementById("condition-text"),
  temp: document.getElementById("temp"),
  feelsLike: document.getElementById("feels-like"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  uv: document.getElementById("uv"),
  devSection: document.getElementById("dev-section"),
  devToggle: document.getElementById("dev-toggle"),
  devPanel: document.getElementById("dev-panel"),
  copyJson: document.getElementById("copy-json"),
  jsonView: document.getElementById("json-view"),
};

let lastQuery = "Mumbai"; // R7: remember last searched city
let currentData = null;
let requestId = 0;

const POPULAR = Array.from(document.querySelectorAll(".chip[data-city]")).map((b) => b.dataset.city);
const LAST_CITY_KEY = "slicesky:lastCity";

// Map WeatherAPI condition codes / text to a mood emoji
function conditionEmoji(condition) {
  const text = (condition.text || "").toLowerCase();
  const code = condition.code;

  if (code === 1000 || text.includes("sunny") || text.includes("clear")) return "☀️";
  if (text.includes("thunder") || text.includes("storm")) return "⛈️";
  if (text.includes("blizzard") || text.includes("snow") || text.includes("sleet")) return "❄️";
  if (text.includes("drizzle") || text.includes("rain") || text.includes("shower")) return "🌧️";
  if (text.includes("overcast")) return "☁️";
  if (text.includes("fog") || text.includes("mist") || text.includes("haze")) return "🌫️";
  if (text.includes("cloud")) return code === 1003 ? "🌤️" : "☁️";
  return "🌤️";
}

function show(section) {
  [els.loading, els.error, els.card].forEach((s) => (s.hidden = true));
  if (section) section.hidden = false;
}

function showErrorMessage(message, canRetry) {
  els.errorMessage.textContent = message;
  els.retry.hidden = !canRetry;
  show(els.error);
}

function render(data) {
  const { location, current } = data;

  // Duplicate city names: show region + country to disambiguate (PRD edge case)
  els.locationName.textContent = location.name;
  const regionPart = location.region && location.region !== location.name ? `${location.region}, ` : "";
  els.locationRegion.textContent = `${regionPart}${location.country}`;

  const localTime = new Date(location.localtime);
  els.localTime.textContent = `Local time: ${localTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} · ${localTime.toLocaleDateString([], { day: "numeric", month: "short" })}`;

  els.conditionEmoji.textContent = conditionEmoji(current.condition);
  els.conditionText.textContent = current.condition.text;
  els.temp.textContent = Math.round(current.temp_c);
  els.feelsLike.textContent = `${Math.round(current.feelslike_c)} °C`;
  els.humidity.textContent = `${current.humidity}%`;
  els.wind.textContent = `${Math.round(current.wind_kph)} kph`;
  els.uv.textContent = String(current.uv);

  currentData = data;
  els.devSection.hidden = false;
  els.jsonView.textContent = JSON.stringify(data, null, 2);

  show(els.card);
}

async function fetchWeather(city) {
  const id = ++requestId;
  lastQuery = city;
  els.input.value = city;
  show(els.loading);

  try {
    const res = await fetch(`/api/weather?q=${encodeURIComponent(city)}`);

    // Ignore stale responses if a newer search started
    if (id !== requestId) return;

    if (!res.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const body = await res.json();
        if (res.status === 400) {
          // City not found
          message = `We couldn’t find “${city}”. Please check the spelling and try again.`;
        } else if (body && body.error && body.error.message) {
          message = body.error.message;
        }
      } catch (_) {
        /* keep default message */
      }
      showErrorMessage(message, true);
      return;
    }

    const data = await res.json();
    if (id !== requestId) return;

    render(data);
    localStorage.setItem(LAST_CITY_KEY, city); // R7
  } catch (err) {
    if (id !== requestId) return;
    // No internet / network failure
    showErrorMessage(
      "You seem to be offline. Check your internet connection and try again.",
      true
    );
  }
}

// Search form (R1)
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = els.input.value.trim();
  if (city) fetchWeather(city);
});

// Popular city chips (R4)
document.querySelectorAll(".chip[data-city]").forEach((btn) => {
  btn.addEventListener("click", () => fetchWeather(btn.dataset.city));
});

// Retry
els.retry.addEventListener("click", () => fetchWeather(lastQuery));

// Developer toggle (JSON view hidden behind a toggle, per PRD risk resolution)
els.devToggle.addEventListener("click", () => {
  const open = els.devPanel.hidden;
  els.devPanel.hidden = !open;
  els.devToggle.setAttribute("aria-expanded", String(open));
});

// Copy JSON
els.copyJson.addEventListener("click", async () => {
  if (!currentData) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
    els.copyJson.textContent = "Copied!";
    setTimeout(() => (els.copyJson.textContent = "Copy JSON"), 1500);
  } catch (_) {
    // Clipboard unavailable (e.g. insecure context) — fall back to selecting the text
    const range = document.createRange();
    range.selectNode(els.jsonView);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
});

// Boot: default Mumbai (API spec) or last searched city (R7)
const savedCity = localStorage.getItem(LAST_CITY_KEY);
const initialCity = POPULAR.includes(savedCity) ? savedCity : "Mumbai";
fetchWeather(initialCity);
