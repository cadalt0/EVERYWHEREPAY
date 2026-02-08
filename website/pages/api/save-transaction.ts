import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchWalletsByEmail } from '@/lib/fetch-wallets';
import { saveTxcoming, txcomingTableExists, createTxcomingTable, getUserByGmail } from '@/lib/db';

/**
 * Backend API to safely save incoming USDC transactions
 * Frontend only sends: txhash, amount, chain, sender
 * Backend securely adds: email (from auth), walletid (from DB)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Validate required fields from frontend
      const { txhash, amount, chain, sender } = req.body;
      
      // Strict validation - all fields are required and cannot be empty
      if (!txhash || typeof txhash !== 'string' || txhash.trim() === '') {
        console.error('Invalid txhash in /api/save-transaction', { txhash });
        return res.status(400).json({ error: 'txhash is required and cannot be empty' });
      }

      if (!amount || typeof amount !== 'string' || amount.trim() === '') {
        console.error('Invalid amount in /api/save-transaction', { amount });
        return res.status(400).json({ error: 'amount is required and cannot be empty' });
      }

      if (!chain || typeof chain !== 'string' || chain.trim() === '') {
        console.error('Invalid chain in /api/save-transaction', { chain });
        return res.status(400).json({ error: 'chain is required and cannot be empty' });
      }

      if (!sender || typeof sender !== 'string' || sender.trim() === '') {
        console.error('Invalid sender in /api/save-transaction', { sender });
        return res.status(400).json({ error: 'sender is required and cannot be empty' });
      }

      // Get authenticated user's email from frontend (passed from localStorage on frontend)
      const email = req.query.email as string;
      if (!email || typeof email !== 'string' || email.trim() === '') {
        console.error('Missing or invalid email in /api/save-transaction request');
        return res.status(400).json({ error: 'email parameter is required and cannot be empty' });
      }

      console.log('Saving transaction:', { email, txhash, amount, chain, sender });

      // Ensure table exists
      const tableExists = await txcomingTableExists();
      if (!tableExists) {
        console.log('txcoming table does not exist, creating...');
        await createTxcomingTable();
      }

      // Fetch user's walletSetId from database
      const user = await getUserByGmail(email);
      if (!user) {
        console.error('User not found in database', { email });
        return res.status(400).json({ error: 'User not found' });
      }

      if (!user.walletSetId || typeof user.walletSetId !== 'string' || user.walletSetId.trim() === '') {
        console.error('User walletSetId is missing or invalid', { email, walletSetId: user.walletSetId });
        return res.status(400).json({ error: 'User walletSetId is required and invalid' });
      }

      const walletid = user.walletSetId;

      // Save transaction to database
      // The DB function will check for duplicates (txhash)
      const result = await saveTxcoming({
        mail: email,
        txhash,
        amount: String(amount),
        chain,
        sender,
        walletid,
        status: 'pending'
      });

      if (result.isDuplicate) {
        console.log('Transaction already exists, skipping', { txhash });
        return res.status(200).json({ message: 'Transaction already exists', duplicate: true });
      }

      console.log('Transaction saved successfully', { txhash, email });
      res.status(200).json({ message: 'Transaction saved', txhash, success: true });

    } catch (err) {
      console.error('Error in /api/save-transaction', err);
      res.status(500).json({ 
        error: 'Failed to save transaction', 
        details: (err as Error).message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
