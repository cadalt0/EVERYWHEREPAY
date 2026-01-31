import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByGmail } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    const user = await getUserByGmail(email);
    res.status(200).json({ exists: !!user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
