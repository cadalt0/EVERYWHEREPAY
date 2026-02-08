import dotenv from 'dotenv';
dotenv.config();
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import axios from 'axios';

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.ENTITY_SECRET;
const ENTITY_PUBLIC_KEY = process.env.ENTITY_PUBLIC_KEY;

async function getEntitySecretCiphertext() {
  const forgeModule = await import('node-forge');
  const forge = forgeModule.default || forgeModule;
  if (!ENTITY_SECRET) throw new Error('ENTITY_SECRET environment variable is not set');
  if (!ENTITY_PUBLIC_KEY) throw new Error('ENTITY_PUBLIC_KEY environment variable is not set');
  const publicKeyString = ENTITY_PUBLIC_KEY;
  const hexEncodedEntitySecret = ENTITY_SECRET;
  // Convert hex string to bytes using Buffer for Node.js compatibility
  const entitySecretBuffer = Buffer.from(hexEncodedEntitySecret, 'hex');
  if (entitySecretBuffer.length !== 32) throw new Error('invalid entity secret');
  const entitySecret = entitySecretBuffer.toString('binary');
  const publicKey = forge.pki.publicKeyFromPem(publicKeyString);
  const encryptedData = publicKey.encrypt(entitySecret, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });
  return forge.util.encode64(encryptedData);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, count = 1 } = req.body;
  const blockchains = [
    "ARB-SEPOLIA",
    "ARC-TESTNET",
    "AVAX-FUJI",
    "BASE-SEPOLIA",
    "ETH-SEPOLIA",
    "MONAD-TESTNET",
    "OP-SEPOLIA",
    "MATIC-AMOY",
    "UNI-SEPOLIA",
    
  ];
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    // Generate a new ciphertext for wallet set creation
    const entitySecretCiphertext1 = await getEntitySecretCiphertext();
    const walletSetIdempotencyKey = crypto.randomUUID();
    const walletSetResp = await axios.post(
      'https://api.circle.com/v1/w3s/developer/walletSets',
      {
        idempotencyKey: walletSetIdempotencyKey,
        name: email,
        entitySecretCiphertext: entitySecretCiphertext1,
      },
      {
        headers: {
          Authorization: `Bearer ${CIRCLE_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    const walletSetId = walletSetResp?.data?.data?.walletSet?.id;
    if (!walletSetId) throw new Error('No walletSetId');

    // Generate a new ciphertext for wallet creation
    const entitySecretCiphertext2 = await getEntitySecretCiphertext();
    const walletIdempotencyKey = crypto.randomUUID();
    const walletsResp = await axios.post(
      'https://api.circle.com/v1/w3s/developer/wallets',
      {
        idempotencyKey: walletIdempotencyKey,
        accountType: 'SCA',
        blockchains,
        count,
        entitySecretCiphertext: entitySecretCiphertext2,
        walletSetId,
      },
      {
        headers: {
          Authorization: `Bearer ${CIRCLE_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    // Call the DB API to push wallet info
    let dbResponse = null;
    try {
      // Always fill all columns with fallback values if missing
      const walletsArr = walletsResp.data?.data?.wallets || [];
      const addresses = walletsArr.reduce((acc: Record<string, string>, w: any) => {
        if (w.blockchain && w.address) acc[w.blockchain] = w.address;
        return acc;
      }, {});
      const dbApiResp = await axios.post(
        `${req.headers.origin || 'http://localhost:3000'}/api/circle/push-wallets-db`,
        {
          gmail: email,
          walletSetId: walletSetId || '',
          walletSetName: email || '',
          addresses,
          walletSetRaw: walletSetResp.data || {},
          walletsRaw: walletsResp.data || {},
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      dbResponse = dbApiResp.data;
    } catch (dbErr: any) {
      dbResponse = { error: dbErr?.response?.data || dbErr.message };
    }
    const responseObj = {
      walletSetId,
      walletSetName: email,
      walletSetRaw: walletSetResp.data,
      walletsRaw: walletsResp.data,
      dbResponse,
    };
    console.log('API /api/circle/create-wallets response:', JSON.stringify(responseObj, null, 2));
    res.status(200).json(responseObj);
  } catch (e: any) {
    console.error('API error:', e?.response?.data || e.message);
    res.status(500).json({ error: e?.response?.data || e.message });
  }
}
