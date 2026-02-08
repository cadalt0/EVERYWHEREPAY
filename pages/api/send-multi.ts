
// Simple API handler for transfer-out
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method !== "POST") return res.status(405).end();

  // Log incoming request body for debugging
  console.log("[send-multi] Incoming request body:", req.body);

  const { email, recipients } = req.body;
  // Support recipients array (single or multi)
  if (!email || !Array.isArray(recipients) || recipients.length === 0) {
    console.error("[send-multi] Missing parameter(s):", { email, recipients });
    res.status(400).json({ error: "Missing required parameters", details: { email, recipients } });
    return;
  }

  // For now, only handle the first recipient
  const { address, chain, amount } = recipients[0] || {};
  if (!address || !chain || !amount) {
    console.error("[send-multi] Missing recipient parameter(s):", { address, chain, amount });
    res.status(400).json({ error: "Missing recipient parameters", details: { address, chain, amount } });
    return;
  }

  const apiKey = process.env.X_API_KEY;
  const settleApiUrl = process.env.NEXT_PUBLIC_SETTLE_API_URL;
  if (!apiKey || !settleApiUrl) {
    res.status(500).json({ error: "Missing API key or settle API URL in env" });
    return;
  }

  const url = `${settleApiUrl}/api/transfer-out/${email}/${address}/${chain}?amount=${amount}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Backend transfer-out request failed", details: err?.message || String(err) });
  }
}
