// Serverless proxy (Vercel). Keeps WEATHER_API_KEY on the server.
// GET /api/weather?q=Mumbai
export default async function handler(req, res) {
  const q = String(req.query?.q || "").trim();
  if (!q) return res.status(400).json({ error: { code: 0, message: "Missing city" } });

  const key = process.env.WEATHER_API_KEY;
  if (!key) return res.status(500).json({ error: { code: 0, message: "Server not configured" } });

  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(502).json({ error: { code: 0, message: "Weather service unreachable" } });
  }
}
