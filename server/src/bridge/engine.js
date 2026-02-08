/**
 * CCTP Bridge Engine - Main Function
 * Bridges USDC from any supported chain to ARC-TESTNET
 */

import "dotenv/config";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { normalizeChainName, CCTP_CONTRACTS } from "./contracts.js";
import {
  getWallet,
  waitForTransaction,
  approveUSDC,
  burnUSDC,
  retrieveAttestation,
  mintUSDC,
} from "./operations.js";

const API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET;

if (!API_KEY || !ENTITY_SECRET) {
  console.error("[Bridge] Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET in .env");
}

/**
 * Bridge USDC from source chain to ARC-TESTNET
 * 
 * @param {string} fromChain - Source chain (e.g., "AVAX-FUJI", "BASE-SEPOLIA")
 * @param {string} amount - USDC amount as string (e.g., "1.5")
 * @param {string} walletSetId - User's Circle wallet set ID
 * @param {string} [toChain="ARC-TESTNET"] - Destination chain (defaults to ARC-TESTNET)
 * @param {object} [callbacks] - Optional callbacks for status updates {onBurnConfirmed}
 * @returns {Promise<object>} Bridge result with transaction hashes
 */
export async function bridgeToArc(fromChain, amount, walletSetId, toChain = "ARC-TESTNET", callbacks = {}) {
  console.log("\n[Bridge] ===============================================");
  console.log(`[Bridge] 🌉 Starting CCTP Bridge`);
  console.log(`[Bridge] From: ${fromChain} → To: ${toChain}`);
  console.log(`[Bridge] Amount: ${amount} USDC`);
  console.log(`[Bridge] Wallet Set ID: ${walletSetId}`);
  console.log("[Bridge] ===============================================\n");

  try {
    // Normalize chain names
    const normalizedFromChain = normalizeChainName(fromChain);
    const normalizedToChain = normalizeChainName(toChain);

    // Initialize Circle client
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: ENTITY_SECRET,
    });

    // Get wallets for both chains
    console.log(`[Bridge] Fetching wallets for ${normalizedFromChain} and ${normalizedToChain}...`);
    const fromWallet = await getWallet(client, walletSetId, normalizedFromChain);
    const toWallet = await getWallet(client, walletSetId, normalizedToChain);

    console.log(`[Bridge] From Wallet: ${fromWallet.address}`);
    console.log(`[Bridge] To Wallet: ${toWallet.address}`);

    // Step 1: Approve USDC
    const approveTxId = await approveUSDC(client, fromWallet, normalizedFromChain, amount);
    const approveTxHash = await waitForTransaction(client, approveTxId, "Approval");

    // Step 2: Burn USDC
    const burnTxId = await burnUSDC(
      client,
      fromWallet,
      normalizedFromChain,
      normalizedToChain,
      amount,
      toWallet.address
    );
    const burnTxHash = await waitForTransaction(client, burnTxId, "Burn");

    // BURN CONFIRMED - Call callback if provided
    if (callbacks.onBurnConfirmed) {
      await callbacks.onBurnConfirmed(burnTxHash, normalizedFromChain);
    }

    // Step 3: Get Attestation
    try {
      const sourceDomain = CCTP_CONTRACTS[normalizedFromChain].domain;
      const attestation = await retrieveAttestation(sourceDomain, burnTxHash);

      // Step 4: Mint USDC
      const mintTxId = await mintUSDC(client, toWallet, normalizedToChain, attestation);
      const mintTxHash = await waitForTransaction(client, mintTxId, "Mint");

      const result = {
        success: true,
        fromChain: normalizedFromChain,
        toChain: normalizedToChain,
        amount,
        approveTxHash,
        burnTxHash,
        mintTxHash,
        attestation: {
          message: attestation.message,
          attestation: attestation.attestation,
        },
      };

      console.log("\n[Bridge] ===============================================");
      console.log("[Bridge] ✅ Bridge completed successfully!");
      console.log("[Bridge] ===============================================\n");

      return result;
    } catch (error) {
      // Attestation or Mint failed, but we have burnTxHash
      console.error("\n[Bridge] ❌ Bridge Error at Step 3/4:", error?.message || error);
      const errorInfo = {
        burnTxHash,
        fromChain: normalizedFromChain,
        step: error?.message?.includes("Attestation") ? "attestation" : "mint"
      };
      throw Object.assign(new Error(error.message), errorInfo);
    }
  } catch (error) {
    console.error("\n[Bridge] ❌ Bridge Error:", error?.message || error);
    throw error;
  }
}

/**
 * Resume bridge from burn transaction (attestation + mint only)
 * 
 * @param {string} fromChain - Source chain
 * @param {string} burnTxHash - Burn transaction hash (0x...)
 * @param {string} walletSetId - User's Circle wallet set ID
 * @param {string} [toChain="ARC-TESTNET"] - Destination chain
 * @returns {Promise<object>} Bridge result with mint transaction hash
 */
export async function resumeBridge(fromChain, burnTxHash, walletSetId, toChain = "ARC-TESTNET") {
  console.log("\n[Bridge] ===============================================");
  console.log(`[Bridge] 🔄 Resuming CCTP Bridge`);
  console.log(`[Bridge] From: ${fromChain} → To: ${toChain}`);
  console.log(`[Bridge] Burn TX: ${burnTxHash}`);
  console.log("[Bridge] ===============================================\n");

  try {
    const normalizedFromChain = normalizeChainName(fromChain);
    const normalizedToChain = normalizeChainName(toChain);

    const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: ENTITY_SECRET,
    });

    const toWallet = await getWallet(client, walletSetId, normalizedToChain);
    console.log(`[Bridge] To Wallet: ${toWallet.address}`);

    const sourceDomain = CCTP_CONTRACTS[normalizedFromChain].domain;
    const attestation = await retrieveAttestation(sourceDomain, burnTxHash);

    const mintTxId = await mintUSDC(client, toWallet, normalizedToChain, attestation);
    const mintTxHash = await waitForTransaction(client, mintTxId, "Mint");

    const result = {
      success: true,
      fromChain: normalizedFromChain,
      toChain: normalizedToChain,
      burnTxHash,
      mintTxHash,
    };

    console.log("\n[Bridge] ===============================================");
    console.log("[Bridge] ✅ Bridge resumed and completed!");
    console.log("[Bridge] ===============================================\n");

    return result;
  } catch (error) {
    console.error("\n[Bridge] ❌ Resume Error:", error?.message || error);
    throw error;
  }
}
