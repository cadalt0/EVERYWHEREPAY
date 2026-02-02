import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter' });
  }

  const externalApiUrl = process.env.NEXT_PUBLIC_WALLETS_API_URL;
  if (!externalApiUrl) {
    console.error('[fetch-wallets-proxy] NEXT_PUBLIC_WALLETS_API_URL not configured');
    return res.status(500).json({ error: 'API URL not configured' });
  }

  const targetUrl = `${externalApiUrl}/api/wallets?email=${encodeURIComponent(email)}`;
  
  console.log('========================================');
  console.log('[FETCH-WALLETS-PROXY] Calling external API');
  console.log('[FETCH-WALLETS-PROXY] URL:', targetUrl);
  console.log('[FETCH-WALLETS-PROXY] Email:', email);

  try {
    const startTime = Date.now();
    const response = await fetch(targetUrl);
    const duration = Date.now() - startTime;
    
    console.log('[FETCH-WALLETS-PROXY] Response status:', response.status);
    console.log('[FETCH-WALLETS-PROXY] Response time:', duration, 'ms');

    if (!response.ok) {
      console.error('[FETCH-WALLETS-PROXY] External API error:', response.statusText);
      return res.status(response.status).json({ 
        error: 'External API error', 
        status: response.status 
      });
    }

    const data = await response.json();
    console.log('[FETCH-WALLETS-PROXY] Response data:', JSON.stringify(data, null, 2));
    console.log('========================================');

    return res.status(200).json(data);
  } catch (err) {
    console.error('[FETCH-WALLETS-PROXY] Request failed:', err);
    console.log('========================================');
    return res.status(500).json({ 
      error: 'Failed to fetch from external API', 
      details: (err as Error).message 
    });
  }
}
