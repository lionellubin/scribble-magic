import Anthropic from "@anthropic-ai/sdk";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY not configured" } });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create(req.body);
    res.status(200).json(response);
  } catch (err) {
    console.error("Anthropic error:", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
}
