/**
 * Circle Gateway Deposit Operations
 * Deposits USDC into Gateway Wallet on ARC-TESTNET
 */

import "dotenv/config";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { randomUUID } from "crypto";
import { 
  GATEWAY_WALLET_ADDRESS, 
  ARC_USDC_ADDRESS, 
  GATEWAY_WALLET_ABI,
  ERC20_APPROVE_ABI 
} from "./config.js";

const API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET;

if (!API_KEY || !ENTITY_SECRET) {
  console.error("[Gateway] Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET in .env");
}

/**
 * Parse USDC amount to atomic units (6 decimals)
 */
function parseUsdcAmount(amountStr) {
  const [whole, fraction = ""] = amountStr.split(".");
  const fractionPadded = (fraction + "000000").slice(0, 6);
  const normalized = `${whole}${fractionPadded}`.replace(/^0+/, "") || "0";
  return normalized;
}

/**
 * Wait for transaction to complete
 */
async function waitForTransaction(client, txId, description) {
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    const txResponse = await client.getTransaction({ id: txId });
    const txData = txResponse?.data?.transaction || txResponse?.data;
    const state = txData?.state;
    const txHash = txData?.txHash;

    if (state === "COMPLETE" || state === "CONFIRMED") {
      return txHash;
    }

    if (state === "FAILED") {
      throw new Error(`${description} failed`);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    attempts++;
  }

  throw new Error(`${description} timeout`);
}

/**
 * Get ARC-TESTNET wallet for user
 */
async function getArcWallet(client, walletSetId) {
  const res = await client.listWallets({ 
    walletSetId, 
    blockchain: "ARC-TESTNET", 
    pageSize: 10 
  });
  const wallet = res?.data?.wallets?.[0];
  if (!wallet) {
    throw new Error(`No ARC-TESTNET wallet found for wallet set ${walletSetId}`);
  }
  return wallet;
}

/**
 * Approve Gateway Wallet to spend USDC
 */
async function approveGatewayWallet(client, wallet, amount) {
  const amountUnits = parseUsdcAmount(amount);

  const response = await client.createContractExecutionTransaction({
    idempotencyKey: randomUUID(),
    walletId: wallet.id,
    contractAddress: ARC_USDC_ADDRESS,
    abiFunctionSignature: "approve(address,uint256)",
    abiParameters: [GATEWAY_WALLET_ADDRESS, amountUnits],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const approveTxId = response?.data?.id || response?.data?.transaction?.id;
  return approveTxId;
}

/**
 * Deposit USDC into Gateway Wallet
 */
async function depositToGateway(client, wallet, amount) {
  const amountUnits = parseUsdcAmount(amount);

  const response = await client.createContractExecutionTransaction({
    idempotencyKey: randomUUID(),
    walletId: wallet.id,
    contractAddress: GATEWAY_WALLET_ADDRESS,
    abiFunctionSignature: "deposit(address,uint256)",
    abiParameters: [ARC_USDC_ADDRESS, amountUnits],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const depositTxId = response?.data?.id || response?.data?.transaction?.id;
  return depositTxId;
}

/**
 * Main function: Deposit USDC to Gateway Wallet on ARC-TESTNET
 * 
 * @param {string} amount - USDC amount as string (e.g., "1.5")
 * @param {string} walletSetId - User's Circle wallet set ID
 * @param {string} source - Source of the deposit request ("API" or "WS" or custom)
 * @returns {Promise<object>} Deposit result with transaction hashes
 */
export async function depositToGatewayWallet(amount, walletSetId, source = "API") {
  try {
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: API_KEY,
      entitySecret: ENTITY_SECRET,
    });

    const wallet = await getArcWallet(client, walletSetId);
    const approveTxId = await approveGatewayWallet(client, wallet, amount);
    const approveTxHash = await waitForTransaction(client, approveTxId, "Approval");
    const depositTxId = await depositToGateway(client, wallet, amount);
    const depositTxHash = await waitForTransaction(client, depositTxId, "Deposit");

    console.log(`[${source}][Gateway] ✅ Deposit ${amount} USDC -> ${depositTxHash}`);

    return {
      success: true,
      amount,
      walletAddress: wallet.address,
      approveTxHash,
      depositTxHash,
    };
  } catch (error) {
    console.error(`[${source}][Gateway] ❌ Deposit failed:`, error?.message || error);
    throw error;
  }
}
