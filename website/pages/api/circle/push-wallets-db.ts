import type { NextApiRequest, NextApiResponse } from 'next';
import { insertUser } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { gmail, walletSetId, walletSetName, addresses, walletSetRaw, walletsRaw } = req.body;
  if (!gmail || !walletSetId || !walletSetName || !addresses) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Insert user with wallet info and raw data
    await insertUser({
      gmail,
      walletSetId,
      walletSetName,
      addresses,
      walletSetRaw,
      walletsRaw,
    });
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
