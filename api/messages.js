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
    console.error("ANTHROPIC_API_KEY is not set");
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY not configured on server" } });
  }

  console.log("Calling Anthropic with model:", req.body?.model);

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create(req.body);
    console.log("Anthropic response OK, stop_reason:", response.stop_reason);
    res.status(200).json(response);
  } catch (err) {
    console.error("Anthropic API error:", err.status, err.message);
    res.status(err.status || 500).json({ error: { message: err.message } });
  }
}
