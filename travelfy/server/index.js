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

// Only forward the last N messages to the model instead of the whole
// conversation every time — without this, tokens grow roughly O(n²) as
// the chat gets longer (each turn re-sends every prior turn in full).
// 12 messages ≈ last 6 back-and-forth turns, plenty for a booking flow.
const HISTORY_LIMIT = 12;

// Frontend calls this. The real API key never reaches the browser.
app.post("/api/chat", async (req, res) => {
  try {
    const { system, messages } = req.body;

    // Trim history to the most recent turns only.
    const trimmedMessages = Array.isArray(messages) && messages.length > HISTORY_LIMIT
      ? messages.slice(-HISTORY_LIMIT)
      : messages;

    // Mark the (long, unchanging) system prompt as cacheable so repeat
    // requests don't pay full input-token price for it every single time.
    const cachedSystem = [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ];

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: cachedSystem,
        messages: trimmedMessages,
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
