/**
 * Bridge API Route Handler
 * Manually trigger bridge from any chain to ARC-TESTNET
 * Gateway deposit is only done here if no WebSocket subscriber exists
 */

import { getUserByGmail, saveTxcoming, updateTxcomingStatus, updatePreviousReceivedToBridged, getPool, updatePreviousStuckGToCompleted } from '../db.js';
import { bridgeToArc } from '../bridge/engine.js';
import { depositToGatewayWallet } from '../gateway/deposit.js';
import { getUsdcBalance } from './helpers.js';

const TRANSFER_SPEED = process.env.TRANSFER_SPEED || 'FAST';

/**
 * Handle manual bridge request
 * Route: GET /bridge/:chain/:email
 * 
 * @param {string} chain - Source chain (e.g., "BASE-SEPOLIA")
 * @param {string} email - User's email
 * @returns {Promise<object>} Bridge result
 */
export async function handleBridgeRequest(chain, email, isEmailSubscribed) {
  console.log(`\n[API Bridge] ========================================`);
  console.log(`[API Bridge] Manual bridge request`);
  console.log(`[API Bridge] Chain: ${chain}`);
  console.log(`[API Bridge] Email: ${email}`);
  console.log(`[API Bridge] ========================================\n`);

  try {
    // Step 1: Get user from database
    console.log('[API Bridge] Step 1: Fetching user...');
    const user = await getUserByGmail(email);
    if (!user || !user.walletSetId) {
      throw new Error('User not found or missing walletSetId');
    }
    console.log(`[API Bridge] User found: ${user.walletSetId}`);

    // Step 2: Check USDC balance on source chain
    console.log(`[API Bridge] Step 2: Checking USDC balance on ${chain}...`);
    const balance = await getUsdcBalance(chain, user.walletSetId);
    console.log(`[API Bridge] Balance: ${balance} USDC`);

    if (parseFloat(balance) < 0.1) {
      throw new Error(`Insufficient USDC balance: ${balance} USDC (minimum 0.1 USDC required)`);
    }

    let burnTxHash = null;
    let mintTxHash = null;
    let gatewayResult = null;

    // Check if funds are already on ARC-TESTNET
    if (chain === 'ARC-TESTNET') {
      console.log(`[API Bridge] Step 3: Funds already on ARC-TESTNET...`);
      // Create DB entry to track this
      const depositTxId = `deposit_${Date.now()}`;
      await saveTxcoming({
        mail: email,
        walletid: user.walletSetId,
        txhash: depositTxId,
        amount: balance,
        chain: 'ARC-TESTNET',
        sender: 'manual_deposit',
        txtype: 'IN',
        status: 'received'
      });
      // Get the inserted row's id
      const pool = getPool();
      const idRes = await pool.query('SELECT id FROM txcoming WHERE mail = $1 AND txhash = $2 LIMIT 1;', [email, depositTxId]);
      const depositRowId = idRes.rows[0]?.id;
      if (depositRowId) {
        // Update all previous 'STUCK_G' rows for this user to 'completed'
        const updateResult = await updatePreviousStuckGToCompleted(email, depositRowId);
        console.log(`[API Bridge] Updated ${updateResult.updated} previous 'STUCK_G' rows to 'completed' for user ${email}`);
      }
      burnTxHash = depositTxId;
      // Always deposit to Gateway for API calls
      console.log('[API Bridge] Step 4: Depositing to Gateway Wallet...');
      try {
        gatewayResult = await depositToGatewayWallet(balance, user.walletSetId, 'API');
        console.log('[API Bridge] Step 5: Updating status to completed...');
        await updateTxcomingStatus(depositTxId, 'completed');
      } catch (depositError) {
        console.error('[API Bridge] Gateway deposit failed:', depositError?.message);
        await updateTxcomingStatus(depositTxId, 'STUCK_G');
        throw depositError;
      }
    } else {
      // Step 3: Start bridge process
      console.log(`[API Bridge] Step 3: Starting bridge (${balance} USDC)...`);
      
      let bridgeChain = `${chain} → ARC-TESTNET`;

      try {
        const bridgeResult = await bridgeToArc(
          chain,
          balance,
          user.walletSetId,
          'ARC-TESTNET',
          {
            // Callback when burn is confirmed
            onBurnConfirmed: async (burnHash, fromChain) => {
              burnTxHash = burnHash;
              console.log('[API Bridge] Burn confirmed, creating DB entry...');
              // Create new row in txcoming with burn hash
              const saveResult = await saveTxcoming({
                mail: email,
                walletid: user.walletSetId,
                txhash: burnHash,
                amount: balance,
                chain: bridgeChain,
                sender: 'manual_bridge',
                txtype: 'IN',
                status: 'settling'
              });
              // Get the inserted row's id
              const pool = getPool();
              const idRes = await pool.query('SELECT id FROM txcoming WHERE mail = $1 AND txhash = $2 LIMIT 1;', [email, burnHash]);
              const burnRowId = idRes.rows[0]?.id;
              if (burnRowId) {
                // Update all previous 'received' rows for this user to 'bridged'
                const updateResult = await updatePreviousReceivedToBridged(email, burnRowId);
                console.log(`[API Bridge] Updated ${updateResult.updated} previous 'received' rows to 'bridged' for user ${email}`);
              }
              console.log('[API Bridge] DB entry created with status: settling');
            }
          },
          TRANSFER_SPEED
        );

        mintTxHash = bridgeResult.mintTxHash;

        // Step 4: Update status to minted
        if (burnTxHash) {
          console.log('[API Bridge] Step 4: Updating status to minted...');
          await updateTxcomingStatus(burnTxHash, 'minted');
        }

        // Step 5: Update status to bridged
        console.log('[API Bridge] Step 5: Updating status to bridged...');
        await updateTxcomingStatus(burnTxHash, 'bridged');

        // Always deposit to Gateway for API calls
        console.log('[API Bridge] Step 6: Depositing to Gateway Wallet...');
        try {
          gatewayResult = await depositToGatewayWallet(balance, user.walletSetId, 'API');

          console.log('[API Bridge] Step 7: Updating status to completed...');
          await updateTxcomingStatus(burnTxHash, 'completed');
        } catch (depositError) {
          console.error('[API Bridge] Gateway deposit failed:', depositError?.message);
          await updateTxcomingStatus(burnTxHash, 'STUCK_G');
          throw depositError;
        }
      } catch (bridgeError) {
        // Bridge, attestation, or mint failed
        if (burnTxHash) {
          console.error(`[API Bridge] Bridge failed after burn, setting status to stuck`);
          await updateTxcomingStatus(burnTxHash, 'stuck');
          bridgeError.burnTxHash = burnTxHash;
        }
        throw bridgeError;
      }
    }

    const result = {
      success: true,
      chain,
      email,
      amount: balance,
      burnTxHash,
      mintTxHash,
      gatewayApproveTxHash: gatewayResult?.approveTxHash || null,
      gatewayDepositTxHash: gatewayResult?.depositTxHash || null,
      status: 'completed',
      message: 'Bridge and Gateway deposit completed.'
    };

    console.log('\n[API Bridge] ========================================');
    console.log('[API Bridge] ✅ Bridge completed successfully!');
    console.log('[API Bridge] ========================================\n');

    return result;

  } catch (error) {
    console.error('\n[API Bridge] ❌ Bridge failed:', error?.message || error);

    // Update status to fail if we have a burn hash
    if (burnTxHash) {
      try {
        await updateTxcomingStatus(burnTxHash, 'fail');
        console.log('[API Bridge] Updated status to fail in database');
      } catch (dbError) {
        console.error('[API Bridge] Failed to update DB status:', dbError);
      }
    } else if (error.burnTxHash) {
      try {
        await updateTxcomingStatus(error.burnTxHash, 'fail');
        console.log('[API Bridge] Updated status to fail in database');
      } catch (dbError) {
        console.error('[API Bridge] Failed to update DB status:', dbError);
      }
    }

    throw error;
  }
}
