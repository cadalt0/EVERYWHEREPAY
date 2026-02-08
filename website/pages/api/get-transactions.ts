import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * API endpoint to fetch recent transactions from txcoming table
 * GET /api/get-transactions?email=user@example.com&limit=2&offset=0
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const email = req.query.email as string;
      const limit = parseInt(req.query.limit as string) || 2;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ error: 'email parameter is required' });
      }

      console.log('========================================');
      console.log('[GET-TRANSACTIONS API] Request received');
      console.log('[GET-TRANSACTIONS API] Email:', email);
      console.log('[GET-TRANSACTIONS API] Limit:', limit, 'Offset:', offset);

      // Fetch transactions from txcoming table with pagination
      const result = await pool.query(
        `SELECT id, mail, txhash, amount, chain, sender, walletid, status, txtype, created_at, updated_at
         FROM txcoming
         WHERE mail = $1
         ORDER BY created_at DESC, id DESC
         LIMIT $2 OFFSET $3`,
        [email, limit, offset]
      );

      console.log('[GET-TRANSACTIONS API] Query executed, rows returned:', result.rows.length);

      const transactions = result.rows.map((row) => ({
        id: row.id,
        mail: row.mail,
        txhash: row.txhash,
        amount: row.amount,
        chain: row.chain,
        sender: row.sender,
        walletid: row.walletid,
        status: row.status,
        txtype: row.txtype || 'IN',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      console.log('[GET-TRANSACTIONS API] Success! Found', transactions.length, 'transactions for', email);
      console.log('[GET-TRANSACTIONS API] Transactions:', JSON.stringify(transactions, null, 2));
      console.log('========================================');
      
      res.status(200).json({ transactions, success: true });

    } catch (err) {
      console.error('Error in /api/get-transactions', err);
      res.status(500).json({ 
        error: 'Failed to fetch transactions', 
        details: (err as Error).message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
