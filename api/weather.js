// Serverless proxy for WeatherAPI.com — the API key stays on the server (PRD non-functional requirement).

const WEATHER_API_BASE = "https://api.weatherapi.com/v1/current.json";

export default async function handler(req, res) {
  const { q } = req.query;
  const apiKey = process.env.WEATHERAPI_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: {
        code: 500,
        message: "Server is not configured: missing WEATHERAPI_KEY environment variable.",
      },
    });
  }

  if (!q || !String(q).trim()) {
    return res.status(400).json({
      error: {
        code: 400,
        message: "Missing query. Pass a city name via ?q= e.g. /api/weather?q=Mumbai",
      },
    });
  }

  try {
    const url = `${WEATHER_API_BASE}?key=${apiKey}&q=${encodeURIComponent(String(q).trim())}&aqi=no`;
    const upstream = await fetch(url);
    const data = await upstream.json();

    // Pass upstream status through so the client can distinguish "city not found" (400) from other errors.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({
      error: {
        code: 502,
        message: "Could not reach the weather service. Please try again.",
      },
    });
  }
}
