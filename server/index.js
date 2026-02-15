import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors()); // for local dev; restrict in prod
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 5050;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in server/.env");
}

app.post("/api/agent", async (req, res) => {
  try {
    const { message, weatherData, city } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' string." });
    }
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server not configured (missing API key)." });
    }

    // Keep payload small + stable
    const context = weatherData
      ? {
          city: city ?? weatherData?.city?.name,
          country: weatherData?.city?.country,
          now: weatherData?.list?.[0] ?? null,
          next8: Array.isArray(weatherData?.list) ? weatherData.list.slice(0, 8) : []
        }
      : null;

    const systemInstruction = `
You are an AI Weather Assistant inside a weather dashboard.
- Be concise and practical.
- Use the provided forecast context JSON if present.
- If user asks for outfit/umbrella/best time, give a clear recommendation.
- If context is missing, ask them to select a city or use current location.
- Do not invent data.
`;

    const userContent = context
      ? `Forecast context (JSON): ${JSON.stringify(context)}\n\nUser: ${message}`
      : `User: ${message}`;

    // Gemini REST endpoint (Generative Language API)
    const MODEL = "models/gemini-2.5-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent` +
      `?key=${encodeURIComponent(GEMINI_API_KEY)}`;


    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300
        }
      })
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini error:", data);
      return res.status(500).json({ error: "Gemini request failed." });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "Sorry—no reply returned.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Agent request failed." });
  }
});

app.get("/api/models", async (req, res) => {
  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models" +
      `?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to list models" });
  }
});

app.listen(PORT, () => {
  console.log(`Agent server running on http://localhost:${PORT}`);
});
