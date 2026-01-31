// pages/api/user-details.ts
import type { NextApiRequest, NextApiResponse } from 'next';


// Example dynamic address object (replace with DB fetch in real use)
const userWallets = {
  "AVAX-FUJI": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a",
  "MATIC-AMOY": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a",
  "OP-SEPOLIA": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a",
  "ARB-SEPOLIA": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a",
  "ARC-TESTNET": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a",
  "ETH-SEPOLIA": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a",
  "UNI-SEPOLIA": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a",
  "BASE-SEPOLIA": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a",
  "MONAD-TESTNET": "0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a"
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // In real use, get user from session or req.query
  if (req.method === 'GET') {
    res.status(200).json({ wallets: userWallets });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
