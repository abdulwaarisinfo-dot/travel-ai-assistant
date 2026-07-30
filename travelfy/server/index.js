import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.warn("WARNING: ANTHROPIC_API_KEY is not set. /api/chat will fail until it is.");
}

// Frontend calls this. The real API key never reaches the browser.
app.post("/api/chat", async (req, res) => {
  try {
    const { system, messages } = req.body;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages,
      }),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "proxy_failed" });
  }
});

// Serve the built React app (npm run build -> dist/)
app.use(express.static(path.join(__dirname, "..", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Travelfy server running on port ${PORT}`));
