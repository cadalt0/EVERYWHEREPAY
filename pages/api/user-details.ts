// pages/api/user-details.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchWalletsByEmail } from '@/lib/fetch-wallets';

const walletCache = new Map<string, { wallets: any; ts: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get email from query (frontend must send it from localStorage)
    const email = req.query.email as string;
    if (!email) {
      console.error('Missing email in /api/user-details request', { query: req.query });
      return res.status(400).json({ error: 'Missing email', query: req.query });
    }
    try {
      const cached = walletCache.get(email);
      const now = Date.now();
      if (cached && (now - cached.ts) < CACHE_TTL_MS) {
        return res.status(200).json({ wallets: cached.wallets, cached: true });
      }

      const wallets = await fetchWalletsByEmail(email);
      walletCache.set(email, { wallets, ts: now });
      res.status(200).json({ wallets, cached: false });
    } catch (err) {
      console.error('Failed to fetch wallets in /api/user-details', err);
      res.status(500).json({ error: 'Failed to fetch wallets', details: (err as Error).message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
