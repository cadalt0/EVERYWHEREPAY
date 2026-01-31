// pages/api/auth/google-user.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { insertUser } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { gmail, wallet } = req.body;
  if (!gmail) {
    return res.status(400).json({ error: 'Missing gmail' });
  }
  try {
    const user = await insertUser({ gmail, wallet });
    return res.status(200).json({ user });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to insert user', details: e });
  }
}
