// Public API to get request details by requestid
import { getRequetByRequestId } from '../requestsDb.js';

export async function handleGetRequestById(req, res) {
  const { requestid } = req.params;
  if (!requestid) {
    return res.status(400).json({ error: 'Missing requestid' });
  }
  try {
    const row = await getRequetByRequestId(requestid);
    if (!row) {
      return res.status(404).json({ error: 'Request not found' });
    }
    return res.status(200).json({ success: true, request: row });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
import { insertRequet } from '../requestsDb.js';

// Public API to create a new request
export async function handleCreateRequest(req, res) {
  const { requestid, user, amount } = req.params;
  let { message } = req.params;
  if (typeof message === 'undefined') message = '';
  console.log(`[RequestAPI] Incoming request: requestid=${requestid}, user=${user}, amount=${amount}, message=${message}`);
  if (!requestid || !user || !amount) {
    console.error('[RequestAPI] Missing parameter(s)');
    return res.status(400).json({ error: 'Missing requestid, user, or amount' });
  }
  try {
    const row = await insertRequet({ requestid, user, amount, message });
    console.log('[RequestAPI] Inserted row:', row);
    return res.status(201).json({ success: true, request: row });
  } catch (err) {
    console.error('[RequestAPI] Error inserting request:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
import { transferOutUSDC } from './transferOut.js';
import { getUserByGmail, saveTxcoming, getPool } from '../db.js';
import { createHash } from 'crypto';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

// Express handler for Arc-to-X USDC transfer
export async function handleTransferOutRequest(req, res) {
      // Constants for ARC-TESTNET delegate logic
      const ARC_CHAIN = { blockchain: 'ARC-TESTNET', usdc: '0x3600000000000000000000000000000000000000' };
      const GATEWAY_WALLET = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9';
      const DELEGATE_WALLET_ADDRESS = '0x33a4f74d44225272fa0e75a11efa68af79b325f5';
    // API key check
    const providedKey = req.headers['x-api-key'];
    const expectedHash = process.env.API_TRANSFER_OUT_KEY_HASH;
    if (!providedKey || !expectedHash) {
      return res.status(401).json({ error: 'Missing or invalid API key' });
    }
    const providedHash = createHash('sha256').update(providedKey).digest('hex');
    if (providedHash !== expectedHash) {
      return res.status(401).json({ error: 'Missing or invalid API key' });
    }
  const { mail, recipientAddress, chain } = req.params;
  const { amount } = req.query;

  if (!mail || !recipientAddress || !chain) {
    return res.status(400).json({ error: 'Missing mail, recipientAddress, or chain parameter' });
  }
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Missing or invalid amount' });
  }
  const allowedDestinations = ['BASE-SEPOLIA', 'ARC-TESTNET', 'AVAX-FUJI', 'ETH-SEPOLIA'];
  const normalizedChain = chain.trim().toUpperCase();
  const match = allowedDestinations.find(c => c.toUpperCase() === normalizedChain);
  if (!match) {
    return res.status(400).json({ error: `Invalid destination chain. Must be one of: ${allowedDestinations.join(', ')}` });
  }
  try {
    // Fetch user for walletid
    const user = await getUserByGmail(mail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Extract any address from user.addresses (all are the same)
    let depositorAddress = null;
    if (user.addresses && typeof user.addresses === 'object') {
      depositorAddress = Object.values(user.addresses)[0];
    }
    if (!depositorAddress) {
      throw new Error('User wallet public address not found');
    }
    console.log(`[TransferOut] Using wallet address ${depositorAddress} to add delegate on ARC-TESTNET.`);
    console.log(`[TransferOut] Delegate params: usdc=${ARC_CHAIN.usdc}, delegate=${DELEGATE_WALLET_ADDRESS}`);
    // Check for wallet row
    if (!user.wallet || user.wallet === 'delegated') {
      console.log(`[TransferOut] Wallet row not found for user ${mail}. Adding delegate on ARC-TESTNET...`);
      // Constants now defined above
      const client = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET,
      });
      async function waitForTx(txId) {
        while (true) {
          const { data } = await client.getTransaction({ id: txId });
          const state = data?.transaction?.state;
          if (["COMPLETE", "CONFIRMED"].includes(state)) return;
          if (["FAILED", "DENIED", "CANCELLED"].includes(state)) throw new Error(`Failed: ${state}`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
      try {
        // Extract any address from user.addresses (all are the same)
        let depositorAddress = null;
        if (user.addresses && typeof user.addresses === 'object') {
          depositorAddress = Object.values(user.addresses)[0];
        }
        if (!depositorAddress) {
          throw new Error('User wallet public address not found');
        }
        const tx = await client.createContractExecutionTransaction({
          walletAddress: depositorAddress,
          blockchain: ARC_CHAIN.blockchain,
          contractAddress: GATEWAY_WALLET,
          abiFunctionSignature: 'addDelegate(address,address)',
          abiParameters: [ARC_CHAIN.usdc, DELEGATE_WALLET_ADDRESS],
          fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
        });
        await waitForTx(tx.data?.id);
        console.log(`[TransferOut] Delegate added on ARC-TESTNET for user ${mail}`);
        // Update DB to mark wallet row as present
        const p = getPool();
        await p.query('UPDATE everywherepay SET wallet = $1 WHERE gmail = $2', ['delegated', mail]);
        console.log(`[TransferOut] Wallet row updated in DB for user ${mail}`);
      } catch (err) {
        console.error(`[TransferOut] Failed to add delegate for user ${mail}:`, err);
        return res.status(500).json({ error: 'Failed to add delegate for user', details: err.message });
      }
    }
    const result = await transferOutUSDC({
      amount,
      destinationChain: chain.toLowerCase(),
      recipientAddress,
    });
    // Save to txcoming if transfer succeeded
    if (result && result.success && result.txId) {
      await saveTxcoming({
        mail,
        walletid: user.walletSetId,
        txhash: result.txId,
        amount: String(amount),
        chain: chain.toUpperCase(),
        sender: 'ARC-TESTNET',
        txtype: 'OUT',
        status: 'completed',
      });
    }
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[API] Transfer out failed:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Transfer out failed',
      details: err.stack,
    });
  }
}
