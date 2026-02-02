/**
 * Attestation API Handler
 * Manually retrieve attestation and mint for a burn transaction
 */

import { getUserByGmail, updateTxcomingStatus, getTransactionByBurnHash, saveTxcoming } from '../db.js';
import { retrieveAttestation, mintUSDC, getWallet, waitForTransaction } from '../bridge/operations.js';
import { depositToGatewayWallet } from '../gateway/deposit.js';
import { chainMap, CCTP_CONTRACTS } from '../bridge/contracts.js';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

const API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET;

/**
 * Handle manual attestation and mint request
 * Route: GET /api/attest/:burnHash/:route/:email
 * 
 * @param {string} burnHash - Burn transaction hash
 * @param {string} route - Route (e.g., "BASE-SEPOLIA-ARC-TESTNET")
 * @param {string} email - User's email
 * @param {function} isEmailSubscribed - Function to check if email is subscribed
 * @returns {Promise<object>} Attestation result
 */
export async function handleAttestationRequest(burnHash, route, email, isEmailSubscribed) {
  console.log(`\n[Attest API] ========================================`);
  console.log(`[Attest API] Manual attestation request`);
  console.log(`[Attest API] Burn Hash: ${burnHash}`);
  console.log(`[Attest API] Route: ${route}`);
  console.log(`[Attest API] Email: ${email}`);
  console.log(`[Attest API] ========================================\n`);

  try {
    // Step 1: Get transaction from database using burn hash
    console.log('[Attest API] Step 1: Fetching transaction from database...');
    const txRecord = await getTransactionByBurnHash(burnHash);
    if (!txRecord) {
      throw new Error(`Transaction not found for burn hash: ${burnHash}`);
    }
    console.log(`[Attest API] Transaction found:`, txRecord);

    // Step 2: Verify email matches
    if (txRecord.mail.toLowerCase() !== email.toLowerCase()) {
      throw new Error(`Email mismatch: ${txRecord.mail} !== ${email}`);
    }

    // Step 3: Parse route to get source and destination chains
    // Route format: BASE_SEPOLIA-ARC_TESTNET (underscore within chain name, hyphen between chains)
    const [fromChainRaw, toChainRaw] = route.split('-');
    const fromChain = fromChainRaw ? chainMap[fromChainRaw.toUpperCase().replace(/_/g, '-')] || fromChainRaw.replace(/_/g, '-') : null;
    const toChain = toChainRaw ? chainMap[toChainRaw.toUpperCase().replace(/_/g, '-')] || toChainRaw.replace(/_/g, '-') : null;

    if (!fromChain || !toChain) {
      throw new Error(`Invalid route: ${route}. Use format: BASE_SEPOLIA-ARC_TESTNET`);
    }

    console.log(`[Attest API] Step 3: Parsed route - From: ${fromChain}, To: ${toChain}`);

    // Step 4: Retrieve attestation using domain ID
    console.log(`[Attest API] Step 4: Retrieving attestation for burn hash...`);
    const sourceDomain = CCTP_CONTRACTS[fromChain].domain;
    const attestation = await retrieveAttestation(sourceDomain, burnHash);
    console.log(`[Attest API] Attestation retrieved successfully`);

    // Step 5: Initialize Circle client and get wallet for minting
    console.log(`[Attest API] Step 5: Initializing Circle client...`);
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: ENTITY_SECRET,
    });

    const toWallet = await getWallet(client, txRecord.walletid, toChain);
    console.log(`[Attest API] To Wallet: ${toWallet.address}`);

    // Step 6: Mint USDC on destination chain
    console.log(`[Attest API] Step 6: Minting USDC on ${toChain}...`);
    const mintTxId = await mintUSDC(
      client,
      toWallet,
      toChain,
      attestation
    );
    const mintTxHash = await waitForTransaction(client, mintTxId, 'Mint');
    console.log(`[Attest API] Mint successful! Tx: ${mintTxHash}`);

    // Step 7: Update DB status to 'bridged'
    console.log('[Attest API] Step 7: Updating DB status to bridged...');
    await updateTxcomingStatus(burnHash, 'bridged');

    // Step 8: Create new row with manual_attest sender
    console.log('[Attest API] Step 8: Creating attestation record...');
    const attestTxId = `attest_${Date.now()}`;
    await saveTxcoming({
      mail: email,
      walletid: txRecord.walletid,
      txhash: attestTxId,
      amount: txRecord.amount,
      chain: toChain,
      sender: 'manual_attest',
      txtype: 'IN',
      status: 'bridged'
    });

    // Step 9: Always deposit to Gateway (mint happened, funds are on ARC)
    console.log('[Attest API] Step 9: Depositing to Gateway...');
    let gatewayResult = null;
    
    try {
      gatewayResult = await depositToGatewayWallet(txRecord.amount, txRecord.walletid, 'API');

      // Step 10: Update both records to 'completed'
      console.log('[Attest API] Step 10: Updating DB status to completed...');
      await updateTxcomingStatus(burnHash, 'completed');
      await updateTxcomingStatus(attestTxId, 'completed');
    } catch (depositError) {
      console.error('[Attest API] Gateway deposit failed:', depositError?.message);
      await updateTxcomingStatus(burnHash, 'STUCK_G');
      await updateTxcomingStatus(attestTxId, 'STUCK_G');
      throw depositError;
    }

    const result = {
      success: true,
      burnHash,
      route,
      email,
      amount: txRecord.amount,
      mintTxHash,
      attestTxId,
      gatewayApproveTxHash: gatewayResult?.approveTxHash || null,
      gatewayDepositTxHash: gatewayResult?.depositTxHash || null,
      status: 'completed',
      message: 'Attestation, mint, and Gateway deposit completed.'
    };

    console.log('\n[Attest API] ========================================');
    console.log('[Attest API] ✅ Attestation completed successfully!');
    console.log('[Attest API] ========================================\n');

    return result;

  } catch (error) {
    console.error('\n[Attest API] ❌ Attestation failed:', error?.message || error);

    // Update original transaction status to STUCK if attest/mint fails
    try {
      await updateTxcomingStatus(burnHash, 'STUCK');
    } catch (dbError) {
      console.error('[Attest API] Failed to update status to STUCK:', dbError);
    }

    throw error;
  }
}
