# Slicesky ⛅

A mobile-friendly single-page weather checker. One search, one glance — temperature, condition, feels-like, humidity, wind and UV for any city, powered by [WeatherAPI.com](https://www.weatherapi.com/).

Built to the **Slicesky PRD v1** scope: search, popular city shortcuts, core weather card, clear loading/error states, and a developer JSON view.

## Features (v1)

- **R1** Search weather by city name
- **R2** Weather card: condition, °C temperature, feels-like, humidity, wind (kph), UV index
- **R3** Mobile-responsive layout
- **R4** Popular Cities one-tap shortcuts (Mumbai, Delhi, Bengaluru, …)
- **R5** Loading ("Fetching weather…"), error ("We couldn't find that city") and offline states
- **R7** Remembers the last searched city (localStorage)
- Developer JSON view hidden behind a toggle, with a copy button
- Footer credit to WeatherAPI.com

Default city on first load: **Mumbai** (per the API spec).

## How it works

```
Browser  ──GET /api/weather?q=<city>──▶  Vercel serverless function  ──▶  WeatherAPI /v1/current.json
```

The WeatherAPI key **never reaches the browser** — the serverless function (`api/weather.js`) reads it from the `WEATHERAPI_KEY` environment variable and proxies the request. Upstream status codes are passed through so the client can show the correct error (e.g. 400 → "city not found"). Responses are cached at the edge for 5 minutes to protect the API free-tier quota.

## Project structure

```
index.html      # Single page: search, popular cities, weather card, states, footer
style.css       # Mobile-first styles
app.js          # Client logic: fetch, render, states, dev JSON view
api/weather.js  # Serverless proxy to WeatherAPI.com (keeps the key server-side)
.env.example    # Template for the API key variable
```

## Local development

Vercel CLI serves both the static files and the serverless function (so `/api/weather` works locally):

```bash
npx vercel dev
```

Then open http://localhost:3000.

## Deployment

Hosted on Vercel. Set `WEATHERAPI_KEY` in the Vercel project's environment variables (Project → Settings → Environment Variables). It is **not** committed to the repo — `.env` is gitignored.

## Non-goals (v1, per PRD)

No accounts, push notifications, forecasts, native app, or maps. Auto-location (R6) and the advice line (R9) are planned for v1.1; the °F toggle (R8) for v2.

---

Data provided by [WeatherAPI.com](https://www.weatherapi.com/).
