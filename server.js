import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY is not set. Add it to your .env file.");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/api/messages", async (req, res) => {
  try {
    const response = await client.messages.create(req.body);
    res.json(response);
  } catch (err) {
    console.error("Anthropic API error:", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Scribble Magic server running on http://localhost:${PORT}`);
});
